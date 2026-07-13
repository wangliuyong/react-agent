/**
 * 发布渠道注册表：UI 展示、Agent 工具路由、旧数据迁移均由此处统一维护。
 * 新增渠道（如视频号）只需追加 PUBLISH_CHANNELS 并实现对应 publish 工具。
 */

/** 发布渠道 id（持久化字段，勿随意改名） */
export type PublishChannelId = 'xhs' | 'douyin' | 'wechat_channels'

export interface PublishChannelMeta {
  id: PublishChannelId
  /** 用户可见名称 */
  label: string
  /** 渠道页简介 */
  description: string
  /** 是否可在工作台选择 */
  enabled: boolean
  /** Agent 发布工具名（snake_case） */
  publishTool: string
  /** 标题建议最大字数；无单独标题的渠道可省略 */
  titleMaxLength?: number
  /** 登录检测 / 打开登录页时导航的创作者中心地址 */
  loginCheckUrl?: string
  /** 发给 Agent 的补充说明 */
  agentHint: string
}

/** 全部渠道元数据；wechat_channels 预留，enabled=false */
export const PUBLISH_CHANNELS: PublishChannelMeta[] = [
  {
    id: 'xhs',
    label: '小红书',
    description: '图文笔记发布，支持网页配图抓取与拟人化操作节奏控制。',
    enabled: true,
    publishTool: 'xhs_publish_note',
    titleMaxLength: 20,
    loginCheckUrl: 'https://creator.xiaohongshu.com/publish/publish?source=official',
    agentHint:
      '优先使用 xhs_publish_note（可传 imageSourceUrl 或先 fetch 再传 imagePaths）。' +
      '内容须去同质化：每篇标题结构、正文段落、话题标签需差异化，禁止模板批量替换关键词。' +
      '工具会自动浏览热身、随机延迟、配图微处理；遵守日≤2篇/周≤10篇、深夜0-6点不操作。'
  },
  {
    id: 'douyin',
    label: '抖音',
    description: '创作者中心图文笔记发布，当前仅支持图文，视频后续接入。',
    enabled: true,
    publishTool: 'douyin_publish_note',
    titleMaxLength: 30,
    loginCheckUrl: 'https://creator.douyin.com/creator-micro/content/upload',
    agentHint:
      '优先使用 douyin_publish_note 发布图文笔记（可传 imageSourceUrl 或先 fetch 再传 imagePaths）。' +
      '当前仅支持图文，视频发布后续支持。'
  },
  {
    id: 'wechat_channels',
    label: '视频号',
    description: '微信视频号发布能力预留中，接入后将支持图文与短视频。',
    enabled: false,
    publishTool: 'wechat_channels_publish_note',
    agentHint: '视频号发布能力尚未接入，请勿调用发布工具。'
  }
]

const CHANNEL_BY_ID = new Map(PUBLISH_CHANNELS.map((c) => [c.id, c]))

/** 旧版子任务存的是中文 label，读盘时需归一化为 id */
const LEGACY_LABEL_TO_ID: Record<string, PublishChannelId> = {
  小红书: 'xhs',
  抖音: 'douyin',
  视频号: 'wechat_channels'
}

/**
 * 将持久化的 channel 字段规范为 PublishChannelId。
 * 兼容历史 JSON 中的中文 label。
 */
export function normalizePublishChannelId(raw: string | PublishChannelId): PublishChannelId {
  if (CHANNEL_BY_ID.has(raw as PublishChannelId)) {
    return raw as PublishChannelId
  }
  const fromLabel = LEGACY_LABEL_TO_ID[raw.trim()]
  if (fromLabel) return fromLabel
  // 未知值回退小红书，避免 Agent 无法路由
  return 'xhs'
}

/** 取渠道展示名 */
export function queryPublishChannelLabel(id: PublishChannelId | string): string {
  const normalized = normalizePublishChannelId(String(id))
  return CHANNEL_BY_ID.get(normalized)?.label ?? String(id)
}

/** 取渠道元数据 */
export function queryPublishChannelMeta(id: PublishChannelId | string): PublishChannelMeta {
  const normalized = normalizePublishChannelId(String(id))
  return CHANNEL_BY_ID.get(normalized) ?? PUBLISH_CHANNELS[0]
}

/** 工作台 Select 可用选项 */
export function queryEnabledPublishChannels(): PublishChannelMeta[] {
  return PUBLISH_CHANNELS.filter((c) => c.enabled)
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
