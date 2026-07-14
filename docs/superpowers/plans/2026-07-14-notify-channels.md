# Notify Channels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将渠道拆为「发布 / 通知」两类；本期落地飞书 Webhook 通知（计划级 + 子任务级 + Agent 独立调用），微信/QQ 仅占位。

**Architecture:** 在现有统一渠道表增加 `kind`；主进程共享发送器供 IPC「测试发送」与 `notify_message` 工具；发布计划用独立字段 `notifyChannels` 绑定；`compile-publish-workflow` 注入白名单与汇总节点。webhook 永不进 LLM。

**Tech Stack:** Electron + React 19、Ant Design 5、Zustand、TypeScript；飞书自定义机器人 Webhook（Node `fetch` + HMAC-SHA256 签名）；验证以 `pnpm typecheck` + 手测为主。

## Global Constraints

- Spec：`docs/superpowers/specs/2026-07-14-notify-channels-design.md`
- API 命名：读 `query*`，写 `post*`
- 优先 Ant Design；图标与现有页面 import 风格一致
- **UI 对齐技能市场 / 现有渠道页**（`--db-*`、卡片浏览）；`frontend-design` 仅用于 Tab/状态徽标/Tag 层次与微交互，不另起 landing 风
- **工程分层（senior-frontend）**：新逻辑进 `shared/` 与 `features/channels/`；渠道页若膨胀则拆 `ChannelKindTabs` / 通知表单子组件；对外经 `features/channels/index.ts` barrel；注释写「为什么」
- 通知失败不阻断发布成功语义
- 微信/QQ：内置种子 `enabled: false`，工具 stub
- 验证：每 Task 后 `pnpm typecheck`；手测见 Spec「测试要点」

## File Structure

| 文件 | 职责 |
|------|------|
| Modify: `shared/publish-channels.ts` | `ChannelKind`、`notifyConfig`、通知种子、过滤/是否已配置 helpers |
| Modify: `shared/types.ts` | `PublishPlan` / `PublishSubTask.notifyChannels`；IPC `postNotifyChannelTest` |
| Modify: `shared/publish-normalize.ts` | 归一化 `notifyChannels` |
| Modify: `shared/compile-publish-workflow.ts` | 子任务通知 + 计划末尾汇总节点 |
| Modify: `electron/main/store/channels.ts` | normalize 兼容 notify；按 kind 校验 upsert |
| Create: `electron/main/notify/feishu.ts` | 飞书 Webhook 发送（签名） |
| Create: `electron/main/notify/send.ts` | 按 channelId 路由发送 |
| Create: `electron/main/agent/tools/notify-tools.ts` | `notify_message` |
| Modify: `electron/main/agent/tools/index.ts` | 注册工具 |
| Modify: `electron/main/agent/graph/role-tools.ts` | publisher 白名单加 `notify_message` |
| Modify: `electron/main/ipc.ts` + preload + `Window.api` | 测试发送 IPC |
| Modify: `src/features/channels/types.ts` / `api.ts` / `hooks/useChannelsStore.ts` | 草稿、过滤、测试 API |
| Modify: `src/features/channels/components/ChannelsPage/*` | Tab + 通知表单 + 测试发送（可拆子组件） |
| Modify: `src/features/publish/types.ts` | `createEmptyPlan` / `createEmptySubTask` 含 `notifyChannels` |
| Modify: `src/features/publish/components/PublishWorkbench/*` | 计划/子任务通知选择与 Tag |
| Modify: 相关 skill（可选） | 若描述渠道模型则同步一句 |

---

### Task 1: 共享渠道类型与 helpers

**Files:**
- Modify: `shared/publish-channels.ts`
- Modify: `shared/types.ts`（仅 re-export 若需要；计划/子任务字段放 Task 5）

**Interfaces:**
- Produces:

