# 流程条件分支设计

日期：2026-07-14  
状态：已确认；实现计划见 `docs/superpowers/plans/2026-07-14-workflow-condition-branch.md`

## 背景

现有工作流为「画布 DAG + 引擎线性 `nodes`（含 `parallel`）」双模型。画布一源多出边一律编译为 **并行（AND，全跑）**，无法表达 **XOR 条件选路**。产品需要：If/Else、多路 Switch、以及 Agent/LLM 选路，且支路必须汇合。

## 目标

- 新增统一控制节点 `condition`，支持两种判定模式：`expression`（表单 / 短表达式）与 `agent`（LLM 输出 case key）
- 支持 If/Else（`true`/`false`）与 Switch（多 case + 可选 default）
- 画布用带 `branchKey` 的标注出边表达支路；无标注多出线仍为 parallel
- 各支路必须汇合到同一后续节点（或全部结束）
- 未选中支路在任务清单标记 `skipped`
- UI 对齐技能市场/现有画布气质

## 非目标（首版）

- 支路内嵌套 `condition` / `parallel`
- 不汇合的开放分叉
- 运行时由用户点选支路
- 完整脚本语言 / 任意 JS 求值
- 重写为纯图游走引擎

## 决策摘要

| 项 | 选择 |
|----|------|
| 能力范围 | If/Else + Switch + Agent 选路 |
| 节点形态 | 统一 `condition`，模式切换 |
| 拓扑 | 必须汇合 |
| 表达式 UI | 表单为主，可选高级短表达式覆盖表单 |
| 引擎结构 | 结构化 `condition`（对齐 `parallel`），非整图游走 |

---

## 1. 数据模型

### 1.1 条件节点

```ts
type WorkflowConditionMode = 'expression' | 'agent'

/** 表单条件；填写 expression 时优先用短表达式 */
interface WorkflowConditionWhen {
  expression?: string
  contextKey?: string
  op?: 'eq' | 'neq' | 'truthy' | 'falsy'
  value?: string | number | boolean
}

interface WorkflowConditionCase {
  key: string
  label?: string
  nodes: WorkflowLeafNode[]
}

interface WorkflowConditionNode {
  id: string
  type: 'condition'
  title: string
  mode: WorkflowConditionMode
  when?: WorkflowConditionWhen
  prompt?: string
  toolWhitelist?: string[]
  cases: WorkflowConditionCase[]
  defaultKey?: string
}

type WorkflowNode = WorkflowLeafNode | WorkflowParallelNode | WorkflowConditionNode
```

约定：

- **If/Else**：`cases` 含 `key: "true" | "false"`；`when` 求值为布尔后映射
- **Switch**：`when.contextKey`（或 expression）结果与 `case.key` 字符串匹配
- **Agent**：模型输出必须落在某个 `cases[].key`，否则 `defaultKey`，再无则 run failed
- `cases[].nodes` 首版仅 `WorkflowLeafNode`，禁止嵌套 condition/parallel
- **权威来源**：画布拓扑决定各 `cases[].nodes`（与今日 parallel 由多出边编译一致）；编辑弹窗只维护元数据（mode / when / prompt / case key·label / defaultKey）。保存时编译写回 `nodes`；弹窗不提供「在表单里拖拽子步骤列表」。

### 1.2 画布节点（React Flow）

- 新增 node type `workflowCondition`（与叶子 `workflow` 并列）
- `data` 持有完整 `WorkflowConditionNode` 的元数据；`cases[].nodes` 在编辑期可为空数组，以编译结果为准
- 条件节点本身占画布坐标；支路上的叶子仍为独立 RF 节点，靠带 `branchKey` 的边挂到条件出口

### 1.3 画布边

```ts
interface WorkflowCanvasEdge {
  id: string
  source: string
  target: string
  /** 从 condition 节点出发时必填，对应 case.key */
  branchKey?: string
}
```

### 1.4 任务状态

```ts
type TaskItemStatus = 'pending' | 'running' | 'done' | 'failed' | 'skipped'
```

---

## 2. 编译（画布 ↔ 引擎）

文件：`src/features/workflows/utils/workflowCanvasGraph.ts`

### 正向 `compileCanvasToWorkflowNodes`

1. 识别：出边带 `branchKey` 的源节点对应引擎中的 `condition`（节点元数据来自画布 node data / 持久化 definition）。
2. 按 `branchKey` 分组，从各出边走到汇合点之前路径 → `cases[].nodes`（有序叶子）。
3. 校验失败则抛错/返回 error（UI 红条，**不覆盖**旧 `engineNodes`）：
   - 出边 `branchKey` 与 `cases[].key` 一致且齐全
   - 支路后继交集恰好 1 个汇合点，或全部无后继
   - 支路内无未支持的嵌套控制结构
