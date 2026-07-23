import type { ChatMessage, UserChoiceOption } from '@shared/types'

/** 工作流引擎写入的确认文案前缀 */
const AWAIT_CONFIRM_PREFIX = '等待确认：'

export interface AwaitUserFromMessages {
  reason: string | null
  choices: UserChoiceOption[] | null
}

/**
 * 从会话消息中解析最近一次「等待确认」原因与方案列表。
 * 优先读取 awaitMeta；兼容旧版纯文本前缀。
 */
export function queryAwaitUserFromMessages(
  messages: ChatMessage[] | null | undefined
): AwaitUserFromMessages {
  if (!messages?.length) return { reason: null, choices: null }
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]
    if (msg.role !== 'assistant') continue

    if (msg.awaitMeta?.reason) {
      return {
        reason: msg.awaitMeta.reason,
        choices: msg.awaitMeta.choices?.length ? msg.awaitMeta.choices : null
      }
    }

    const content = msg.content?.trim() ?? ''
    if (!content.startsWith(AWAIT_CONFIRM_PREFIX)) continue
    const reason = content.slice(AWAIT_CONFIRM_PREFIX.length).trim()
    return { reason: reason || '请确认后继续', choices: null }
  }
  return { reason: null, choices: null }
}

/**
 * 从会话消息中解析最近一次「等待确认」原因。
 * 用于 await_user 事件丢失或切换会话后恢复确认条。
 */
export function queryAwaitUserReasonFromMessages(
  messages: ChatMessage[] | null | undefined
): string | null {
  return queryAwaitUserFromMessages(messages).reason
}

/** 从会话消息解析最近一次挂起确认的可选方案 */
export function queryAwaitUserChoicesFromMessages(
  messages: ChatMessage[] | null | undefined
): UserChoiceOption[] | null {
  return queryAwaitUserFromMessages(messages).choices
}
