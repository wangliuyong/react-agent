# Workflow Condition Branch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为流程编排增加统一 `condition` 节点，支持 If/Else、Switch、Agent 选路（XOR），支路必须汇合；未选中支路任务标记 `skipped`。

**Architecture:** 与现有 `parallel` 同构——画布 DAG 编译为顶层线性 `nodes` 中的结构化 `WorkflowConditionNode`；边用 `branchKey` 区分条件出口与并行AND；求值逻辑放 `shared/` 供主进程引擎使用；UI 在 `features/workflows` 下新增独立条件节点组件与编辑表单，样式对齐技能市场 `--db-*` token。

**Tech Stack:** Electron + React 19、Ant Design 5、`@xyflow/react`、Zustand、TypeScript；验证以 `pnpm typecheck` + 手测冒烟为主（仓库无 vitest）。

## Global Constraints

- Spec：`docs/superpowers/specs/2026-07-14-workflow-condition-branch-design.md`
- API 命名：读 `query*`，写 `post*`（本功能若只改现有 `postWorkflow` / 引擎内部函数，不新增 IPC）
- 优先 Ant Design 内置组件；图标依赖 `unplugin-auto-import`（文件已有显式 import 则保持一致）
- **UI 必须对齐技能市场 / 现有画布**（`--db-*`、克制节点），禁止另起一套「landing 大胆风」；frontend-design 仅用于微调层次与微交互，不换品牌方向
- 工程分层：逻辑进 `shared/` 或 `features/workflows/utils/`；展示组件只收 props；新 UI 放 `features/workflows/components/<Name>/` 并用 barrel `index.ts`
- 首版：支路仅叶子、必须汇合、不嵌套 condition/parallel
- 无 `branchKey` 的一源多出线仍为 parallel（回归不能破）
- 注释写清「为什么」（条件边 vs 并行边、表达式白名单）
- 验证：`pnpm typecheck`；手测见各 Task 末尾与 Spec §7

## File Structure

| 文件 | 职责 |
|------|------|
| Modify: `shared/types.ts` | `condition` 类型、`branchKey`、`TaskItemStatus` 含 `skipped` |
| Create: `shared/evaluate-workflow-condition.ts` | 表单 / 短表达式求值 + 选出 case key（纯函数） |
| Modify: `src/features/workflows/types.ts` | `createConditionNode`、标签、`isLeafNode` 不变 |
| Modify: `electron/main/store/workflows.ts` | normalize condition + edge.branchKey |
| Modify: `src/features/workflows/utils/workflowCanvasGraph.ts` | 编译 / 逆向 / apply 支持 condition |
| Modify: `electron/main/workflow/engine.ts` | 执行 condition、flatten/resume/`skipped` |
| Create: `src/features/workflows/components/WorkflowConditionFlowNode/*` | 画布条件节点（多出口 Handle） |
| Modify: `src/features/workflows/components/WorkflowFlowNode/*` | 仅叶子；保持现状 |
| Modify: `src/features/workflows/components/WorkflowNodeEditModal/*` | 条件元数据表单；或拆 `WorkflowConditionEditForm` |
| Modify: `src/features/workflows/components/WorkflowCanvas/*` | 双 nodeTypes、添加条件、连线写 branchKey |
| Modify: `src/features/workflows/components/WorkflowCanvasDrawer/*` | 「添加节点」菜单增加条件分支 |
| Modify: `src/features/chat/components/TaskChecklist/*` | `skipped` 展示 |
| Modify: skill / README（若列出节点类型） | 同步文档 |

---

### Task 1: 共享类型与工厂

**Files:**
- Modify: `shared/types.ts`
- Modify: `src/features/workflows/types.ts`

**Interfaces:**
- Produces:

