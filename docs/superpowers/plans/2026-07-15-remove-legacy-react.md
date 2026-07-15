# 移除自研 ReAct 仅保留 LangGraph Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 删除自研 ReAct / legacy 工作流路径与 OpenAI SDK LLM 封装，使聊天、工作流、定时指令与技能导入全部只走 LangChain + LangGraph。

**Architecture:** 调用方改为直接 import `graph-bridge`；`engine.executeWorkflowRun` 只委托 `executeWorkflowWithLangGraph`；`llm-langchain.createChatModel` 成为唯一 LLM 工厂；删除 `loop.ts` / `llm.ts` 与 `agentRuntime` 配置。预渲染 IPC 频道与 `window.api` 命名不变。

**Tech Stack:** Electron 主进程、LangGraph、`@langchain/openai`、TypeScript、pnpm、Ant Design Settings 表单

**Spec:** `docs/superpowers/specs/2026-07-15-remove-legacy-react-design.md`

## Global Constraints

- 保留 IPC 频道名（如 `post:agent:continue`）与渲染层 `postAgentContinue` 等；只改正进程入口实现
- 使用 `graph-bridge` 现有导出名，不做 `runAgentChat` 旧名别名
- 本地设置残留 `agentRuntime`：读入忽略；不写迁移脚本
- 查询 API 命名 `query*`，修改 API 命名 `post*`
- 前端改动落在 `src/features/settings/`，经模块既有结构；注释说明「为什么」
- 验证门槛：`pnpm typecheck`（仓库无 Agent 自动化单测套件，不以虚构单元测试替代）
- 安装依赖用 `pnpm`；Node ≥ 20

---

## File Structure

| 文件 | 职责 |
|------|------|
| `electron/main/agent/graph-bridge.ts` | **唯一**聊天/步骤编排入口（已存在，本计划只被依赖） |
| `electron/main/agent/llm-langchain.ts` | **唯一** ChatModel 工厂 |
| `electron/main/ipc.ts` | IPC → `runLangGraphChat` / `postGraphAbort` / `postGraphContinue` |
| `electron/main/schedule/scheduler.ts` | 定时自定义指令 → `runLangGraphStep` |
| `electron/main/workflow/engine.ts` | Run 生命周期；删 legacy for 循环；节点执行仍供 LangGraph 复用 |
| `electron/main/workflow/compile-to-langgraph.ts` | await_user → `waitForGraphUserContinue` |
| `electron/main/store/skill-import.ts` | 导入规划 LLM → `createChatModel` |
| `electron/main/agent/tools/types.ts` | 删 `toOpenAiTools` + `openai` 类型依赖 |
| `shared/types.ts` | 删 `AgentRuntime` / `agentRuntime` |
| `src/features/settings/components/SettingsPage/SettingsPage.tsx` | 删 Runtime 选择器 |
| 删除 `electron/main/agent/loop.ts`、`electron/main/agent/llm.ts` | — |
| 文档 / skill | 去掉 legacy 描述 |

---

### Task 1: 调用方改连 graph-bridge（尚保留 loop.ts）

**Files:**
- Modify: `electron/main/ipc.ts`
- Modify: `electron/main/schedule/scheduler.ts`
- Modify: `electron/main/workflow/engine.ts`（仅 import 与符号替换，暂不删 legacy 函数）
- Modify: `electron/main/workflow/compile-to-langgraph.ts`

**Interfaces:**
- Consumes: `graph-bridge` 上已有：
  - `runLangGraphChat(params: { sessionId: string; content: string; attachmentPaths?: string[] }): Promise<void>`
  - `runLangGraphStep(params: { sessionId: string; prompt: string; toolWhitelist?: string[]; attachmentPaths?: string[] }): Promise<'completed' \| 'aborted' \| 'error' \| 'max_turns'>`
  - `postGraphAbort(sessionId: string): void`
  - `postGraphContinue(sessionId: string): void`
  - `bindGraphSessionAbort(sessionId: string): AbortController`
  - `releaseGraphSessionAbort(sessionId: string): void`
  - `waitForGraphUserContinue(sessionId: string, reason: string): Promise<void>`
- Produces: 上述文件不再 import `../agent/loop`（或 `./agent/loop`）

- [ ] **Step 1: 改 `ipc.ts` import 与 handler**

