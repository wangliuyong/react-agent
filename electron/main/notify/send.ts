import {
  normalizeChannelKind,
  queryPublishChannelMeta
} from '../../../shared/publish-channels'
import { queryPublishChannels } from '../store/channels'
import { postFeishuWebhookText } from './feishu'

export type NotifySendResult = { ok: true } | { ok: false; error: string }

/**
 * 按渠道 id 路由发送通知。
 * webhook / secret 只在主进程读取，永不返回给调用方或 LLM。
 */
export async function postNotifyMessage(args: {
  channelId: string
  title?: string
  content: string
}): Promise<NotifySendResult> {
  // 为什么：发送前强制从磁盘刷新注册表，避免 UI 刚保存后 registry 仍是空 Webhook
  queryPublishChannels()
  const meta = queryPublishChannelMeta(args.channelId)
  if (normalizeChannelKind(meta.kind) !== 'notify') {
    return { ok: false, error: `渠道 ${args.channelId} 不是通知渠道` }
  }
  if (meta.id === 'wechat_notify' || meta.id === 'qq_notify') {
    return { ok: false, error: `${meta.label} 通知能力尚未接入` }
  }
  if (meta.id !== 'feishu') {
    return { ok: false, error: `未知通知渠道：${meta.id}` }
  }
  const webhookUrl = meta.notifyConfig?.webhookUrl?.trim()
  if (!webhookUrl) {
    return { ok: false, error: '飞书 Webhook 未配置，请先在渠道页填写并保存' }
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