```ts
export type WorkflowConditionMode = 'expression' | 'agent'

export interface WorkflowConditionWhen {
  expression?: string
  contextKey?: string
  op?: 'eq' | 'neq' | 'truthy' | 'falsy'
  value?: string | number | boolean
}

export interface WorkflowConditionCase {
  key: string
  label?: string
  nodes: WorkflowLeafNode[]
}

export interface WorkflowConditionNode {
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

export type WorkflowNode = WorkflowLeafNode | WorkflowParallelNode | WorkflowConditionNode

export interface WorkflowCanvasEdge {
  id: string
  source: string
  target: string
  branchKey?: string
}

export type TaskItemStatus = 'pending' | 'running' | 'done' | 'failed' | 'skipped'
```

- [ ] **Step 1: 在 `shared/types.ts` 于 `WorkflowParallelNode` 后插入条件类型**，扩展 `WorkflowNode`、`WorkflowCanvasEdge`、`TaskItemStatus`；`TaskItem.parentId` 注释改为「parallel / condition 子步」。

- [ ] **Step 2: 更新 `src/features/workflows/types.ts`**

```ts
export function createConditionNode(
  partial?: Partial<WorkflowConditionNode>
): WorkflowConditionNode {
  return {
    id: crypto.randomUUID(),
    type: 'condition',
    title: partial?.title ?? '条件分支',
    mode: partial?.mode ?? 'expression',
    when: partial?.when ?? { contextKey: '', op: 'truthy' },
    prompt: partial?.prompt,
    toolWhitelist: partial?.toolWhitelist,
    cases: partial?.cases?.length
      ? partial.cases.map((c) => ({ ...c, nodes: c.nodes ? [...c.nodes] : [] }))
      : [
          { key: 'true', label: '是', nodes: [] },
          { key: 'false', label: '否', nodes: [] }
        ],
    defaultKey: partial?.defaultKey
  }
}

export function createEmptyNode(type: WorkflowNode['type']): WorkflowNode {
  if (type === 'tool') return createToolNode()
  if (type === 'await_user') return createAwaitNode()
  if (type === 'parallel') return createParallelNode()
  if (type === 'condition') return createConditionNode()
  return createAgentNode()
}

export function queryNodeTypeLabel(type: WorkflowNode['type']): string {
  const map: Record<WorkflowNode['type'], string> = {
    agent: 'Agent',
    tool: '工具',
    await_user: '确认',
    parallel: '并行组',
    condition: '条件分支'
  }
  return map[type]
}
```

- [ ] **Step 3: `pnpm typecheck`**  
  Expected: 可能因其它文件尚未处理 `condition` 报错；若仅 `types` 被引用处 exhaustive switch 失败，先修明显漏分支（如 `queryNodeTypeLabel` 的别处 `Record`），其余在后续 Task 修。目标本 Task：类型定义与工厂无自相矛盾。

- [ ] **Step 4: Commit**

```bash
git add shared/types.ts src/features/workflows/types.ts
git commit -m "$(cat <<'EOF'
feat(workflow): add condition node types and factory

EOF
)"
```

---

### Task 2: 条件求值纯函数（shared）

**Files:**
- Create: `shared/evaluate-workflow-condition.ts`

**Interfaces:**
- Consumes: `WorkflowConditionNode`、`WorkflowConditionWhen` from `@shared/types`（相对 path 按仓库 tsconfig：`shared/` 别名或相对引用，与 `interpolate` 同类文件一致——查 `electron` 如何 import shared，沿用同一路径写法）
- Produces:

```ts
export function queryConditionCaseKey(
  node: WorkflowConditionNode,
  context: Record<string, unknown>,
  agentSelectedKey?: string
): { key: string } | { error: string }

export function queryEvaluateWhen(
  when: WorkflowConditionWhen | undefined,
  context: Record<string, unknown>
): { value: unknown } | { error: string }
```

- [ ] **Step 1: 实现短表达式求值（白名单）**

规则（写在文件头注释）：
- 仅允许 `context.标识符`、字符串/数字/布尔字面量、`== != > >= < <= && || !`、括号
- 禁止函数调用、赋值、任意下标
- 建议：tokenize → recursive descent；失败返回 `{ error: '...' }`

