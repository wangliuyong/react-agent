import type { ChatMessage } from './types'

/**
 * 工作流引擎注入到会话的内部过程文案前缀。
 * 这些内容供 Agent / 选路使用，不应作为用户气泡展示。
 */
const WORKFLOW_INTERNAL_USER_PREFIXES = ['【工作流步骤】', '【条件分支】'] as const

/**
 * 判断消息是否应在用户侧聊天时间线中隐藏。
 * - 显式 `hidden: true`（新写入）
 * - 兼容旧会话：以工作流内部前缀开头的 user 消息
 */
export function queryIsUiHiddenChatMessage(
  message: Pick<ChatMessage, 'role' | 'content' | 'hidden'>
): boolean {
  if (message.hidden) return true
  if (message.role === 'system') return true
  if (message.role !== 'user') return false
  const text = message.content?.trim() ?? ''
  return WORKFLOW_INTERNAL_USER_PREFIXES.some((prefix) => text.startsWith(prefix))
}