```ts
export type ChannelKind = 'publish' | 'notify'

export interface ChannelNotifyConfig {
  webhookUrl?: string
  secret?: string
}

export interface PublishChannelMeta {
  id: PublishChannelId
  kind: ChannelKind
  label: string
  description: string
  enabled: boolean
  agentHint: string
  isBuiltin?: boolean
  updatedAt?: number
  publishTool?: string
  titleMaxLength?: number
  loginCheckUrl?: string
  notifyTool?: string
  notifyConfig?: ChannelNotifyConfig
}

export interface PublishChannelUpsertInput {
  id: PublishChannelId
  kind: ChannelKind
  label: string
  description: string
  enabled: boolean
  agentHint: string
  publishTool?: string
  titleMaxLength?: number
  loginCheckUrl?: string
  notifyTool?: string
  notifyConfig?: ChannelNotifyConfig
}

/** 飞书等需 webhook 才算「可选用」 */
export function isNotifyChannelConfigured(meta: PublishChannelMeta): boolean
export function queryEnabledPublishChannels(): PublishChannelMeta[] // kind=publish && enabled
export function queryEnabledNotifyChannels(): PublishChannelMeta[] // kind=notify && enabled && configured
export function normalizeChannelKind(raw: unknown): ChannelKind // 缺省 'publish'
```

- [ ] **Step 1: 扩展 `PublishChannelMeta` / `UpsertInput`，为现有三个内置发布渠道补 `kind: 'publish'`**

- [ ] **Step 2: 追加内置通知种子**

```ts
{
  id: 'feishu',
  kind: 'notify',
  label: '飞书',
  description: '通过自定义机器人 Webhook 推送文本通知。',
  enabled: true,
  notifyTool: 'notify_message',
  notifyConfig: {},
  agentHint: '使用 notify_message，channelId 传 feishu；勿在参数中填写 webhook。',
  isBuiltin: true
},
{
  id: 'wechat_notify',
  kind: 'notify',
  label: '微信',
  description: '微信通知能力预留中。',
  enabled: false,
  notifyTool: 'notify_message',
  agentHint: '微信通知尚未接入，请勿调用。',
  isBuiltin: true
},
{
  id: 'qq_notify',
  kind: 'notify',
  label: 'QQ',
  description: 'QQ 通知能力预留中。',
  enabled: false,
  notifyTool: 'notify_message',
  agentHint: 'QQ 通知尚未接入，请勿调用。',
  isBuiltin: true
}
```

- [ ] **Step 3: 实现 `normalizeChannelKind` / `isNotifyChannelConfigured` / `queryEnabledNotifyChannels`；改写 `queryEnabledPublishChannels` 增加 `kind !== 'notify'` 过滤（缺省 kind 视为 publish）**

```ts
export function normalizeChannelKind(raw: unknown): ChannelKind {
  return raw === 'notify' ? 'notify' : 'publish'
}

export function isNotifyChannelConfigured(meta: PublishChannelMeta): boolean {
  if (normalizeChannelKind(meta.kind) !== 'notify') return false
  if (meta.id === 'feishu') {
    return Boolean(meta.notifyConfig?.webhookUrl?.trim())
  }
  // 占位渠道永不视为可选用
  return false
}

export function queryEnabledPublishChannels(): PublishChannelMeta[] {
  return runtimeChannels.filter(
    (c) => normalizeChannelKind(c.kind) === 'publish' && c.enabled
  )
}

export function queryEnabledNotifyChannels(): PublishChannelMeta[] {
  return runtimeChannels.filter(
    (c) =>
      normalizeChannelKind(c.kind) === 'notify' &&
      c.enabled &&
      isNotifyChannelConfigured(c)
  )
}
```

- [ ] **Step 4: 注意 `normalizePublishChannelId` 对未知 id 回退 `xhs`——通知 id 必须在注册表中，避免被当成 xhs；确认种子合并后 map 含 feishu**

- [ ] **Step 5: Commit**

```bash
git add shared/publish-channels.ts
git commit -m "$(cat <<'EOF'
feat: 渠道模型增加 publish/notify kind 与飞书种子

EOF
)"
```

---

### Task 2: 主进程渠道存储兼容 notify

**Files:**
- Modify: `electron/main/store/channels.ts`

**Interfaces:**
- Consumes: Task 1 的 `ChannelKind`、`notifyConfig`、可选字段 `publishTool`
- Produces: `normalizeChannel` 对缺省 kind 补 `'publish'`；`postPublishChannel` 按 kind 校验

- [ ] **Step 1: 改写 `normalizeChannel`，使 `publishTool` 对 notify 可选**