表单路径：
- `op === 'truthy'|'falsy'`：读 `context[contextKey]`
- `eq`/`neq`：与 `value` 做松散相等（`String` / 数字归一化：若双方可解析为 number 则比数字，否则比字符串）

`queryConditionCaseKey`：
- `mode === 'agent'`：用 `agentSelectedKey`；若不在 cases → `defaultKey`；仍无 → error
- `mode === 'expression'`：若 `when.expression` trim 非空则求值；布尔结果映射 `"true"`/`"false"`（若 cases 含这两 key）；否则若结果为 string/number 则 `String(value)` 匹配 case.key；无匹配 → defaultKey

```ts
// 核心签名示例（完整实现落在文件内）
export function queryConditionCaseKey(
  node: WorkflowConditionNode,
  context: Record<string, unknown>,
  agentSelectedKey?: string
): { key: string } | { error: string } {
  if (node.mode === 'agent') {
    const raw = (agentSelectedKey ?? '').trim()
    if (node.cases.some((c) => c.key === raw)) return { key: raw }
    if (node.defaultKey && node.cases.some((c) => c.key === node.defaultKey)) {
      return { key: node.defaultKey }
    }
    return { error: `Agent 未选出有效分支（得到: ${raw || '空'}）` }
  }
  const evaluated = queryEvaluateWhen(node.when, context)
  if ('error' in evaluated) return evaluated
  // ... map to case key ...
}
```

- [ ] **Step 2: 自检（无测试框架时用临时断言脚本）**

在仓库根执行（实现后把脚本删掉或留 `scripts/smoke-evaluate-condition.mjs` 仅开发用，**不要**提交含敏感信息的脚本；推荐内联 node 一次）：

```bash
# 若 evaluate 被 tsc 编进 out，则对该 JS 做 require；否则在实现后用 typecheck 保证签名，并在下面 Expected 手算：
# when: { contextKey: 'ok', op: 'truthy' }, context { ok: 1 } → key "true"
# expression: 'context.status == "a"' + cases a/b → key "a"
```

Expected 手算通过即可；若添加 `scripts/smoke-evaluate-condition.mjs` 用纯 JS 复制核心逻辑验证，可选。

- [ ] **Step 3: `pnpm typecheck`**  
  Expected: PASS（shared 被 node/web 引用路径正确）

- [ ] **Step 4: Commit**

```bash
git add shared/evaluate-workflow-condition.ts
git commit -m "$(cat <<'EOF'
feat(workflow): add shared condition evaluators

EOF
)"
```

---

### Task 3: Store normalize 兼容

**Files:**
- Modify: `electron/main/store/workflows.ts`

**Interfaces:**
- Consumes: Task 1 types
- Produces: 读盘不丢 `condition` / `branchKey`

- [ ] **Step 1: `normalizeNode` 增加 `condition` 分支**

```ts
function normalizeCondition(raw: WorkflowConditionNode): WorkflowConditionNode {
  const cases = Array.isArray(raw.cases)
    ? raw.cases
        .filter((c) => c && String(c.key || '').trim())
        .map((c) => ({
          key: String(c.key).trim(),
          label: c.label != null ? String(c.label) : undefined,
          nodes: Array.isArray(c.nodes)
            ? c.nodes
                .filter(
                  (n): n is WorkflowLeafNode =>
                    n != null &&
                    (n.type === 'agent' || n.type === 'tool' || n.type === 'await_user')
                )
                .map(normalizeLeaf)
            : []
        }))
    : []
  return {
    id: String(raw.id || '').trim() || crypto.randomUUID(),
    type: 'condition',
    title: String(raw.title || '').trim() || '条件分支',
    mode: raw.mode === 'agent' ? 'agent' : 'expression',
    when: raw.when && typeof raw.when === 'object' ? { ...raw.when } : undefined,
    prompt: raw.prompt != null ? String(raw.prompt) : undefined,
    toolWhitelist: Array.isArray(raw.toolWhitelist)
      ? raw.toolWhitelist.map(String)
      : undefined,
    cases: cases.length
      ? cases
      : [
          { key: 'true', label: '是', nodes: [] },
          { key: 'false', label: '否', nodes: [] }
        ],
    defaultKey: raw.defaultKey != null ? String(raw.defaultKey) : undefined
  }
}
```

