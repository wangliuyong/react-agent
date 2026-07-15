# 移除自研 ReAct，仅保留 LangGraph / LangChain

日期：2026-07-15  
状态：已确认；按方案 1 实施

## 背景

迁移期存在双路径：

- **LangGraph（默认）**：`graph-bridge` → `chat-graph` / `compile-to-langgraph`
- **自研 legacy**：`loop.ts` 内 ReAct while 循环；`engine.ts` 内工作流 for 循环；设置项 `agentRuntime: 'langgraph' | 'legacy'`

默认已是 LangGraph，legacy 回滚开关已过期，应收敛为单一编排栈。

## 目标

- 聊天与工作流**仅**走 LangChain + LangGraph
- 删除 `loop.ts`、`llm.ts` 及所有 legacy 分支
- 去掉 `agentRuntime` 配置与设置页选择器
- 非编排调用（如技能导入 LLM 规划）迁移到 `llm-langchain.ts`
- 保持预渲染 IPC 协议不变（频道名与 `window.api.*`）

## 非目标

- 磁盘 Checkpoint、改多智能体角色拓扑
- 改 IPC 协议或预渲染 API 命名
- 把 `graph-bridge` 导出名改回 `runAgentChat` 等旧名
- 重写工作流节点业务语义（只删 legacy 执行路径）

## 方案

一次性清干净（方案 1）：删路径与死文件，调用方直连 `graph-bridge`，`skill-import` 迁 LangChain。

## API 映射

删除 `loop.ts` 后统一使用 `graph-bridge` 现有命名：

| 原 `loop.ts` | 改用 |
|---|---|
| `runAgentChat` | `runLangGraphChat` |
| `runAgentStep` | `runLangGraphStep` |
| `postAgentAbort` | `postGraphAbort` |
| `postAgentContinue` | `postGraphContinue` |
| `bindSessionAbort` | `bindGraphSessionAbort` |
| `releaseSessionAbort` | `releaseGraphSessionAbort` |
| `waitForUserContinue` | `waitForGraphUserContinue` |

调用方改 import（签名已兼容）：

- `electron/main/ipc.ts`
- `electron/main/schedule/scheduler.ts`
- `electron/main/workflow/engine.ts`
- `electron/main/workflow/compile-to-langgraph.ts`（动态 import 改为 bridge）

## 变更清单

### 删除

- `electron/main/agent/loop.ts` 整文件
- `electron/main/agent/llm.ts` 整文件
- `engine.ts` 中 `executeWorkflowRunLegacy` 及 `agentRuntime !== 'legacy'` 分支；`executeWorkflowRun` 直接调用 `executeWorkflowWithLangGraph`
- `AgentRuntime` 类型、`AppSettings.agentRuntime` 与默认值
- 设置页 Runtime 选择器
- 仅 legacy 使用的 `toOpenAiTools`（确认无引用后）
- 确认无直接 `openai` import 后，可移除顶层 `openai` 依赖（若 `@langchain/openai` 仍传递依赖则保留）

### 改写

- 上述调用方 → 从 `graph-bridge` 导入
- `skill-import.ts`：`createChatModel` + `invoke`；用 LangChain JSON 约束替代 OpenAI SDK `response_format`
- 文档与 skill：`README`、`doc/项目架构.md`、`.cursor/skills/react-agent-agent-tools` 去掉 legacy / 自研 ReAct / `agentRuntime` 回滚描述

### 配置兼容

本地设置若仍存 `agentRuntime: 'legacy'`：读入后忽略该字段，行为等价强制 LangGraph；不写迁移脚本。

### 保留

- `graph-bridge` / `chat-graph` / `react-subgraph` / `compile-to-langgraph`
- `llm-langchain.ts`（唯一 LLM 工厂）
- IPC 频道名（如 `post:agent:continue`）与渲染层 `postAgentContinue` 等

## 风险

- `skill-import` 迁 LangChain 后 JSON 偶发不一致：保留启发式兜底，失败降级不阻断
- 漏改 import 由 `pnpm typecheck` 挡住；文档中旧 API 名一并更新
- 残留 `legacy` 配置被忽略，不再可回滚

## 成功标准

- 仓库内无自研 ReAct while 循环、无 `agentRuntime`、无 `llm.ts` / `loop.ts`
- 聊天 / 工作流 / 定时自定义指令只进 `graph-bridge` + LangGraph
- `pnpm typecheck` 通过
- 冒烟：聊天问答、中止/继续、工作流跑一轮、技能导入（有 API Key 时 LLM 规划路径）

## 关联

前置：`docs/superpowers/specs/2026-07-14-langgraph-orchestration-design.md`