将：

```ts
import { runAgentChat, postAgentAbort, postAgentContinue } from './agent/loop'
```

改为：

```ts
import {
  runLangGraphChat,
  postGraphAbort,
  postGraphContinue
} from './agent/graph-bridge'
```

handlers：

```ts
ipcMain.handle(IpcChannels.postAgentChat, async (_e, req: AgentChatRequest) => {
  // 异步跑 LangGraph；事件经 webContents.send 推送
  void runLangGraphChat(req)
})
ipcMain.handle(IpcChannels.postAgentAbort, (_e, sessionId: string) => {
  postGraphAbort(sessionId)
})
ipcMain.handle(IpcChannels.postAgentContinue, (_e, sessionId: string) => {
  postGraphContinue(sessionId)
})
```

- [ ] **Step 2: 改 `scheduler.ts`**

将：

```ts
import {
  bindSessionAbort,
  releaseSessionAbort,
  runAgentStep
} from '../agent/loop'
import { emitAgentEvent } from '../agent/graph-bridge'
```

改为：

```ts
import {
  bindGraphSessionAbort,
  releaseGraphSessionAbort,
  runLangGraphStep,
  emitAgentEvent
} from '../agent/graph-bridge'
```

在 `postRunScheduleCustomPrompt` 内：

- `bindSessionAbort(sessionId)` → `bindGraphSessionAbort(sessionId)`
- `runAgentStep(...)` → `runLangGraphStep(...)`
- 文件中若有 `releaseSessionAbort` → `releaseGraphSessionAbort`

- [ ] **Step 3: 改 `engine.ts` import 与全部符号**

将 loop import 改为：

```ts
import {
  bindGraphSessionAbort,
  releaseGraphSessionAbort,
  runLangGraphStep,
  waitForGraphUserContinue
} from '../agent/graph-bridge'
```

全文替换调用名（保持参数不变）：

- `waitForUserContinue` → `waitForGraphUserContinue`
- `runAgentStep` → `runLangGraphStep`
- `bindSessionAbort` → `bindGraphSessionAbort`
- `releaseSessionAbort` → `releaseGraphSessionAbort`

本 Task **先不要删** `executeWorkflowRunLegacy`；下一 Task 处理。

- [ ] **Step 4: 改 `compile-to-langgraph.ts` 三处动态 import**

将三处：

```ts
const { waitForUserContinue } = await import('../agent/loop')
await waitForUserContinue(session.id, reason)
```

改为文件顶部静态 import（或动态改 bridge）：

```ts
import { waitForGraphUserContinue } from '../agent/graph-bridge'
// ...
await waitForGraphUserContinue(session.id, reason)
```

并删除对 `../agent/loop` 的全部引用。

- [ ] **Step 5: 确认无其它 loop 引用（除 loop 自身）**

Run:

```bash
rg -n "agent/loop|from ['\\\"].*loop['\\\"]" electron shared src --glob '*.{ts,tsx}'
```

Expected: 仅可能仍有文档或 `loop.ts` 自身；`ipc` / `scheduler` / `engine` / `compile-to-langgraph` 无匹配。

- [ ] **Step 6: typecheck（此时 loop.ts 仍在，可能成死代码但应通过）**

Run: `pnpm typecheck`  
Expected: exit 0

- [ ] **Step 7: Commit**

```bash
git add electron/main/ipc.ts electron/main/schedule/scheduler.ts \
  electron/main/workflow/engine.ts electron/main/workflow/compile-to-langgraph.ts
git commit -m "$(cat <<'EOF'
refactor: Agent 调用方直连 graph-bridge

EOF
)"
```

---

### Task 2: 删除 legacy 工作流路径与 loop.ts

**Files:**
- Modify: `electron/main/workflow/engine.ts`
- Delete: `electron/main/agent/loop.ts`

**Interfaces:**
- Consumes: `executeWorkflowWithLangGraph(runId: string, fromStart: boolean): Promise<void>`（`./compile-to-langgraph`）
- Produces: `executeWorkflowRun` 仅 LangGraph；无 `executeWorkflowRunLegacy`；仓库无 `loop.ts`

- [ ] **Step 1: 简化 `executeWorkflowRun`**

将：