在 `normalizeNode` 顶部：`if (raw.type === 'condition') return normalizeCondition(raw as WorkflowConditionNode)`。

- [ ] **Step 2: `normalizeCanvas` 保留 `branchKey`**

```ts
.map((e) => ({
  id: String(e.id || `e_${e.source}_${e.target}`),
  source: String(e.source),
  target: String(e.target),
  ...(e.branchKey != null && String(e.branchKey).trim()
    ? { branchKey: String(e.branchKey).trim() }
    : {})
}))
```

- [ ] **Step 3: `pnpm typecheck`** — Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add electron/main/store/workflows.ts
git commit -m "$(cat <<'EOF'
feat(workflow): normalize condition nodes and branchKey edges

EOF
)"
```

---

### Task 4: 画布编译器支持 condition

**Files:**
- Modify: `src/features/workflows/utils/workflowCanvasGraph.ts`
- 可能 Modify: `src/features/workflows/components/WorkflowCanvas/WorkflowCanvas.tsx` 的调用签名（若本 Task 只改 utils，调用方编译错误留到 Task 7 一起改——**本 Task 必须同步改 `applyCanvasToDefinition` 签名与 Canvas 调用处最小修复**，避免长期坏掉 typecheck）

**Interfaces:**
- Consumes: `WorkflowConditionNode`, `branchKey`
- Produces:

```ts
export function compileCanvasToWorkflowNodes(
  leaves: WorkflowLeafNode[],
  conditions: WorkflowConditionNode[],
  canvas: WorkflowCanvas
): { nodes: WorkflowNode[]; error?: string }

export function applyCanvasToDefinition(
  leaves: WorkflowLeafNode[],
  conditions: WorkflowConditionNode[],
  canvas: WorkflowCanvas
): { nodes: WorkflowNode[]; canvas: WorkflowCanvas; error?: string }

export function queryCanvasFromNodes(nodes: WorkflowNode[]): WorkflowCanvas
export function flattenWorkflowLeaves(nodes: WorkflowNode[]): WorkflowLeafNode[]
/** 新增：收集引擎里的 condition（cases.nodes 清空用于编辑态 meta） */
export function flattenWorkflowConditions(nodes: WorkflowNode[]): WorkflowConditionNode[]
```

- [ ] **Step 1: 扩展邻接**  
  节点全集 = leaf ids ∪ condition ids。边校验两端都在全集。`detectCycle` 用全集。

- [ ] **Step 2: 编译规则（在现有 while frontier 中增加）**

当前沿为**单个 condition id** `cid`：
1. 取 meta：`conditions` 中 id 匹配者（深拷贝 cases，nodes 先空）
2. 出边按 `branchKey` 分组；每个 key 必须 ∈ cases；缺边或未知 key → error
3. 对每个 `branchKey`，从直接 target 沿**唯一后继链**收集叶子，直到：
   - 下一节点是汇合候选，或
   - 无出边  
   链上若出现其它 condition / 多出边未标注 → error（首版）
4. 各支路终端出边的交集须恰好 1 个 join（或全无后继）——文案：`条件分支须汇合到同一个后续节点，或各分支均为结束节点`
5. `result.push(filledCondition)`；`frontier = [join]` 或 `[]`
6. 消费 case 内叶子 id（`consumed`）

当前沿为叶子且多出边：
- 若**全部出边都有** `branchKey` → **不应发生**（条件出口应从 condition 节点出发）。若 source 是叶子却带 branchKey → error：`仅条件节点可使用分支连线`
- 若**全部无** `branchKey` → 现有 parallel 逻辑
- 若部分有部分无 → error：`同一节点的出线不能混用并行与条件分支`

- [ ] **Step 3: `queryCanvasFromNodes`**  
  遇到 `condition`：条件节点坐标一行；各 case 第一叶（或唯一叶）横向排布；边 `source=conditionId, target=firstLeaf, branchKey=case.key`；case 内后续叶子纵向串；最后各 case 末叶 → join。position 使用现有 `COL_GAP`/`ROW_GAP`。

- [ ] **Step 4: `resolveWorkflowCanvas` / `flattenWorkflowLeaves`**  
  leaves 仍只含叶子；positions 需包含 condition id；滤边时 idSet = leaves ∪ conditions。

- [ ] **Step 5: 更新所有调用方签名**（`WorkflowCanvas.tsx` 的 `emitChange` / `applyCanvasToDefinition`）使 `pnpm typecheck` 能过（Canvas UI 完整行为在 Task 7）。

- [ ] **Step 6: Commit**

```bash
git add src/features/workflows/utils/workflowCanvasGraph.ts src/features/workflows/components/WorkflowCanvas/WorkflowCanvas.tsx
git commit -m "$(cat <<'EOF'
feat(workflow): compile canvas condition branches with join check

