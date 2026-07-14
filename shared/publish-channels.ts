/**
 * 渠道注册表：发布渠道 + 通知渠道。
 * UI 展示、Agent 工具路由、旧数据迁移均由此处统一维护。
 * 内置渠道作为默认种子；用户可在渠道页新增/编辑，持久化到 userData/channels.json。
 */

/** 渠道 id（持久化字段，勿随意改名；自定义渠道亦使用小写+连字符） */
export type PublishChannelId = string

/** 渠道类型：发布到内容平台 / 推送通知消息 */
export type ChannelKind = 'publish' | 'notify'

/** 通知渠道配置（敏感信息仅存本地 userData） */
export interface ChannelNotifyConfig {
  webhookUrl?: string
  secret?: string
}

export interface PublishChannelMeta {
  id: PublishChannelId
  /**
   * 渠道类型。旧数据缺省视为 publish，读盘时由 normalizeChannelKind 补齐。
   */
  kind: ChannelKind
  /** 用户可见名称 */
  label: string
  /** 渠道页简介 */
  description: string
  /** 是否可在工作台选择（通知渠道还需 isNotifyChannelConfigured） */
  enabled: boolean
  /** 发给 Agent 的补充说明 */
  agentHint: string
  /** 内置渠道（小红书/抖音/飞书等）不可删除 */
  isBuiltin?: boolean
  /** 最近更新时间戳 */
  updatedAt?: number
  /** Agent 发布工具名（snake_case）；kind=publish 时使用 */
  publishTool?: string
  /** 标题建议最大字数；无单独标题的渠道可省略 */
  titleMaxLength?: number
  /** 登录检测 / 打开登录页时导航的创作者中心地址 */
  loginCheckUrl?: string
  /** 通知工具名；本期统一为 notify_message */
  notifyTool?: string
  /** 通知配置（webhook 等）；勿下发给 LLM */
  notifyConfig?: ChannelNotifyConfig
}

/** 新建/编辑渠道 DTO（不含 isBuiltin，主进程写入时补齐） */
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

/** 缺省或非法 kind → publish（兼容旧 channels.json） */
export function normalizeChannelKind(raw: unknown): ChannelKind {
  return raw === 'notify' ? 'notify' : 'publish'
}

/**
 * 通知渠道是否已配置到可在工作台选用。
 * 飞书需要 webhook；微信/QQ 占位永不视为已配置。
 */
export function isNotifyChannelConfigured(meta: PublishChannelMeta): boolean {
  if (normalizeChannelKind(meta.kind) !== 'notify') return false
  if (meta.id === 'feishu') {
    return Boolean(meta.notifyConfig?.webhookUrl?.trim())
  }
  return false
}

/** 内置默认渠道；首次启动或升级时合并进持久化文件 */
export const DEFAULT_PUBLISH_CHANNELS: PublishChannelMeta[] = [
  {
    id: 'xhs',
    kind: 'publish',
    label: '小红书',
    description: '图文笔记发布，支持网页配图抓取与拟人化操作节奏控制。',
    enabled: true,
    publishTool: 'xhs_publish_note',
    titleMaxLength: 20,
    loginCheckUrl: 'https://creator.xiaohongshu.com/publish/publish?source=official',
    agentHint:
      '优先使用 xhs_publish_note（可传 imageSourceUrl 或先 fetch 再传 imagePaths）。' +
      '内容须去同质化：每篇标题结构、正文段落、话题标签需差异化，禁止模板批量替换关键词。' +
      '工具会自动浏览热身、随机延迟、配图微处理；遵守日≤2篇/周≤10篇、深夜0-6点不操作。',
    isBuiltin: true
  },
  {
    id: 'douyin',
    kind: 'publish',
    label: '抖音',
    description: '创作者中心图文笔记发布，当前仅支持图文，视频后续接入。',
    enabled: true,
    publishTool: 'douyin_publish_note',
    titleMaxLength: 30,
    loginCheckUrl: 'https://creator.douyin.com/creator-micro/content/upload',
    agentHint:
      '优先使用 douyin_publish_note 发布图文笔记（可传 imageSourceUrl 或先 fetch 再传 imagePaths）。' +
      '当前仅支持图文，视频发布后续支持。',
    isBuiltin: true
  },
  {
    id: 'wechat_channels',
    kind: 'publish',
    label: '视频号',
    description: '微信视频号发布能力预留中，接入后将支持图文与短视频。',
    enabled: false,
    publishTool: 'wechat_channels_publish_note',
    agentHint: '视频号发布能力尚未接入，请勿调用发布工具。',
    isBuiltin: true
  },
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
]

