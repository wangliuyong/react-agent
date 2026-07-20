import type { ChatMessage } from '@shared/types'

/** 工作流引擎写入的确认文案前缀 */
const AWAIT_CONFIRM_PREFIX = '等待确认：'

/**
 * 从会话消息中解析最近一次「等待确认」原因。
 * 用于 await_user 事件丢失或切换会话后恢复确认条。
 */
export function queryAwaitUserReasonFromMessages(
  messages: ChatMessage[] | null | undefined
): string | null {
  if (!messages?.length) return null
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]
    if (msg.role !== 'assistant') continue
    const content = msg.content?.trim() ?? ''
    if (!content.startsWith(AWAIT_CONFIRM_PREFIX)) continue
    const reason = content.slice(AWAIT_CONFIRM_PREFIX.length).trim()
    return reason || '请确认后继续'
  }
  return null
}
