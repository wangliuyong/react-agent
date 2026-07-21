import { postNotifyMessage, postNotifyMessageFanout } from '../../notify/send'
import type { AgentTool } from './types'

/**
 * 统一通知工具：按 channelId / channelIds 路由到具体发送器。
 * 模型只传渠道 id 与 content，看不到 webhook。
 * 飞书支持 msgType：text / post / image / share_chat。
 */
export const notifyMessageTool: AgentTool = {
  name: 'notify_message',
  description:
    '向通知渠道发送消息（飞书、通用 webhook 等）。' +
    '可传 channelId（单渠道）或 channelIds（多渠道同时通知）；不要传 webhook。' +
    '飞书可选 msgType：post（Markdown 富文本，含表格/标题会自动排版）、text（纯文本）、image（需 imageKey）、share_chat（需 shareChatId）。' +
    '同一渠道+同一正文只需调用一次；工具返回成功后禁止再次调用。',
  permission: 'safe',
  parameters: {
    type: 'object',
    properties: {
      channelId: { type: 'string', description: '单个通知渠道 id，如 feishu / webhook' },
      channelIds: {
        type: 'array',
        items: { type: 'string' },
        description: '多个通知渠道 id，同时推送'
      },
      title: { type: 'string', description: '可选标题（text / post 有效）' },
      content: { type: 'string', description: '正文（text / post 必填；image / share_chat 可留空）' },
      msgType: {
        type: 'string',
        enum: ['text', 'post', 'image', 'share_chat'],
        description: '飞书消息类型；缺省使用渠道配置或 text'
      },
      imageKey: {
        type: 'string',
        description: '飞书图片消息 image_key；可覆盖渠道配置'
      },
      shareChatId: {
        type: 'string',
        description: '飞书群名片 share_chat_id；可覆盖渠道配置'
      }
    }
  },
  async execute(args) {
    const content = String(args.content ?? '')
    const title = args.title != null ? String(args.title) : undefined
    const msgType =
      args.msgType != null ? (String(args.msgType).trim() as 'text' | 'post' | 'image' | 'share_chat') : undefined
    const imageKey = args.imageKey != null ? String(args.imageKey).trim() : undefined
    const shareChatId = args.shareChatId != null ? String(args.shareChatId).trim() : undefined

    // image / share_chat 可不传 content；text / post 需有正文
    const needsContent = !msgType || msgType === 'text' || msgType === 'post'
    if (needsContent && !content.trim()) return '缺少 content'

    const fromArray = Array.isArray(args.channelIds)
      ? (args.channelIds as unknown[]).map(String).filter(Boolean)
      : []
    const single = args.channelId != null ? String(args.channelId).trim() : ''
    const channelIds = fromArray.length > 0 ? fromArray : single ? [single] : []
    if (channelIds.length === 0) {
      return '请提供 channelId 或 channelIds'
    }

    const sendArgs = { title, content, msgType, imageKey, shareChatId }

    if (channelIds.length === 1) {
      const result = await postNotifyMessage({
        channelId: channelIds[0],
        ...sendArgs
      })
      if (!result.ok) return `通知失败：${result.error}`
      if (result.deduped) {
        return `已发送通知到 ${channelIds[0]}（相同内容短时去重，未重复推送）。任务已完成，请立即结束，不要再次调用本工具。`
      }
      return `已发送通知到 ${channelIds[0]}。任务已完成，请立即结束，不要再次调用本工具。`
    }

    const fanout = await postNotifyMessageFanout({ channelIds, ...sendArgs })
    const lines = fanout.results.map((r) =>
      r.ok
        ? `- ${r.channelId}: 成功${r.deduped ? '（去重）' : ''}`
        : `- ${r.channelId}: 失败（${r.error}）`
    )
    return (
      `多渠道通知完成：成功 ${fanout.okCount} / 失败 ${fanout.failCount}\n` +
      lines.join('\n') +
      '\n任务已完成，请立即结束，不要再次调用本工具。'
    )
  }
}