```ts
function normalizeChannel(raw: PublishChannelMeta): PublishChannelMeta {
  const kind = normalizeChannelKind((raw as { kind?: unknown }).kind)
  return {
    ...raw,
    id: raw.id.trim(),
    kind,
    label: raw.label.trim(),
    description: raw.description.trim(),
    // 为什么：旧数据只有 publishTool；notify 渠道不得 trim 空串导致写盘失败
    publishTool: raw.publishTool?.trim() || undefined,
    notifyTool: raw.notifyTool?.trim() || (kind === 'notify' ? 'notify_message' : undefined),
    notifyConfig:
      kind === 'notify'
        ? {
            webhookUrl: raw.notifyConfig?.webhookUrl?.trim() || undefined,
            secret: raw.notifyConfig?.secret?.trim() || undefined
          }
        : undefined,
    loginCheckUrl: raw.loginCheckUrl?.trim() || undefined,
    titleMaxLength:
      raw.titleMaxLength != null && raw.titleMaxLength > 0 ? raw.titleMaxLength : undefined,
    agentHint: raw.agentHint.trim(),
    isBuiltin: raw.isBuiltin ?? DEFAULT_PUBLISH_CHANNELS.some((d) => d.id === raw.id),
    updatedAt: raw.updatedAt ?? Date.now()
  }
}
```

- [ ] **Step 2: 改写 `postPublishChannel` 校验**

```ts
if (!input.label.trim()) throw new Error('渠道名称不能为空')
const kind = normalizeChannelKind(input.kind)
if (kind === 'publish') {
  if (!input.publishTool?.trim()) throw new Error('发布工具名不能为空')
} else {
  if (!input.notifyTool?.trim()) throw new Error('通知工具名不能为空')
}
// 合并时保留 kind；禁止更新已有渠道时篡改 kind（若 existing 存在且不同则 throw）
if (existing && normalizeChannelKind(existing.kind) !== kind) {
  throw new Error('渠道类型创建后不可修改')
}
```

- [ ] **Step 3: `mergeWithDefaults` 已按 DEFAULT 列表合并——确认新通知种子会自动补入旧 `channels.json`**

- [ ] **Step 4: Run `pnpm typecheck`** — 修复因 `publishTool` 可选引起的调用点（`queryPublishChannelMeta` 用于发布编译处应对缺省）

- [ ] **Step 5: Commit**

```bash
git add electron/main/store/channels.ts shared/publish-channels.ts
git commit -m "$(cat <<'EOF'
feat: 渠道持久化兼容通知类型与 webhook 配置

EOF
)"
```

---

### Task 3: 飞书发送器 + `notify_message` 工具 + 测试 IPC

**Files:**
- Create: `electron/main/notify/feishu.ts`
- Create: `electron/main/notify/send.ts`
- Create: `electron/main/agent/tools/notify-tools.ts`
- Modify: `electron/main/agent/tools/index.ts`
- Modify: `electron/main/agent/graph/role-tools.ts`
- Modify: `shared/types.ts`（IpcChannels + Window.api）
- Modify: `electron/main/ipc.ts`、`electron/preload/index.ts`
- Modify: `src/features/channels/api.ts`

**Interfaces:**
- Produces:

```ts
// electron/main/notify/send.ts
export async function postNotifyMessage(args: {
  channelId: string
  title?: string
  content: string
}): Promise<{ ok: true } | { ok: false; error: string }>

// AgentTool name: 'notify_message'
// IPC: postNotifyChannelTest(channelId: string) => Promise<{ ok: boolean; error?: string }>
```

- [ ] **Step 1: 实现飞书签名与发送**

```ts
// electron/main/notify/feishu.ts
import { createHmac } from 'crypto'

/** 飞书自定义机器人：有 secret 时需 timestamp + sign */
export function queryFeishuSign(secret: string, timestamp: string): string {
  const stringToSign = `${timestamp}\n${secret}`
  return createHmac('sha256', stringToSign).digest('base64')
}

export async function postFeishuWebhookText(opts: {
  webhookUrl: string
  secret?: string
  text: string
}): Promise<void> {
  const body: Record<string, unknown> = {
    msg_type: 'text',
    content: { text: opts.text }
  }
  if (opts.secret?.trim()) {
    const timestamp = String(Math.floor(Date.now() / 1000))
    body.timestamp = timestamp
    body.sign = queryFeishuSign(opts.secret.trim(), timestamp)
  }
  const res = await fetch(opts.webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  const data = (await res.json().catch(() => ({}))) as { code?: number; msg?: string }
  // 飞书成功通常 code===0
  if (!res.ok || (data.code != null && data.code !== 0)) {
    throw new Error(data.msg || `飞书通知失败 HTTP ${res.status}`)
  }
}
```