EOF
)"
```

---

### Task 5: 引擎执行 condition

**Files:**
- Modify: `electron/main/workflow/engine.ts`
- 必要时 Create thin helper 同文件内 `executeConditionNode`

**Interfaces:**
- Consumes: `queryConditionCaseKey` from `shared/evaluate-workflow-condition.ts`
- Produces: XOR 执行 + `skipped` + resume 感知 condition 子叶

- [ ] **Step 1: `flattenTaskSpecs`**

```ts
if (node.type === 'condition') {
  specs.push({ id: node.id, title: node.title })
  for (const arm of node.cases) {
    for (const child of arm.nodes) {
      specs.push({ id: child.id, title: child.title, parentId: node.id })
    }
  }
  continue
}
```

- [ ] **Step 2: `findResumeIndex`**  
  若 `cursorNodeId` 落在某 `condition.cases[].nodes` 内，返回该顶层 index。

- [ ] **Step 3: `executeTopLevelNode` 最前增加 condition 分支**

伪代码必须落实为真码：

```ts
if (node.type === 'condition') {
  statusMap.set(node.id, 'running')
  for (const arm of node.cases) {
    for (const child of arm.nodes) statusMap.set(child.id, 'pending')
  }
  persistSessionTasks(session, buildTasks(specs, statusMap))

  let selectedKey: string
  if (node.mode === 'agent') {
    // 复用现有 agent 受限 ReAct：构造一次性 prompt，要求只输出 JSON {"key":"..."}
    // 解析失败走 queryConditionCaseKey 的 default / error
    const rawKey = await queryAgentBranchKey(sessionId, node, run.context, signal)
    const picked = queryConditionCaseKey(node, run.context, rawKey)
    if ('error' in picked) throw new Error(picked.error)
    selectedKey = picked.key
  } else {
    const picked = queryConditionCaseKey(node, run.context)
    if ('error' in picked) throw new Error(picked.error)
    selectedKey = picked.key
  }

  const prevBranch =
    (run.context.__branchKeys as Record<string, string> | undefined) ?? {}
  run = patchRun(run, {
    context: {
      ...run.context,
      __branchKeys: { ...prevBranch, [node.id]: selectedKey }
    },
    cursorNodeId: node.id,
    status: 'running'
  })

  const chosen = node.cases.find((c) => c.key === selectedKey)
  if (!chosen) throw new Error(`条件分支无 case: ${selectedKey}`)

  for (const arm of node.cases) {
    if (arm.key === selectedKey) continue
    for (const child of arm.nodes) statusMap.set(child.id, 'skipped')
  }
  persistSessionTasks(session, buildTasks(specs, statusMap))

  for (const child of chosen.nodes) {
    statusMap.set(child.id, 'running')
    persistSessionTasks(session, buildTasks(specs, statusMap))
    try {
      run = await executeLeafNode(sessionId, child, run, signal)
      statusMap.set(child.id, 'done')
      persistSessionTasks(session, buildTasks(specs, statusMap))
    } catch (e) {
      if (e instanceof Error && e.message === '__aborted__') throw e
      statusMap.set(child.id, 'failed')
      statusMap.set(node.id, 'failed')
      persistSessionTasks(session, buildTasks(specs, statusMap))
      throw e
    }
  }
  statusMap.set(node.id, 'done')
  persistSessionTasks(session, buildTasks(specs, statusMap))
  return run
}
```

`queryAgentBranchKey`：在同文件实现——调用现有 agent 执行路径（与 `executeLeafNode` agent 分支相同入口），system/user 提示强调「只输出 case key 列表之一：…」。解析：优先 JSON `{"key"}`，否则 trim 全文若精确等于某 key。

注意：原 `if (node.type !== 'parallel')` 把一切当叶子——必须改成明确三路：`condition` / `parallel` / leaf。

- [ ] **Step 4: `pnpm typecheck`** — Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add electron/main/workflow/engine.ts shared/evaluate-workflow-condition.ts
git commit -m "$(cat <<'EOF'
feat(workflow): execute condition branches with skipped tasks

EOF
)"
```