```ts
async function executeWorkflowRun(runId: string, fromStart: boolean): Promise<void> {
  if (querySettings().agentRuntime !== 'legacy') {
    const { executeWorkflowWithLangGraph } = await import('./compile-to-langgraph')
    await executeWorkflowWithLangGraph(runId, fromStart)
    return
  }
  await executeWorkflowRunLegacy(runId, fromStart)
}
```

改为：

```ts
async function executeWorkflowRun(runId: string, fromStart: boolean): Promise<void> {
  const { executeWorkflowWithLangGraph } = await import('./compile-to-langgraph')
  await executeWorkflowWithLangGraph(runId, fromStart)
}
```

- [ ] **Step 2: 删除 `executeWorkflowRunLegacy` 整函数**

删除从 `/** 自研 for 循环（agentRuntime=legacy） */` 到该函数结束的整段（约 `executeWorkflowRunLegacy` 函数体，含其内部 for 循环）。**不要删** `__graphApi_prepareWorkflowRun`、`executeTopLevelNode`、`__graphApi_executeTopLevelNode` 等——LangGraph 路径仍通过 `engine-graph-api` 复用。

- [ ] **Step 3: 清理 `engine.ts` 中仅因 legacy 分支引入且已无用的 import**

若 `querySettings` 在 `engine.ts` 中已无其它引用，删除：

```ts
import { querySettings } from '../store/settings'
```

- [ ] **Step 4: 删除 `loop.ts`**

```bash
rm electron/main/agent/loop.ts
```

- [ ] **Step 5: 全仓确认无 loop 引用**

Run:

```bash
rg -n "agent/loop|runAgentChat|runAgentStep|postAgentAbort|bindSessionAbort|waitForUserContinue" \
  electron shared src --glob '*.{ts,tsx}'
```

Expected: 无业务代码匹配（注释/文档可在 Task 5 清）。IPC 频道常量名 `postAgentAbort` 在 `shared/types.ts` 是 **频道字符串键**，应保留。

- [ ] **Step 6: typecheck**

Run: `pnpm typecheck`  
Expected: exit 0

- [ ] **Step 7: Commit**

```bash
git add electron/main/workflow/engine.ts
git rm electron/main/agent/loop.ts
git commit -m "$(cat <<'EOF'
refactor: 删除自研 ReAct loop 与工作流 legacy 循环

EOF
)"
```

---

### Task 3: 去掉 agentRuntime 配置与设置 UI

**Files:**
- Modify: `shared/types.ts`
- Modify: `src/features/settings/components/SettingsPage/SettingsPage.tsx`
- Modify: `electron/main/store/settings.ts`（若需剥离残留字段）

**Interfaces:**
- Consumes: `AppSettings` / `DEFAULT_SETTINGS`
- Produces: 无 `AgentRuntime`；无 `agentRuntime` 字段；设置页无 Runtime 选择器

- [ ] **Step 1: 从 `shared/types.ts` 删除类型与字段**

删除：

```ts
/** Agent 运行时：langgraph 为默认；legacy 保留自研 ReAct 回滚 */
export type AgentRuntime = 'langgraph' | 'legacy'
```

以及 `AppSettings` 中：

```ts
  /**
   * Agent 编排实现。
   * langgraph：LangChain + LangGraph；legacy：自研 loop.ts ReAct（迁移期回滚）。
   */
  agentRuntime: AgentRuntime
```

和 `DEFAULT_SETTINGS` 中的 `agentRuntime: 'langgraph'`。

- [ ] **Step 2: 设置页删除 Form.Item**

在 `SettingsPage.tsx` 删除整块：

```tsx
<Form.Item
  label="Agent 运行时"
  name="agentRuntime"
  tooltip="langgraph 为默认编排；legacy 可回滚到自研 ReAct（迁移期）"
>
  <Select
    options={[
      { value: 'langgraph', label: 'LangGraph（推荐）' },
      { value: 'legacy', label: 'Legacy ReAct' }
    ]}
  />
</Form.Item>
```

保留「最大工具轮次」与「完全访问」之间的布局。

- [ ] **Step 3: 读设置时剥离残留字段（为什么：旧 JSON 展开会带回已废弃键）**

在 `electron/main/store/settings.ts` 的读路径中，合并后显式丢掉 `agentRuntime`，例如：