- [ ] **Step 2: 实现 `postNotifyMessage` 路由**

```ts
import { queryPublishChannelMeta, normalizeChannelKind } from '../../../shared/publish-channels'
import { postFeishuWebhookText } from './feishu'

export async function postNotifyMessage(args: {
  channelId: string
  title?: string
  content: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const meta = queryPublishChannelMeta(args.channelId)
  if (normalizeChannelKind(meta.kind) !== 'notify') {
    return { ok: false, error: `渠道 ${args.channelId} 不是通知渠道` }
  }
  if (meta.id === 'wechat_notify' || meta.id === 'qq_notify') {
    return { ok: false, error: `${meta.label} 通知能力尚未接入` }
  }
  const webhookUrl = meta.notifyConfig?.webhookUrl?.trim()
  if (!webhookUrl) {
    return { ok: false, error: '飞书 Webhook 未配置，请先在渠道页填写' }
  }
  const text = args.title?.trim()
    ? `${args.title.trim()}\n${args.content}`
    : args.content
  try {
    await postFeishuWebhookText({
      webhookUrl,
      secret: meta.notifyConfig?.secret,
      text
    })
    console.info(`[notify] ok channelId=${meta.id}`)
    return { ok: true }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    console.warn(`[notify] fail channelId=${meta.id} error=${error}`)
    return { ok: false, error }
  }
}
```

- [ ] **Step 3: `notify_message` AgentTool**

```ts
export const notifyMessageTool: AgentTool = {
  name: 'notify_message',
  description:
    '向通知渠道发送文本消息（飞书等）。只需传 channelId（如 feishu）与 content；不要传 webhook。可用于发布结果汇报或独立提醒。',
  permission: 'safe',
  parameters: {
    type: 'object',
    properties: {
      channelId: { type: 'string', description: '通知渠道 id，如 feishu' },
      title: { type: 'string', description: '可选标题' },
      content: { type: 'string', description: '正文' }
    },
    required: ['channelId', 'content']
  },
  async execute(args) {
    const channelId = String(args.channelId ?? '')
    const content = String(args.content ?? '')
    const title = args.title != null ? String(args.title) : undefined
    if (!channelId || !content.trim()) return '缺少 channelId 或 content'
    const result = await postNotifyMessage({ channelId, title, content })
    return result.ok ? `已发送通知到 ${channelId}` : `通知失败：${result.error}`
  }
}
```

- [ ] **Step 4: 在 `getAllTools()` 末尾追加；`publisher` 白名单加入 `'notify_message'`（general 为全量无需改）**

- [ ] **Step 5: 增加 IPC `postNotifyChannelTest`**

```ts
// shared/types.ts IpcChannels
postNotifyChannelTest: 'post:notify-channel:test',

// ipc handler
ipcMain.handle(IpcChannels.postNotifyChannelTest, async (_e, channelId: string) => {
  return postNotifyMessage({
    channelId: String(channelId),
    title: '灵犀通知测试',
    content: '这是一条来自渠道页的测试消息。'
  })
})
```

preload / `Window.api` / `src/features/channels/api.ts` 同步封装 `postNotifyChannelTest`。

- [ ] **Step 6: `pnpm typecheck` + Commit**

```bash
git commit -m "$(cat <<'EOF'
feat: 飞书 Webhook 通知与 notify_message 工具

EOF
)"
```

---

### Task 4: 渠道页 UI（Tab + 通知表单）

**Files:**
- Modify: `src/features/channels/types.ts`
- Modify: `src/features/channels/hooks/useChannelsStore.ts`
- Modify / 可选拆分:
  - `src/features/channels/components/ChannelsPage/ChannelsPage.tsx`
  - Create（若文件过长）: `ChannelNotifyStatusTag.tsx`、表单字段按 kind 分支即可

**Interfaces:**
- Consumes: `queryEnabledPublishChannels` 语义；`postNotifyChannelTest`
- Produces: Tab 状态、`createEmptyChannel(kind)`、store 过滤 helpers

- [ ] **Step 1: 更新工厂**

```ts
export function createEmptyChannel(kind: ChannelKind = 'publish'): PublishChannelUpsertInput {
  if (kind === 'notify') {
    return {
      id: '',
      kind: 'notify',
      label: '',
      description: '',
      enabled: true,
      notifyTool: 'notify_message',
      notifyConfig: { webhookUrl: '', secret: '' },
      agentHint: '使用 notify_message 发送；勿在对话中暴露 webhook。'
    }
  }
  return {
    id: '',
    kind: 'publish',
    label: '',
    description: '',
    enabled: true,
    publishTool: '',
    titleMaxLength: undefined,
    loginCheckUrl: '',
    agentHint: '请在此描述 Agent 发布该渠道时的工具名与注意事项。'
  }
}
```