---

### Task 6: 条件画布节点 UI（展示组件）

**Files:**
- Create: `src/features/workflows/components/WorkflowConditionFlowNode/WorkflowConditionFlowNode.tsx`
- Create: `src/features/workflows/components/WorkflowConditionFlowNode/WorkflowConditionFlowNode.module.css`
- Create: `src/features/workflows/components/WorkflowConditionFlowNode/index.ts`

**Interfaces:**
- Consumes: `@xyflow/react` Handle/Position；`WorkflowConditionNode`
- Produces:

```ts
export type WorkflowConditionRfData = {
  condition: WorkflowConditionNode
  onEdit: (id: string) => void
}

export type WorkflowConditionRfNode = Node<WorkflowConditionRfData, 'workflowCondition'>

export function WorkflowConditionFlowNode(
  props: NodeProps & { data: WorkflowConditionRfData }
): React.ReactElement
```

- [ ] **Step 1: 实现组件**

- 顶部 1× `Handle type="target" position={Position.Top}`
- 底部：对 `condition.cases` 每个出口一个 `Handle type="source"`，`id={case.key}`（React Flow sourceHandle），旁标注 `label || key`
- `onDoubleClick` → `data.onEdit(condition.id)`
- 标题 + 极简副行：`expression` 显示「表达式」/ `agent` 显示「Agent 选路」
- **样式**：沿用 `WorkflowFlowNode` 缩放后的体量与 `--db-*`；左侧或顶边用警告色/主色区分（如 `border-left` 用 `var(--db-warning)`）；handle 尺寸与叶子一致（当前约 4.5px）。禁止紫色渐变、大阴影、emoji。

- [ ] **Step 2: CSS Module**  
  参考 `WorkflowFlowNode.module.css`，增加 `.handles` 横排多出口、`.branchTag` 6–7px 字号。

- [ ] **Step 3: barrel `index.ts` 导出**

- [ ] **Step 4: Commit**

```bash
git add src/features/workflows/components/WorkflowConditionFlowNode
git commit -m "$(cat <<'EOF'
feat(workflow): add condition flow node UI

EOF
)"
```

---

### Task 7: Canvas / Drawer 集成连线与添加