4. 无 `branchKey` 的一源多出 → 仍编译为 `parallel`（现有规则不变）。

### 逆向 `queryCanvasFromNodes`

将 `condition` 画成横向扇出 + 汇合，边 label = `branchKey`（或 `case.label`）。

---

## 3. 引擎执行

文件：`electron/main/workflow/engine.ts` + 新 `evaluate-condition.ts`

```
遇到 condition:
  1. 选出 key
     - expression：短表达式优先，否则 form(op/contextKey/value)
     - agent：受限 LLM，仅输出已有 case key
  2. 无匹配 → defaultKey；仍无 → failed
  3. 串行执行选中 case.nodes
  4. 其余 case 叶子 TaskItem → skipped
  5. 继续顶层汇合后节点
```

### 短表达式白名单

允许：`context.xxx`、字面量（string/number/boolean）、`==` `!=` `>` `>=` `<` `<=`、`&&` `||` `!`、括号。  
禁止：函数调用、任意属性链、赋值、循环。求值失败 → run failed，附可读错误。

### Context 旁路

可选写入 `context.__branchKeys[conditionId] = selectedKey`，便于调试与下游插值。

### Resume

`cursorNodeId` 可指向 condition id 或支路叶 id；resume 粒度与 parallel 一致——从所属**顶层**下标重试。

### Store 兼容

`electron/main/store/workflows.ts` 的 `normalizeNode` 必须识别 `condition`；未知类型不得静默降级导致丢数据。

---

## 4. UI

风格：对齐技能市场与现有画布（克制节点、少按钮、双击编辑）。

| 区域 | 行为 |
|------|------|
| 工具栏 | 新增「条件分支」；默认 If/Else（true/false）+ expression |
| 节点 | `WorkflowConditionFlowNode`：多出口 Handle，标注 key/label |
| 连线 | 从条件 Handle 拉出的边自动带 `branchKey`；改 case key 同步边 |
| 编辑弹窗 | 模式、If/Else\|Switch、表单条件、高级表达式、Agent prompt、case 列表、default、汇合提示 |
| 文案 | 「带标签多出线 = 条件分支；无标签多出线 = 并行」 |
| 任务清单 | `skipped` 灰显「已跳过」 |

### 涉及文件（预期）

| 层 | 路径 |
|----|------|
| 类型 | `shared/types.ts` |
| 工厂/标签 | `src/features/workflows/types.ts` |
| 编译 | `src/features/workflows/utils/workflowCanvasGraph.ts` |
| 画布 | `WorkflowCanvas.tsx`、新 Condition 节点组件、EditModal |
| 引擎 | `electron/main/workflow/engine.ts`、`evaluate-condition.ts` |
| Store | `electron/main/store/workflows.ts` |
| 任务 UI | `TaskChecklist.tsx` |
| 文档 | 相关 skill / README 若描述节点类型则同步 |

---

## 5. 错误处理

| 情况 | 行为 |
|------|------|
| 编译校验失败 | 保存 canvas，保留旧 nodes，红条提示 |
| 表达式非法 / 求值失败 | run `failed`，`errorMessage` 可读 |
| Agent 输出非法 key 且无 default | run `failed` |
| 缺汇合点 | 编译失败，不可运行 |

---

## 6. 验收

- [ ] 画布可添加条件节点，If/Else 与 Switch 可配置并保存
- [ ] expression 表单与高级短表达式均可正确选路
- [ ] agent 模式可输出 case key 并只执行该支路
- [ ] 未选中支路任务为 `skipped`；选中支路正常 done/failed
- [ ] 无 `branchKey` 的多出线仍编译为 parallel，行为不变
- [ ] 未汇合时编译报错且不覆盖旧 engine nodes
- [ ] 读盘含 `condition` 的流程不丢失字段
- [ ] 样式与技能市场页一致，全屏编辑仍可用

## 7. 测试计划（冒烟）

1. 新建流程：工具节点写入 `context.ok=true` → condition If/Else → 两支不同 Agent → 汇合 await
2. 运行：仅 true 支路执行，false 为 skipped
3. Switch：三 case + default，改 context 值验证选路
4. Agent 模式：prompt 要求选 `a`/`b`，验证跳转
5. 删掉汇合边：红条、保存后重开 canvas 仍在、engine 未变
6. 旧流程（仅 parallel）回归运行一次
