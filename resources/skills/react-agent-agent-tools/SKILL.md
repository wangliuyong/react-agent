---
name: react-agent-agent-tools
description: >-
  React Agent 的 Agent 工具注册、LangGraph 编排与角色提示修改。
  在 react-agent 中新增/修改/删除 Agent 工具、调整工具权限、
  更新多智能体角色或 LLM 系统提示时使用。
---

# Agent 工具与 LangGraph 编排

## 核心文件

| 文件 | 职责 |
|------|------|
| `electron/main/agent/tools/index.ts` | **工具注册表**，新增工具只在此 append |
| `electron/main/agent/tools/types.ts` | `AgentTool`、`ToolContext`、`ToolPermission` |
| `electron/main/agent/tools/langchain-adapter.ts` | `AgentTool` → LangChain `tool()` + `interrupt` 权限门 |
| `electron/main/agent/graph-bridge.ts` | **聊天/步骤唯一入口**：stream → `AgentEvent`、abort / continue |
| `electron/main/agent/llm-langchain.ts` | ChatOpenAI 工厂（DashScope） |
| `electron/main/agent/graph/chat-graph.ts` | Supervisor + general / researcher / writer / publisher |
| `electron/main/agent/graph/prompts.ts` | 各角色 system prompt |
| `electron/main/agent/graph/role-tools.ts` | 角色工具白名单 |
| `electron/main/workflow/compile-to-langgraph.ts` | 工作流 Definition → StateGraph |

## 新增工具（固定流程）

1. 在 `electron/main/agent/tools/<domain>-tools.ts` 定义 `AgentTool`
2. 在 `tools/index.ts` 的 `getAllTools()` **末尾追加**（不改 Bridge / 图）
3. 若角色需要该工具，更新 `graph/role-tools.ts` 白名单
4. 若需浏览器能力，调用 `electron/main/browser/` 服务
5. 跑 `pnpm typecheck`

### AgentTool 模板

```typescript
export const myTool: AgentTool = {
  name: 'my_tool',                    // snake_case
  description: '给模型看的说明，含何时调用、参数含义',
  permission: 'safe',                 // safe | sensitive | dangerous
  parameters: {
    type: 'object',
    properties: { /* JSON Schema */ },
    required: ['field']
  },
  async execute(args, ctx) {
    // ctx.sessionId, ctx.fullAccess, ctx.attachmentPaths
    // ctx.emitAwaitUser(reason) — LangGraph 下转为 interrupt
    // ctx.updateTasks(updater) — 更新任务清单
    // ctx.signal — AbortSignal
    return '给模型的字符串结果'
  }
}
```

## 权限与中断

| 级别 | 行为 |
|------|------|
| `safe` | 直接执行 |
| `sensitive` | 非 fullAccess 时可能需确认 |
| `dangerous` | 适配层 `interrupt`；发布工具可走工具内确认 |

`await_user` / 登录暂停 → LangGraph `interrupt` → UI `await_user` → `postAgentContinue` → `Command({ resume })`。

## 角色提示修改

在 `graph/prompts.ts` 的 `ROLE_PROMPTS` / `BASE_CAPABILITY` 中修改。注意：

- 工作流步骤与工具名保持一致
- 不要编造已发布成功，以工具返回为准
- 配图优先网页抓取

## 编排要点

- 聊天：Supervisor 路由 → `general`（问答）或 `researcher→writer→publisher`
- 工作流：`compile-to-langgraph` 按顶层节点 advance；agent 步走 ReAct 子图
- 事件经 `event:agent` 推送到渲染进程（含可选 `agent_role`）

## 验证

```bash
pnpm typecheck
pnpm dev   # 聊天问答 / 发布管线；观察 tool_* 与 await_user
```

## 沉淀

新工具模式写入 [examples.md](examples.md)。
设计详见 `docs/superpowers/specs/2026-07-14-langgraph-orchestration-design.md`；
移除 legacy：`docs/superpowers/specs/2026-07-15-remove-legacy-react-design.md`。
