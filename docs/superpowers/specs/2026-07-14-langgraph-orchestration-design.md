# LangGraph / LangChain 智能体编排设计

日期：2026-07-14  
状态：已确认；按方案 3 实施

## 背景

灵犀主进程原先为自研 ReAct（`loop.ts` + `openai` SDK）与自研工作流引擎（`workflow/engine.ts`）。无角色隔离、无图状态机 / interrupt 语义；多智能体协作与统一编排能力不足。

## 目标

- 用 LangChain + LangGraph **替换**聊天 ReAct 循环与工作流执行主路径
- 聊天侧交付 Supervisor 多智能体：`general`（问答）| `researcher` → `writer` → `publisher`
- 保持 IPC、`AgentEvent`、Session/Workflow JSON、画布编辑、现有 `AgentTool` 业务实现兼容
- 迁移期提供 `agentRuntime: 'legacy' | 'langgraph'` 回滚开关

## 非目标

- 向量 RAG / 独立知识库
- 磁盘 Checkpoint（SqliteSaver）
- 画布上可视化 LangGraph 角色节点
- 真·多 Session 并行多 Agent

## 架构摘要

- `graph-bridge`：stream → `AgentEvent`，abort / continue，Session 写回
- `chat_graph`：Supervisor + 多角色 ReAct 子图
- `compile-to-langgraph`：`WorkflowDefinition` → StateGraph；节点语义对齐原引擎
- `AgentTool` → LangChain `tool()`（JSON Schema）适配；`dangerous` / `emitAwaitUser` 走 `interrupt()`
- Checkpoint：进程内 `MemorySaver`；业务仍落盘 Session / WorkflowRun

## 角色工具白名单

| 角色 | 工具 |
|------|------|
| supervisor | 无（或仅路由） |
| general | 全量 |
| researcher | fetch_hot_topics, fetch_web_images, list_attachments, read_file, update_task_list, browser_navigate, browser_snapshot |
| writer | update_task_list, read_file, write_file, list_attachments |
| publisher | xhs_publish_note, douyin_publish_note, browser_*, update_task_list, list_attachments |

## 中断模型

- 敏感工具确认、登录暂停、工作流 `await_user` → LangGraph `interrupt`
- `postAgentContinue` → `Command({ resume: true })`
- 进程重启后 MemorySaver 丢失，与现网 continueWaiters 行为一致

## 验证

- `pnpm typecheck`
- 聊天问答走 general；发布管线走三角色
- await_user → 继续可恢复
- 工作流模板含 agent/tool/await/condition/parallel(tool) 冒烟