```ts
function normalizeSettings(raw: Partial<AppSettings> & Record<string, unknown>): AppSettings {
  const merged = { ...DEFAULT_SETTINGS, ...raw }
  // 迁移期字段已废弃：忽略磁盘上残留的 agentRuntime
  delete (merged as Record<string, unknown>).agentRuntime
  return {
    apiKey: merged.apiKey,
    baseUrl: merged.baseUrl,
    model: merged.model,
    fullAccess: merged.fullAccess,
    maxTurns: merged.maxTurns
  }
}
```

将 `querySettings` / 读文件逻辑改为经 `normalizeSettings` 返回（按现有函数结构最小改动接入）。

- [ ] **Step 4: 确认无 agentRuntime 残留引用**

Run:

```bash
rg -n "agentRuntime|AgentRuntime" electron shared src --glob '*.{ts,tsx}'
```

Expected: 仅 `settings.ts` 里 `delete ... agentRuntime` 一行（或零，若全部剥干净且无字面量）。

- [ ] **Step 5: typecheck**

Run: `pnpm typecheck`  
Expected: exit 0

- [ ] **Step 6: Commit**

```bash
git add shared/types.ts \
  src/features/settings/components/SettingsPage/SettingsPage.tsx \
  electron/main/store/settings.ts
git commit -m "$(cat <<'EOF'
refactor: 移除 agentRuntime 配置与设置项

EOF
)"
```

---

### Task 4: skill-import 迁 LangChain，删除 llm.ts 与 openai 直依赖

**Files:**
- Modify: `electron/main/store/skill-import.ts`
- Modify: `electron/main/agent/tools/types.ts`
- Modify: `electron/main/agent/llm-langchain.ts`（注释更新）
- Delete: `electron/main/agent/llm.ts`
- Modify: `package.json`（视 `rg` 结果决定是否 `pnpm remove openai`）

**Interfaces:**
- Consumes: `createChatModel(settings: AppSettings): ChatOpenAI`
- Produces: 无 `llm.ts`；无 `toOpenAiTools`；无业务代码 `import ... from 'openai'`

- [ ] **Step 1: 改写 skill-import LLM 调用**

替换：

```ts
import { createLlmClient } from '../agent/llm'
```

为：

```ts
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { createChatModel } from '../agent/llm-langchain'
```

将 `createLlmClient` + `chat.completions.create` 块改为：

```ts
const settings = querySettings()
if (settings.apiKey) {
  try {
    // 与原先 OpenAI response_format: json_object 对齐，便于 parseLlmImportPlanJson
    const model = createChatModel(settings).bind({
      response_format: { type: 'json_object' }
    })
    const result = await model.invoke([
      new SystemMessage(SKILL_IMPORT_LLM_SYSTEM),
      new HumanMessage(`请分析以下技能链接并返回 JSON 导入计划：\n${trimmed}`)
    ])
    const content =
      typeof result.content === 'string'
        ? result.content
        : Array.isArray(result.content)
          ? result.content
              .map((p) => ('text' in p ? String(p.text) : ''))
              .join('')
          : String(result.content ?? '')

    const plan = parseLlmImportPlanJson(content)
    // ... 保持原有 plan 校验与 return 逻辑不变
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn('[skill-import] LLM plan failed, fallback to heuristics:', msg)
  }
}
```

启发式兜底分支保持不动。

- [ ] **Step 2: 更新 `llm-langchain.ts` 文件头注释**

将「与 llm.ts 的 createLlmClient 共用同一套 settings」改为「对接百炼 DashScope；应用内唯一 ChatModel 工厂」。

- [ ] **Step 3: 从 `tools/types.ts` 删除 `toOpenAiTools` 与 `import type OpenAI`**

保留 `ToolPermission` / `ToolContext` / `AgentTool`。删除函数：

```ts
export function toOpenAiTools(...)
```

及文件顶部 `import type OpenAI from 'openai'`。

- [ ] **Step 4: 删除 `llm.ts`**

```bash
rm electron/main/agent/llm.ts
```

- [ ] **Step 5: 确认无直接 openai 业务引用后移除依赖**

Run:

```bash
rg -n "from ['\\\"]openai|require\\(['\\\"]openai" electron shared src --glob '*.{ts,tsx}'
```

Expected: 无匹配。然后：

```bash
pnpm remove openai
```

