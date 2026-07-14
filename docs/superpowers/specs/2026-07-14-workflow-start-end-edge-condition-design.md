# 流程开始/结束节点与连线条件设计

日期：2026-07-14  
状态：已确认，实现中

## 背景

此前条件以独立 `condition` 画布节点表达。产品要求：

- 所有流程必须从 **开始** 到 **结束**
- 恰好各 1 个开始/结束节点（新建自动带，不可删不可再加）
- **条件体现在连线上**；双击连线编辑标签与表达式
- 去掉画布 `condition` 节点（替换方案）

## 目标

- `start` / `end` 节点类型 + 强制约束
- 边：`when` / `isDefault` / `label`；有条件多出边 = XOR；全无条件多出边 = parallel
- 双击边编辑 Modal
- 旧 `condition` 节点迁移为边条件
- UI 对齐技能市场 `--db-*`

## 非目标

- 边级 Agent 选路（用前置 Agent 写 context + 边表达式）
- 多个结束节点
- 纯图游走引擎重写

## 数据模型

见会话设计 §1：`WorkflowStartNode` / `WorkflowEndNode`；`WorkflowCanvasEdge` 含 `label?` `when?` `isDefault?`；移除画布 `branchKey` 与用户可见 `condition`（引擎内部编译仍可用 `WorkflowConditionNode`）。

## 编译 / 引擎 / 迁移

见会话设计 §2。

## UI

见会话设计 §3：`WorkflowTerminalFlowNode`、`WorkflowEdgeEditModal`、工具栏去条件分支项。

## 验收

- [ ] 新流程自带 start/end，无法删除/重复添加
- [ ] 双击边可设表达式与默认边
- [ ] 条件分叉 XOR + skipped；无条件多出线仍 parallel
- [ ] 路径须进 end；缺 start/end/汇合报错
- [ ] 旧 condition 流程可打开并迁移
- [ ] `pnpm typecheck` 通过