- [ ] **Step 2: Store — `queryEnabledChannelsFromStore` 拆分为 publish / notify**

```ts
export function queryEnabledPublishChannelsFromStore(channels: PublishChannelMeta[]) {
  return channels.filter((c) => normalizeChannelKind(c.kind) === 'publish' && c.enabled)
}

export function queryEnabledNotifyChannelsFromStore(channels: PublishChannelMeta[]) {
  return channels.filter(
    (c) =>
      normalizeChannelKind(c.kind) === 'notify' &&
      c.enabled &&
      isNotifyChannelConfigured(c)
  )
}
```

更新 `features/channels/index.ts` 导出；修正 PublishWorkbench 的 import。

- [ ] **Step 3: ChannelsPage 顶部 Tabs**

```tsx
const [kindTab, setKindTab] = useState<ChannelKind>('publish')

<Tabs
  activeKey={kindTab}
  onChange={(k) => setKindTab(k as ChannelKind)}
  items={[
    { key: 'publish', label: '发布渠道' },
    { key: 'notify', label: '通知渠道' }
  ]}
/>
```

列表 `channels.filter(c => normalizeChannelKind(c.kind) === kindTab)`；登录检测按钮仅 `kindTab === 'publish'` 显示。

- [ ] **Step 4: 通知卡片状态 Tag**

- 占位（wechat/qq 或 !enabled 且无配置意图）：「即将上线」
- enabled 且已配置 webhook：「已配置」
- enabled 未配置：「未配置」

飞书详情/卡片操作增加「测试发送」→ `postNotifyChannelTest(id)` → `message.success/error`。

- [ ] **Step 5: 编辑表单按 kind 分支**

- publish：现有字段  
- notify：webhookUrl（`Input.Password`）、secret（`Input.Password`）、notifyTool（可只读默认 `notify_message`）  
- 创建时 `kind` 取当前 Tab；编辑时 `kind` 只读展示  

- [ ] **Step 6: 样式**：复用 `ChannelsPage.module.css` / `DB_THEME`；Tab 下卡片 stagger 可保留现有动画，不新增花哨背景

- [ ] **Step 7: `pnpm typecheck` + Commit**

```bash
git commit -m "$(cat <<'EOF'
feat: 渠道页按发布/通知分 Tab 并支持飞书配置

EOF
)"
```

---

### Task 5: 发布计划绑定 + 工作台 UI

**Files:**
- Modify: `shared/types.ts`（`PublishPlan.notifyChannels`、`PublishSubTask.notifyChannels`）
- Modify: `shared/publish-normalize.ts`
- Modify: `src/features/publish/types.ts`
- Modify: `src/features/publish/components/PublishWorkbench/PublishWorkbench.tsx`（及计划编辑表单组件，若拆在同目录）

**Interfaces:**
- Produces:

```ts
interface PublishSubTask {
  // existing...
  notifyChannels?: string[]
}
interface PublishPlan {
  // existing...
  notifyChannels?: string[]
}
```

- [ ] **Step 1: 类型与工厂默认 `notifyChannels: []`**

- [ ] **Step 2: `normalizePublishSubTask` / `normalizePublishPlan` 规范化 notify 列表**

```ts
function normalizeNotifyChannelIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((id) => String(id ?? '').trim())
    .filter(Boolean)
    .filter((id, i, arr) => arr.indexOf(id) === i)
}

// subTask:
notifyChannels: normalizeNotifyChannelIds(sub.notifyChannels)

// plan:
notifyChannels: normalizeNotifyChannelIds(plan.notifyChannels)
```

- [ ] **Step 3: 计划详情 / 新建计划表单**：Form.Item「计划结束通知」多选，`options={enabledNotifyChannels}`

- [ ] **Step 4: 子任务弹窗**：在「发布渠道」下增加「本任务结束通知」（可选）

- [ ] **Step 5: 列表 Tag**：发布用默认色；通知用 `color="blue"` 或 `cyan`，`queryPublishChannelLabel`

- [ ] **Step 6: `pnpm typecheck` + Commit**