若 `@langchain/openai` 仍传递安装 openai，属正常。

- [ ] **Step 6: typecheck**

Run: `pnpm typecheck`  
Expected: exit 0

- [ ] **Step 7: Commit**

```bash
git add electron/main/store/skill-import.ts \
  electron/main/agent/llm-langchain.ts \
  electron/main/agent/tools/types.ts \
  package.json pnpm-lock.yaml
git rm electron/main/agent/llm.ts
git commit -m "$(cat <<'EOF'
refactor: 技能导入改用 LangChain，移除 openai SDK 封装

EOF
)"
```

---

### Task 5: 文档与 skill 同步 + 终验

**Files:**
- Modify: `README.md`
- Modify: `doc/项目架构.md`
- Modify: `.cursor/skills/react-agent-agent-tools/SKILL.md`
- 可选：本计划与 spec 交叉引用无需再改代码

- [ ] **Step 1: 更新 README 技术栈表**

将：

```md
| Agent | OpenAI SDK（流式） + 自研 ReAct 循环 |
```

改为：

```md
| Agent | LangChain + LangGraph（Supervisor 多角色 / 工作流图） |
```

- [ ] **Step 2: 更新 `doc/项目架构.md`**

至少修改：

1. 总览 ASCII 图：去掉 `loop.ts` / `llm.ts` / legacy 措辞；入口写 `graph-bridge.ts`
2. 设计原则表：`LangGraph 编排` 行改为「聊天 Supervisor + 工作流 `compile-to-langgraph`；无 runtime 切换」
3. 目录树：删除 `loop.ts`、`llm.ts` 条目；`engine.ts` 注释改为「Run 生命周期 + 供图复用的节点执行」
4. 第 4 节「Agent ReAct 循环」：标题改为「Agent 编排（LangGraph）」；核心文件改为 `graph-bridge.ts`；sequenceDiagram 参与者改为 `Bridge` / LangGraph，不再画 `loop.ts` + `streamChat`

- [ ] **Step 3: 更新 `.cursor/skills/react-agent-agent-tools/SKILL.md`**

- 核心文件表：去掉「`loop.ts` 入口 legacy」行，改为注明聊天/步骤入口为 `graph-bridge.ts`
- 删除「设置项 `agentRuntime: ...` 可回滚」段落
- 保留工具注册与权限 / interrupt 说明

- [ ] **Step 4: 终验 grep + typecheck**

```bash
rg -n "agentRuntime|AgentRuntime|from ['\\\"].*agent/loop|createLlmClient|toOpenAiTools|executeWorkflowRunLegacy" \
  electron shared src .cursor/skills/react-agent-agent-tools --glob '*.{ts,tsx,md}'
pnpm typecheck
```

Expected:

- grep：无业务残留（文档若仍提「历史自研」可保留一句，但不指向可运行入口）
- typecheck：exit 0

- [ ] **Step 5: Commit**

```bash
git add README.md doc/项目架构.md .cursor/skills/react-agent-agent-tools/SKILL.md
git commit -m "$(cat <<'EOF'
docs: 同步移除自研 ReAct 后的架构说明

EOF
)"
```

- [ ] **Step 6: 手动冒烟（执行者自检清单）**

- [ ] `pnpm dev`：普通聊天问答有回复
- [ ] 聊天中止 / 继续（`await_user` 若可触发）
- [ ] 跑一个含 agent 节点的工作流
- [ ] 设置里有 API Key 时，技能导入 URL 走 LLM 规划或平滑降级

---

## Self-Review (plan vs spec)

| Spec 要求 | Task |
|-----------|------|
| 删 loop.ts | Task 2 |
| 删 llm.ts + skill-import 迁 LC | Task 4 |
| 删工作流 legacy | Task 2 |
| 去 agentRuntime + 设置 UI | Task 3 |
| 调用方直连 bridge | Task 1 |
| 删 toOpenAiTools / 可选去 openai 依赖 | Task 4 |
| 文档 / skill | Task 5 |
| IPC 协议不变 | Task 1（只改正进程符号） |
| typecheck + 冒烟 | Task 1–5 / Task 5 Step 6 |
| 忽略磁盘残留 agentRuntime | Task 3 Step 3 |

无 TBD；导出名与 spec API 映射表一致。
