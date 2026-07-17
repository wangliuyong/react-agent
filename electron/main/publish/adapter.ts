/**
 * 发布适配器：拟人浏览器 vs 平台 SDK（可插拔占位）。
 * 为什么：关闭「拟人操作」时走 SDK；暂无官方凭证时 SDK 明确报错，不静默打开浏览器。
 */

export interface PublishNoteParams {
  title: string
  content: string
  imagePaths?: string[]
  imageSourceUrl?: string
  imageUrls?: string[]
  signal?: AbortSignal
  /** 聊天且非完全访问时可能需要二次确认 */
  requireConfirm?: boolean
  sessionId?: string
  emitAwaitUser?: (reason: string) => void
}

export interface PublishAdapter {
  /** adapter id，如 browser-humanized / sdk */
  id: string
  publish(params: PublishNoteParams): Promise<string>
}

export type PublishChannelAdapterKey = 'xhs' | 'douyin'

type AdapterFactory = () => PublishAdapter

const browserFactories: Partial<Record<PublishChannelAdapterKey, AdapterFactory>> = {}
const sdkFactories: Partial<Record<PublishChannelAdapterKey, AdapterFactory>> = {}

/** 注册拟人浏览器适配器（启动时由渠道工具文件调用） */
export function postRegisterBrowserPublishAdapter(
  channelId: PublishChannelAdapterKey,
  factory: AdapterFactory
): void {
  browserFactories[channelId] = factory
}

/** 注册 SDK 适配器；未注册时使用占位实现 */
export function postRegisterSdkPublishAdapter(
  channelId: PublishChannelAdapterKey,
  factory: AdapterFactory
): void {
  sdkFactories[channelId] = factory
}

function querySdkPlaceholder(channelId: PublishChannelAdapterKey): PublishAdapter {
  const label = channelId === 'xhs' ? '小红书' : '抖音'
  return {
    id: 'sdk',
    async publish() {
      return (
        `${label} 官方 SDK 发布尚未接入。` +
        '请在渠道页开启「拟人操作」以使用浏览器发布，或配置 SDK 凭证后重试。'
      )
    }
  }
}

/**
 * 按渠道配置选择适配器。
 * humanized=true → 浏览器拟人；false → SDK（无实现则占位提示）。
 */
export function queryPublishAdapter(
  channelId: PublishChannelAdapterKey,
  humanized: boolean
): PublishAdapter {
  if (humanized) {
    const factory = browserFactories[channelId]
    if (!factory) {
      return {
        id: 'browser-humanized',
        async publish() {
          return `${channelId} 拟人发布适配器未注册`
        }
      }
    }
    return factory()
  }
  const sdkFactory = sdkFactories[channelId]
  return sdkFactory ? sdkFactory() : querySdkPlaceholder(channelId)
}