```bash
git commit -m "$(cat <<'EOF'
feat: 发布计划支持计划级与子任务级通知渠道

EOF
)"
```

---

### Task 6: 编译工作流注入通知

**Files:**
- Modify: `shared/compile-publish-workflow.ts`

**Interfaces:**
- Consumes: `plan.notifyChannels`、`sub.notifyChannels`、`queryPublishChannelMeta`
- Produces: 子任务 prompt/whitelist 含 `notify_message`；计划末尾可选汇总 agent 节点

- [ ] **Step 1: 子任务节点 — 若 `sub.notifyChannels?.length`**

```ts
const notifyIds = normalizeNotifyChannelIds(sub.notifyChannels)
// toolWhitelist 加入 'notify_message'
// prompt 追加：
// 「发布完成后，依次调用 notify_message，channelId 分别为：...，content 简要说明本子任务各渠道发布结果。通知失败可忽略，不要因此判定任务失败。」
```

- [ ] **Step 2: `compilePublishPlanToWorkflow` 末尾 — 若 `plan.notifyChannels?.length`**

```ts
function buildPlanNotifyNode(plan: PublishPlan): WorkflowAgentNode {
  const ids = normalizeNotifyChannelIds(plan.notifyChannels)
  const labels = ids.map((id) => queryPublishChannelLabel(id)).join('、')
  return {
    id: `${plan.id}_notify_summary`,
    type: 'agent',
    title: '计划结果通知',
    prompt: [
      `请汇总整个发布计划「${plan.title}」的执行结果（成功/失败要点），`,
      `调用 notify_message 通知到：${labels}（channelId: ${ids.join(', ')}）。`,
      '若某渠道通知失败，说明原因即可，不要重试超过 1 次。'
    ].join('\n'),
    toolWhitelist: ['notify_message']
  }
}
// nodes = [...subTaskNodes, ...(planNotify ? [buildPlanNotifyNode(plan)] : [])]
```

- [ ] **Step 3: 确认 `queryPublishChannelMeta(id).publishTool` 在仅通知节点不会被调用**

- [ ] **Step 4: `pnpm typecheck` + Commit**

```bash
git commit -m "$(cat <<'EOF'
feat: 发布工作流编译注入子任务与计划级通知

EOF
)"
```

---

### Task 7: 回归手测与文档收尾

**Files:**
- Modify: `docs/superpowers/specs/2026-07-14-notify-channels-design.md`（状态保持已确认）
- Optional: `.cursor/skills/react-agent-feature-dev/SKILL.md` 或使用手册一句说明渠道二分

- [ ] **Step 1: 手测清单（对照 Spec）**

1. 删除本地临时：若有旧 channels.json，启动后应自动出现飞书/微信/QQ 种子；旧渠道无 kind 仍显示在发布 Tab  
2. 飞书未填 webhook：工作台通知多选为空或不含飞书；工具/测试发送报「未配置」  
3. 填写 webhook → 测试发送成功  
4. 子任务勾选飞书、计划勾选飞书 → 编译后的工作流节点含对应提示（可在流程页打开同 id 工作流查看）  
5. 聊天：「用飞书发一条测试」→ 调用 `notify_message`  
6. 微信/QQ Tab 可见且不可正式选用  

- [ ] **Step 2: `pnpm typecheck` 全绿**

- [ ] **Step 3: Commit 文档（若有改动）**

```bash
git commit -m "$(cat <<'EOF'
docs: 补充通知渠道使用说明

EOF
)"
```

---

## Spec coverage（自检）

| Spec 项 | Task |
|---------|------|
| kind + notifyConfig 模型 | 1–2 |
| 飞书种子 + 微信/QQ 占位 | 1 |
| 渠道页 Tab / 表单 / 测试发送 | 4 |
| 计划/子任务 notifyChannels | 5 |
| compile 注入 | 6 |
| notify_message + 角色白名单 | 3 |
| webhook 不进 LLM | 3、6 |
| 通知失败不阻断发布 | 3 返回字符串错误；6 prompt 明示 |
| 旧数据兼容 | 2 |

## Placeholder scan

无 TBD / 「类似 Task N」省略实现。

## Type consistency

- 工具名统一 `notify_message`
- 字段名统一 `notifyChannels` / `notifyConfig` / `kind`
- Store helper：`queryEnabledPublishChannelsFromStore` / `queryEnabledNotifyChannelsFromStore`
