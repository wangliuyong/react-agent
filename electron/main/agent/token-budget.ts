import { AIMessage, HumanMessage, ToolMessage, isAIMessage } from '@langchain/core/messages'
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
 * 清理并修复无法配对的 ToolMessage / 未完成的 tool_calls。
 *
 * 为什么：
 * 1. 会话落盘若丢失 assistant.tool_calls，冷启动会出现「纯文本 AI + 孤立 Tool」→ 供应商 400。
 * 2. present_plan_choices 等 await 会在 session 中插入占位 assistant / 用户选择，
 *    导致 tool_calls 与 tool 结果之间夹杂其他消息；OpenAI/DeepSeek 要求 tool 结果必须
 *    紧跟在对应 assistant.tool_calls 之后，否则报 INVALID_TOOL_RESULTS。
 * 3. 中断或进程重启可能留下「有 tool_calls、无 tool 结果」的助手消息，需补合成结果。
 */
export function sanitizeMessagesForModel(messages: BaseMessage[]): BaseMessage[] {
  const out: BaseMessage[] = []
  let index = 0

  while (index < messages.length) {
    const message = messages[index]

    if (isAIMessage(message) || AIMessage.isInstance(message)) {
      const ai = message as AIMessage
      const toolCalls = (ai.tool_calls ?? []).filter((tc) => Boolean(tc.id))
      if (!toolCalls.length) {
        out.push(message)
        index += 1
        continue
      }

      const neededIds = toolCalls.map((tc) => String(tc.id))
      const neededNameById = new Map(
        toolCalls.map((tc) => [String(tc.id), String(tc.name || 'tool')] as const)
      )
      const collected = new Map<string, ToolMessage>()

      // 先吞掉紧随其后的 ToolMessage；再向前扫描把「被占位消息隔开」的结果找回来
      let cursor = index + 1
      while (cursor < messages.length && ToolMessage.isInstance(messages[cursor])) {
        const toolMsg = messages[cursor] as ToolMessage
        const callId = String(toolMsg.tool_call_id ?? '')
        if (neededNameById.has(callId) && !collected.has(callId)) {
          collected.set(callId, toolMsg)
        }
        cursor += 1
      }

      if (collected.size < neededIds.length) {
        let lookAhead = cursor
        while (lookAhead < messages.length && collected.size < neededIds.length) {
          const candidate = messages[lookAhead]
          // 遇到下一次带 tool_calls 的助手消息则停止，避免跨轮误配
          if (
            (isAIMessage(candidate) || AIMessage.isInstance(candidate)) &&
            ((candidate as AIMessage).tool_calls?.length ?? 0) > 0
          ) {
            break
          }
          if (ToolMessage.isInstance(candidate)) {
            const toolMsg = candidate as ToolMessage
            const callId = String(toolMsg.tool_call_id ?? '')
            if (neededNameById.has(callId) && !collected.has(callId)) {
              collected.set(callId, toolMsg)
            }
          }
          lookAhead += 1
        }
      }

      out.push(message)
      for (const callId of neededIds) {
        const existing = collected.get(callId)
        if (existing) {
          out.push(existing)
          continue
        }
        // 补齐缺失的 tool 结果，避免下一轮请求被供应商以 INVALID_TOOL_RESULTS 拒绝
        out.push(
          new ToolMessage({
            content: '工具调用未完成或已中断（系统已自动跳过）',
            tool_call_id: callId,
            name: neededNameById.get(callId) || 'tool'
          })
        )
      }

      // 跳过已消费的连续 ToolMessage；被隔开的匹配结果稍后遇到时作孤立项丢弃
      index = cursor
      continue
    }

    if (ToolMessage.isInstance(message)) {
      // 孤立工具结果（无对应 tool_calls）一律丢弃
      index += 1
      continue
    }

    out.push(message)
    index += 1
  }

  return out
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

  // 裁剪后仍可能残留未配对 tool_calls / 错位 tool 结果，统一再清洗一次
  return sanitizeMessagesForModel(selected)
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
