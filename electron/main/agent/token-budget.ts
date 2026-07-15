import { HumanMessage, ToolMessage } from '@langchain/core/messages'
import type { BaseMessage } from '@langchain/core/messages'

/** 工具结果进入后续 ReAct 轮次前允许携带的最大字符数。 */
export const TOOL_RESULT_MAX_CHARS = 12_000

/** 会话恢复时回填给模型的历史消息最大字符数。 */
export const HISTORY_MAX_CHARS = 24_000

/**
 * 压缩超长工具结果。
 * 同时保留首部上下文和尾部状态，避免仅保留开头时丢失最终错误或执行结果。
 */
export function compactToolResult(content: string, maxChars = TOOL_RESULT_MAX_CHARS): string {
  if (content.length <= maxChars) return content

  const marker = `\n\n...[工具结果已截断，原始长度: ${content.length} 字符]...\n\n`
  if (maxChars <= marker.length) {
    return marker.slice(0, maxChars)
  }

  const availableChars = maxChars - marker.length
  const headChars = Math.ceil(availableChars * 0.75)
  const tailChars = availableChars - headChars
  return content.slice(0, headChars) + marker + content.slice(-tailChars)
}

/** 查询最近一条用户消息，供路由模型只读取当前意图。 */
export function queryLatestHumanMessage(messages: BaseMessage[]): BaseMessage | undefined {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (HumanMessage.isInstance(message) || message.getType?.() === 'human') {
      return message
    }
  }
  return undefined
}

/**
 * 从最新消息向前按字符预算裁剪历史。
 * 字符预算是供应商无关的保守近似，能避免单条超长消息绕过固定条数限制。
 */
export function trimMessagesToCharBudget(
  messages: BaseMessage[],
  maxChars = HISTORY_MAX_CHARS
): BaseMessage[] {
  const selected: BaseMessage[] = []
  let usedChars = 0

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    const chars = queryMessageCharLength(message)
    if (selected.length > 0 && usedChars + chars > maxChars) break
    selected.unshift(message)
    usedChars += chars
  }

  // OpenAI 兼容接口要求 ToolMessage 前存在对应的 assistant tool_call。
  // 若预算边界恰好切在工具结果前，移除开头的孤立结果，避免请求被供应商拒绝。
  while (selected.length > 0 && ToolMessage.isInstance(selected[0])) {
    selected.shift()
  }

  return selected
}

/** 将多模态消息内容序列化为稳定的字符预算。 */
function queryMessageCharLength(message: BaseMessage): number {
  if (typeof message.content === 'string') return message.content.length
  try {
    return JSON.stringify(message.content).length
  } catch {
    return String(message.content ?? '').length
  }
}
