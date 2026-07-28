/**
 * DeepSeek thinking 模式下，带 tool_calls 的 assistant 必须在后续请求中回传 reasoning_content。
 * @langchain/openai 的 Completions 转换器会丢掉 additional_kwargs.reasoning_content，
 * 导致多轮工具（尤其是 present_plan_choices 之后继续）被供应商 400 拒绝。
 *
 * 实现：
 * 1. 自定义 fetch：发请求前把 reasoning_content 写回 messages
 * 2. Callback handleChatModelStart + AsyncLocalStorage.enterWith：把当前 LC 消息传给 fetch
 *    （ChatOpenAI.withConfig 会 new ChatOpenAI，无法依赖子类方法重写）
 */
import { AsyncLocalStorage } from 'node:async_hooks'
import { BaseCallbackHandler } from '@langchain/core/callbacks/base'
import { AIMessage, isAIMessage } from '@langchain/core/messages'
import type { BaseMessage } from '@langchain/core/messages'
import type { Serialized } from '@langchain/core/load/serializable'

type CompletionsMessage = Record<string, unknown>
type FetchFn = typeof globalThis.fetch

/** 当前模型调用对应的 LC 消息（供 fetch 注入 reasoning_content） */
const thinkingRoundtripAls = new AsyncLocalStorage<BaseMessage[]>()

/**
 * 将 LC 消息中的 reasoning_content 按顺序注入到「带 tool_calls 的 assistant」请求消息上。
 */
export function postInjectReasoningContent(
  lcMessages: BaseMessage[],
  apiMessages: CompletionsMessage[]
): CompletionsMessage[] {
  const reasonings: string[] = []
  for (const message of lcMessages) {
    if (!isAIMessage(message) && !AIMessage.isInstance(message)) continue
    const ai = message as AIMessage
    if (!ai.tool_calls?.length) continue
    const reasoning = ai.additional_kwargs?.reasoning_content
    if (typeof reasoning === 'string' && reasoning.trim()) {
      reasonings.push(reasoning)
    }
  }

  if (!reasonings.length) return apiMessages

  let reasoningIndex = 0
  return apiMessages.map((msg) => {
    if (msg.role !== 'assistant') return msg
    const toolCalls = msg.tool_calls
    if (!Array.isArray(toolCalls) || toolCalls.length === 0) return msg
    if (typeof msg.reasoning_content === 'string' && msg.reasoning_content.trim()) {
      return msg
    }
    const next = reasonings[reasoningIndex]
    if (next == null) return msg
    reasoningIndex += 1
    return { ...msg, reasoning_content: next }
  })
}

/** 创建会回写 reasoning_content 的 fetch */
export function createThinkingRoundtripFetch(baseFetch?: FetchFn): FetchFn {
  const fetchFn = baseFetch ?? globalThis.fetch.bind(globalThis)
  return async (input, init) => {
    const lcMessages = thinkingRoundtripAls.getStore()
    if (lcMessages && init?.body && typeof init.body === 'string') {
      try {
        const body = JSON.parse(init.body) as { messages?: CompletionsMessage[] }
        if (Array.isArray(body.messages)) {
          const patched = {
            ...body,
            messages: postInjectReasoningContent(lcMessages, body.messages)
          }
          return fetchFn(input, { ...init, body: JSON.stringify(patched) })
        }
      } catch {
        // 解析失败则原样发送，避免阻断正常请求
      }
    }
    return fetchFn(input, init)
  }
}

/**
 * 模型调用开始时把 LC 消息写入 ALS，供同上下文中的 fetch 读取。
 */
export class ThinkingRoundtripCallbackHandler extends BaseCallbackHandler {
  name = 'thinking_roundtrip'

  handleChatModelStart(
    _llm: Serialized,
    messages: BaseMessage[][],
    _runId: string,
    _parentRunId?: string,
    _extraParams?: Record<string, unknown>,
    _tags?: string[],
    _metadata?: Record<string, unknown>,
    _runName?: string
  ): void {
    const flat = messages.flat()
    if (flat.length) {
      thinkingRoundtripAls.enterWith(flat)
    }
  }
}

/** 供 createChatModel / withSessionTokenUsage 挂载的单例 callback */
export const thinkingRoundtripCallback = new ThinkingRoundtripCallbackHandler()
