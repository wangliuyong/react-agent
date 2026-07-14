# 通知渠道设计（发布渠道 / 通知渠道二分）

> 日期：2026-07-14  
> 状态：已确认  

> 相关：`shared/publish-channels.ts`、`src/features/channels/`、`shared/compile-publish-workflow.ts`

## 背景与目标

当前渠道模型仅覆盖**发布渠道**（小红书 / 抖音 / 视频号），统一为 `PublishChannelMeta`。需要引入**通知渠道**（飞书、微信、QQ），满足两类场景：

1. **发布结果通知**：发布计划或子任务结束后，把成功/失败结果推送到通知渠道  
2. **独立发消息**：Agent / 工作流在任意时刻调用通知工具发消息（不绑定发布）

### 本期范围

| 能力 | 本期 |
|------|------|
| 渠道类型二分 + UI Tab | 做 |
| 飞书自定义机器人 Webhook 真实发送 | 做 |
| 微信 / QQ 通知 | 仅类型占位（`enabled: false`） |
| 计划级 + 子任务级可配置通知 | 做 |
| 飞书开放平台 App API、企业微信/QQ 真实发送、富文本卡片 | 不做 |

## 方案选择

**统一渠道表 + `kind` 字段**（方案一）。

- 共用现有渠道页、CRUD、IPC、`channels.json`  
- 渠道页用 Tab 过滤「发布 / 通知」  
- 相对两套注册表（方案二）改动更小；相对「仅设置页插件」（方案三）更符合产品表达与后续扩展  

## 数据模型

在现有渠道元数据上扩展（类型名可保留 `PublishChannelMeta` 或逐步更名为 `ChannelMeta`，语义变为「渠道」）：

```ts
type ChannelKind = 'publish' | 'notify'

interface ChannelMeta {
  id: string
  kind: ChannelKind          // 新增；旧数据缺省视为 'publish'
  label: string
  description: string
  enabled: boolean
  isBuiltin?: boolean
  agentHint: string
  updatedAt?: number
  // —— kind=publish ——
  publishTool?: string       // 必填
  titleMaxLength?: number
  loginCheckUrl?: string
  // —— kind=notify ——
  notifyTool?: string        // 建议统一映射到 'notify_message'
  notifyConfig?: {
    webhookUrl?: string      // 飞书机器人 URL；仅本地 userData
    secret?: string          // 可选签名密钥
  }
}
```

### 内置种子

| id | kind | 说明 |
|----|------|------|
| `xhs` / `douyin` / `wechat_channels` | publish | 沿用现有 |
| `feishu` | notify | enabled；需配置 webhook 后方可选用 |
| `wechat_notify` | notify | 占位，`enabled: false` |
| `qq_notify` | notify | 占位，`enabled: false` |

### 发布计划绑定

与现有 `channels`（发布列表）分离，避免混选：

```ts
interface PublishPlan {
  // ...existing
  /** 计划全部结束后汇总通知的渠道 id 列表 */
  notifyChannels?: string[]
}

interface PublishSubTask {
  // ...existing channels: PublishChannelId[]
  /** 本子任务结束后额外通知；空 = 仅跟随计划级 */
  notifyChannels?: string[]
}
```

### 持久化与兼容

- 仍写 `userData/channels.json`  
- 读盘：缺 `kind` → `'publish'`；合并内置通知种子  
- 工作台选择器：  
  - 发布：`kind === 'publish' && enabled`  
  - 通知：`kind === 'notify' && enabled && 已配置（飞书需有 webhookUrl）`

## UI

沿用渠道管理页（技能市场式卡片），顶部 **Tabs**：

| Tab | 内容 |
|-----|------|
| 发布渠道 | `kind === 'publish'`；保留登录检测 / 打开登录 |
| 通知渠道 | `kind === 'notify'`；无登录态；展示「已配置 / 未配置 / 即将上线」 |

- 现有筛选（全部 / 已启用 / 预留）+ 搜索在各自 Tab 内生效  
- 新建时按当前 Tab 预填 `kind`，**创建后不可改类型**  
- 通知表单：id、名称、简介、enabled、notifyTool、webhookUrl（Password）、可选 secret、agentHint  
- 飞书卡片：「测试发送」「编辑」  
- 工作台：计划级「计划结束通知」多选；子任务弹窗「本任务结束通知」多选；发布 Tag 与通知 Tag 颜色区分  

## 发布绑定与工作流编译

### 触发时机

| 时机 | 行为 |
|------|------|
| 子任务 Agent 节点结束 | 若子任务配置了 `notifyChannels`，prompt + whitelist 指引调用 `notify_message` |
| 计划全部子任务跑完 | 若计划配置了 `notifyChannels`，追加汇总通知节点 |

### `compile-publish-workflow.ts`

1. 子任务节点：`toolWhitelist` 并入 `notify_message`；prompt 增加「发布完成后调用通知」说明  
2. 计划末尾：有计划级通知时追加汇总节点（whitelist 仅 `notify_message`）  
3. Agent 只传 `channelId` + `title` + `content`；主进程读 `notifyConfig`，**webhook 不进入模型上下文**

### 失败策略

通知失败**不阻断**已成功的发布结果；日志与 UI 提示「通知失败」。

## Agent 工具

统一工具（不按渠道拆多个）：

```text
notify_message
  channelId: string   // feishu / wechat_notify / qq_notify
  title?: string
  content: string
```

- 文件：`electron/main/agent/tools/notify-tools.ts`，在 `tools/index.ts` 注册  
- `permission: 'safe'`；未配置 webhook 时返回明确错误  
- 聊天图：`general` + `publisher` 白名单  
- 工作流：仅节点 whitelist 含该工具时可用  
- `wechat_notify` / `qq_notify`：stub，返回「能力尚未接入」

### 飞书发送（本期）

- 自定义机器人 Webhook：`POST` `{ msg_type: 'text', content: { text } }`  
- 配置了 `secret` 时按飞书签名带 `timestamp` + `sign`  
- 渠道页「测试发送」走同一发送路径  
- 日志脱敏：只记 channelId 与成败，不打印完整 webhook  

## 安全

- webhook / secret 仅本地 `channels.json`，不进 git、不进 LLM  
- UI 用 Password 输入框  
- 通知失败不拖垮发布成功语义  

## 非目标（明确不做）

- 飞书开放平台 App（tenant_access_token）私聊/群聊 API  
- 企业微信、QQ 真实发送  
- 富文本卡片、图片附件通知  
- 将通知渠道混入子任务 `channels` 字段  

### 测试要点（实现后手测）

1. 旧 `channels.json` 无 `kind` 时读盘全部视为 publish，UI 正常；飞书等种子自动补入  
2. 飞书未配 webhook：工作台通知多选不含飞书；工具/测试发送报「未配置」  
3. 飞书已配：测试发送成功；子任务结束 / 计划结束编译节点含 `notify_message`  
4. 通知失败时发布结果仍为成功（prompt 明示）  
5. 聊天中直接「发一条飞书」可调用 `notify_message`  
6. 微信/QQ 占位：通知 Tab 可见、不可正式选用、工具返回未接入  

> 实现已完成（`pnpm typecheck` 通过）。请按上表在本机完成 Webhook 实发冒烟。