**Files:**
- Modify: `src/features/workflows/components/WorkflowCanvas/WorkflowCanvas.tsx`
- Modify: `src/features/workflows/components/WorkflowCanvasDrawer/WorkflowCanvasDrawer.tsx`
- Modify: `src/features/workflows/components/WorkflowNodeEditModal/WorkflowNodeEditModal.tsx`（最小：能打开 condition 或先只编辑叶子，条件编辑在 Task 8——**本 Task 至少能添加条件节点并连线带 branchKey**）

**Interfaces:**
- Consumes: Task 4/6
- Produces: `addCondition()` / 扩展 handle：`addLeafByType` + `addCondition`

- [ ] **Step 1: `nodeTypes`**

```ts
const nodeTypes = {
  workflow: WorkflowFlowNode,
  workflowCondition: WorkflowConditionFlowNode
} as NodeTypes
```

- [ ] **Step 2: RF 状态同步**  
  hydrate：leaves → `type: 'workflow'`；conditions → `type: 'workflowCondition'`，`data.condition` 为 meta（cases.nodes 可空）。  
  edges：映射 `sourceHandle: e.branchKey`（若有）、label 显示 branchKey。

- [ ] **Step 3: `onConnect`**  
  若 `source` 节点为 condition：必须带 `connection.sourceHandle` 作为 `branchKey`；写入 canvas edge。  
  marker/stroke 可继续用现有缩小箭头。

- [ ] **Step 4: `emitChange`**  
  从 rfNodes 拆 leaves + conditions → `applyCanvasToDefinition(leaves, conditions, canvas)`。

- [ ] **Step 5: Drawer 菜单**

```ts
{ key: 'condition', label: '条件分支' }
```

点击 → `canvasRef.current?.addCondition()`，插入 `createConditionNode()` 默认 If/Else。

顶部说明文案增加：**带标签（sourceHandle）的出线 = 条件分支；无标签多出线 = 并行。**

- [ ] **Step 6: 双击条件 → 打开编辑（Task 8 表单）；临时可先 message.info 或打开 Modal 骨架**

- [ ] **Step 7: `pnpm typecheck` + 手测**：添加条件 → 两条 true/false 连到两个 Agent → 汇合到 await → 保存无红条。

- [ ] **Step 8: Commit**

```bash
git add src/features/workflows/components/WorkflowCanvas src/features/workflows/components/WorkflowCanvasDrawer
git commit -m "$(cat <<'EOF'
feat(workflow): wire condition nodes on canvas with branchKey edges

EOF
)"
```

---

### Task 8: 条件编辑弹窗（表单 + 高级表达式）

**Files:**
- Modify: `src/features/workflows/components/WorkflowNodeEditModal/WorkflowNodeEditModal.tsx`
- 可选 Create: `src/features/workflows/components/WorkflowConditionEditFields/WorkflowConditionEditFields.tsx`（若 Modal 将超 200 行，按 senior-frontend 拆出纯展示+受控表单块）

**Interfaces:**
- Consumes: `WorkflowConditionNode`、`createConditionNode` 字段
- Produces: `onOk(node: WorkflowNode)` 可返回 condition（**cases[].nodes 保持传入原值或空，由编译覆写**）

- [ ] **Step 1: Modal 支持 `node.type === 'condition'`**  
  去掉对该类型的拒绝；`leafOnly` 仅限制添加菜单时不出现 parallel，但编辑已有 condition 要放开。

字段（Ant Form）：
| 字段 | 组件 |
|------|------|
| title | Input |
| mode | Radio：expression / agent |
| branchShape | Radio：ifelse / switch（ifelse 锁定 cases true/false） |
| contextKey, op, value | Input/Select（mode=expression 且未开高级） |
| useAdvancedExpression | Switch |
| expression | TextArea（advanced） |
| prompt / toolWhitelist | agent 模式 |
| cases | Form.List：key、label；defaultKey Radio |
| 底部 Tip | 「各支路需连到同一后续节点；步骤内容在画布上编排」 |

