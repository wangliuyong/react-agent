import { postNotifyMessage } from '../../notify/send'
import type { AgentTool } from './types'

/**
 * 统一通知工具：按 channelId 路由到具体发送器。
 * 模型只传 channelId / title / content，看不到 webhook。
 */
export const notifyMessageTool: AgentTool = {
  name: 'notify_message',
  description:
    '向通知渠道发送文本消息（飞书等）。只需传 channelId（如 feishu）与 content；不要传 webhook。' +
    '可用于发布结果汇报或独立提醒。',
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