/** @deprecated 请使用 getPublishChannels()；保留别名便于渐进迁移 */
export const PUBLISH_CHANNELS = DEFAULT_PUBLISH_CHANNELS

/** 运行时渠道注册表（主进程启动 / 渲染进程 hydrate 后同步） */
let runtimeChannels: PublishChannelMeta[] = [...DEFAULT_PUBLISH_CHANNELS]

/** 同步运行时注册表（主进程读盘、渲染进程 hydrate 后调用） */
export function setPublishChannelRegistry(channels: PublishChannelMeta[]): void {
  runtimeChannels = channels.length ? channels : [...DEFAULT_PUBLISH_CHANNELS]
}

/** 当前全部渠道（运行时） */
export function getPublishChannels(): PublishChannelMeta[] {
  return runtimeChannels
}

function getChannelByIdMap(): Map<PublishChannelId, PublishChannelMeta> {
  return new Map(runtimeChannels.map((c) => [c.id, c]))
}

/** 旧版子任务存的是中文 label，读盘时需归一化为 id */
const LEGACY_LABEL_TO_ID: Record<string, PublishChannelId> = {
  小红书: 'xhs',
  抖音: 'douyin',
  视频号: 'wechat_channels'
}

/**
 * 将持久化的 channel 字段规范为 PublishChannelId。
 * 兼容历史 JSON 中的中文 label。
 * 注意：仅用于发布渠道；未知值回退 xhs，避免误把通知 id 当成发布渠道时应用。
 */
export function normalizePublishChannelId(raw: string | PublishChannelId): PublishChannelId {
  const trimmed = String(raw).trim()
  if (getChannelByIdMap().has(trimmed)) {
    return trimmed
  }
  const fromLabel = LEGACY_LABEL_TO_ID[trimmed]
  if (fromLabel) return fromLabel
  // 未知值回退小红书，避免 Agent 无法路由
  return 'xhs'
}

/** 取渠道展示名（发布或通知均可；未知 id 原样返回） */
export function queryPublishChannelLabel(id: PublishChannelId | string): string {
  const trimmed = String(id).trim()
  const direct = getChannelByIdMap().get(trimmed)
  if (direct) return direct.label
  const normalized = normalizePublishChannelId(trimmed)
  return getChannelByIdMap().get(normalized)?.label ?? trimmed
}

/** 取渠道元数据 */
export function queryPublishChannelMeta(id: PublishChannelId | string): PublishChannelMeta {
  const trimmed = String(id).trim()
  const direct = getChannelByIdMap().get(trimmed)
  if (direct) return direct
  const normalized = normalizePublishChannelId(trimmed)
  return getChannelByIdMap().get(normalized) ?? runtimeChannels[0] ?? DEFAULT_PUBLISH_CHANNELS[0]
}

/** 工作台发布渠道 Select 可用选项 */
export function queryEnabledPublishChannels(): PublishChannelMeta[] {
  return runtimeChannels.filter(
    (c) => normalizeChannelKind(c.kind) === 'publish' && c.enabled
  )
}

/** 工作台通知渠道 Select：已启用且已配置 */
export function queryEnabledNotifyChannels(): PublishChannelMeta[] {
  return runtimeChannels.filter(
    (c) =>
      normalizeChannelKind(c.kind) === 'notify' &&
      c.enabled &&
      isNotifyChannelConfigured(c)
  )
}

/**
 * 将持久化的渠道字段规范为 id 数组。
 * 兼容旧版单字段 channel 与中文 label。
 */
export function normalizePublishSubTaskChannels(
  raw: { channels?: unknown; channel?: unknown } | PublishChannelId[]
): PublishChannelId[] {
  if (Array.isArray(raw)) {
    const ids = raw
      .map((item) => normalizePublishChannelId(String(item)))
      .filter((id, index, arr) => arr.indexOf(id) === index)
    return ids.length ? ids : ['xhs']
  }

  const channels = raw.channels
  if (Array.isArray(channels) && channels.length > 0) {
    const ids = channels
      .map((item) => normalizePublishChannelId(String(item)))
      .filter((id, index, arr) => arr.indexOf(id) === index)
    return ids.length ? ids : ['xhs']
  }

  if (raw.channel != null && String(raw.channel).trim()) {
    return [normalizePublishChannelId(String(raw.channel))]
  }

  return ['xhs']
}

/** 多渠道展示名，如「小红书、抖音」 */
export function queryPublishChannelLabels(ids: PublishChannelId[]): string {
  const normalized = normalizePublishSubTaskChannels(ids)
  return normalized.map((id) => queryPublishChannelLabel(id)).join('、')
}