保存时：合并 id；**不要**用表单覆盖已从画布编译来的 `cases[].nodes`——从 `node` prev 按 key 保留 nodes，新 key nodes=`[]`。

- [ ] **Step 2: 全屏 `getContainer`** 逻辑与现网叶子编辑一致（沿用 `isFullscreen` / `fullscreenContainer` props）。

- [ ] **Step 3: Canvas `handleEditOk`**  
  更新 condition RF node data；触发 emitChange；改 case key 时同步改写 edges 的 `branchKey` / `sourceHandle`。

- [ ] **Step 4: `pnpm typecheck` + 手测表单切 Switch 增 case、高级表达式保存后重开仍在。

- [ ] **Step 5: Commit**

```bash
git add src/features/workflows/components/WorkflowNodeEditModal src/features/workflows/components/WorkflowConditionEditFields src/features/workflows/components/WorkflowCanvas
git commit -m "$(cat <<'EOF'
feat(workflow): edit condition metadata in node modal

EOF
)"
```

---

### Task 9: TaskChecklist `skipped` 态

**Files:**
- Modify: `src/features/chat/components/TaskChecklist/TaskChecklist.tsx`
- Modify: `src/features/chat/components/TaskChecklist/TaskChecklist.module.css`（若存在）

**Interfaces:**
- Consumes: `TaskItemStatus` 含 `skipped`

- [ ] **Step 1: 图标与样式**

```tsx
if (status === 'skipped') {
  return <MinusCircleOutlined className={styles.iconSkipped} /> // 或已导入的等价图标
}
```

标题/行增加 `taskTitleSkipped` / `taskRowSkipped`：降低透明度、删除线可选（轻量即可）。文案 tip：`已跳过`。

- [ ] **Step 2: 手测跑一次 If/Else，确认未选支路灰显**

- [ ] **Step 3: Commit**

```bash
git add src/features/chat/components/TaskChecklist
git commit -m "$(cat <<'EOF'
feat(chat): show skipped status in task checklist

EOF
)"
```

---

### Task 10: 回归与文档

**Files:**
- Modify: 任何仍对 `WorkflowNode['type']` 做 exhaustive 而未含 `condition` 的文件（`pnpm typecheck` 驱动）
- Modify: `.cursor/skills/react-agent-feature-dev/SKILL.md` 或 workflows 相关说明（若有节点类型列表）
- Spec 状态行可改为「已实现计划」

- [ ] **Step 1: `pnpm typecheck`** — Expected: PASS，零遗漏 switch

- [ ] **Step 2: 冒烟清单（对照 Spec §7）**
  1. 工具写 context → condition If/Else → 两 Agent → 汇合 await；只走 true
  2. Switch 三 case + default
  3. Agent 模式选路
  4. 去掉汇合边 → 红条且旧 nodes 保留
  5. 无 branchKey 多出线 parallel 仍并发/串行如旧
  6. 全屏下打开条件编辑 Modal 可见

- [ ] **Step 3: Commit 文档**

```bash
git add docs/superpowers/specs/2026-07-14-workflow-condition-branch-design.md
git commit -m "$(cat <<'EOF'
docs: mark condition branch spec ready for implementation tracking

EOF
)"
```

---

## Self-Review (author)

| Spec 要求 | Task |
|-----------|------|
| `condition` 类型 / edge.branchKey / skipped | 1, 3, 9 |
| 表单 + 高级表达式 + agent 模式 | 2, 5, 8 |
| 必须汇合编译校验 | 4 |
| XOR 执行 + skipped | 5 |
| UI 节点多出口 + 工具栏 + 文案 | 6, 7, 8 |
| parallel 行为不变 | 4, 10 |
| normalize 不丢类型 | 3 |
| 全屏 Modal | 8 |
| 技能市场样式 | Global + 6 |

无 TBD 占位；类型名 `WorkflowConditionNode` / `queryConditionCaseKey` / `branchKey` / RF type `workflowCondition` 全文一致。
