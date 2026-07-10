---
name: react-agent-agent-tools
description: >-
  React Agent 的 Agent 工具注册、ReAct 循环与 SYSTEM_PROMPT 修改。
  在 react-agent 中新增/修改/删除 Agent 工具、调整工具权限、
  更新 loop 行为或 LLM 系统提示时使用。
---

# Agent 工具与 ReAct 循环

## 核心文件

| 文件 | 职责 |
|------|------|
| `electron/main/agent/tools/index.ts` | **工具注册表**，新增工具只在此 append |
| `electron/main/agent/tools/types.ts` | `AgentTool`、`ToolContext`、`ToolPermission` |
| `electron/main/agent/loop.ts` | ReAct 循环 + `SYSTEM_PROMPT` |
| `electron/main/agent/llm.ts` | DashScope OpenAI 兼容客户端 |

## 新增工具（固定流程）

1. 在 `electron/main/agent/tools/<domain>-tools.ts` 定义 `AgentTool`
2. 在 `tools/index.ts` 的 `getAllTools()` **末尾追加**（不改 loop）
3. 若需浏览器能力，调用 `electron/main/browser/` 服务，不在 tool 内直接 launch Playwright
4. 跑 `pnpm typecheck`

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
    // ctx.emitAwaitUser(reason) — 暂停等人（登录/确认）
    // ctx.updateTasks(updater) — 更新任务清单
    // ctx.signal — AbortSignal
    return '给模型的字符串结果'
  }
}
```

## 权限级别

| 级别 | 行为 |
|------|------|
| `safe` | 直接执行 |
| `sensitive` | 非 fullAccess 时可能需确认 |
| `dangerous` | 发布/删除等，默认需确认 |

`fullAccess` 来自设置页，经 `ToolContext` 传入。

## SYSTEM_PROMPT 修改

在 `loop.ts` 的 `SYSTEM_PROMPT` 字符串中修改。注意：

- 工作流步骤与工具名保持一致（如 `fetch_web_images` → `xhs_publish_note`）
- 强调「不要编造已发布成功，以工具返回为准」
- 配图优先网页抓取，用户上传为可选
- 交互通过工具完成，不建议脚本改 DOM

## 现有工具清单

**文件**：`list_attachments`、`read_file`、`write_file`  
**任务**：`update_task_list`  
**配图**：`fetch_web_images`  
**浏览器原子**：`browser_navigate`、`browser_snapshot`、`browser_click`、`browser_type`、`browser_upload`、`browser_wait`  
**业务**：`xhs_publish_note`

## ReAct 循环要点

- 模型产出 `tool_calls` → 主进程 `getToolByName` 执行 → 结果回灌
- `await_user` 挂起，`continueAgent` IPC 恢复
- 每会话一个 `AbortController`，支持停止
- 事件经 `event:agent` 推送到渲染进程

## 验证

```bash
pnpm typecheck
pnpm dev   # 聊天窗口发指令，观察 tool_start / tool_result 事件
```

## 沉淀

新工具模式写入 [examples.md](examples.md)。
