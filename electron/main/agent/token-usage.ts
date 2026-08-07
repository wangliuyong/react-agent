import { BaseCallbackHandler } from '@langchain/core/callbacks/base'
import {
  AIMessage,
  isAIMessage,
  type BaseMessage
} from '@langchain/core/messages'
import type { LLMResult } from '@langchain/core/outputs'
import type { AgentEvent } from '../../../shared/types'
import { querySession, postSession } from '../store/sessions'
import { getMainWindow } from '../window'
import { createSessionStreamHandler } from './stream-callbacks'
import { thinkingRoundtripCallback } from './chat-openai-thinking-roundtrip'

/**
 * Token 计费估算系数（供应商未返回 usage 时的兜底）。
 * 实际以模型返回的 usage 为准；此处仅统计送入/产出的自然语言交互文本。
 *
 * - 1 个英文字符 ≈ 0.3 token
 * - 1 个中文字符 ≈ 0.6 token
 */
export const TOKEN_PER_EN_CHAR = 0.3
export const TOKEN_PER_ZH_CHAR = 0.6

/** CJK 统一表意文字（含扩展 A / 兼容），用于识别中文字符 */
const CJK_CHAR_RE = /[\u3400-\u9FFF\uF900-\uFAFF]/

/** 供应商 usage 字段的常见形状（OpenAI / DeepSeek / 百炼兼容） */
interface TokenUsageLike {
  totalTokens?: number
  total_tokens?: number
  promptTokens?: number
  prompt_tokens?: number
  completionTokens?: number
  completion_tokens?: number
  input_tokens?: number
  output_tokens?: number
}

/** 推送 Agent 事件到渲染进程（避免与 graph-bridge 循环依赖） */
function emitAgentEvent(event: AgentEvent): void {
  const win = getMainWindow()
  if (win && !win.isDestroyed()) {
    win.webContents.send('event:agent', event)
  }
}

/**
 * 按字符估算 token：只对自然语言文本计数。
 * 中文（CJK）按 0.6，其余字符（英文、数字、符号、空白等）按 0.3。
 */
export function queryEstimateTokensFromText(text: string): number {
  if (!text) return 0
  let tokens = 0
  for (const char of text) {
    tokens += CJK_CHAR_RE.test(char) ? TOKEN_PER_ZH_CHAR : TOKEN_PER_EN_CHAR
  }
  return tokens
}

/** 从消息 content 提取纯文本；跳过 image_url 等非文本块，避免把媒体算进估算 */
export function queryTextFromMessageContent(content: unknown): string {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) {
    if (content == null) return ''
    try {
      return JSON.stringify(content)
    } catch {
      return String(content)
    }
  }

  const parts: string[] = []
  for (const part of content) {
    if (typeof part === 'string') {
      parts.push(part)
      continue
    }
    if (!part || typeof part !== 'object') continue
    const record = part as Record<string, unknown>
    // 多模态文本块：{ type: 'text', text: '...' }
    if (typeof record.text === 'string') {
      parts.push(record.text)
    }
  }
  return parts.join('')
}

/**
 * 将单条 BaseMessage 序列化为「送入模型的交互文本」。
 * 含 content 与 assistant.tool_calls（工具调用也是模型输出/后续输入的一部分）。
 */
export function queryTextFromBaseMessage(message: BaseMessage): string {
  const parts: string[] = [queryTextFromMessageContent(message.content)]

  if (isAIMessage(message) || AIMessage.isInstance(message)) {
    const toolCalls = (message as AIMessage).tool_calls
    if (toolCalls?.length) {
      try {
        parts.push(JSON.stringify(toolCalls))
      } catch {
        // 忽略不可序列化的 tool_calls
      }
    }
    const reasoning = (message as AIMessage).additional_kwargs?.reasoning_content
    if (typeof reasoning === 'string' && reasoning) {
      parts.push(reasoning)
    }
  }

  return parts.join('')
}

/** 从 LLMResult 提取模型补全侧文本（回答 / tool_calls / reasoning） */
export function queryTextFromLlmResult(result: LLMResult): string {
  const parts: string[] = []
  for (const generationGroup of result.generations) {
    for (const generation of generationGroup) {
      const message = generation.message
      if (message && typeof message === 'object') {
        parts.push(queryTextFromBaseMessage(message as BaseMessage))
        continue
      }
      if (typeof generation.text === 'string' && generation.text) {
        parts.push(generation.text)
      }
    }
  }
  return parts.join('')
}

/** 从任意 usage 对象解析 token 总数 */
function queryTokensFromUsageRecord(usage: unknown): number {
  if (!usage || typeof usage !== 'object') return 0
  const record = usage as TokenUsageLike

  if (typeof record.totalTokens === 'number' && record.totalTokens > 0) {
    return record.totalTokens
  }
  if (typeof record.total_tokens === 'number' && record.total_tokens > 0) {
    return record.total_tokens
  }

  const prompt =
    record.promptTokens ?? record.prompt_tokens ?? record.input_tokens ?? 0
  const completion =
    record.completionTokens ?? record.completion_tokens ?? record.output_tokens ?? 0
  const sum = prompt + completion
  return sum > 0 ? sum : 0
}

/** 从 LangChain usage_metadata 解析 token 总数 */
export function queryTokensFromUsageMetadata(
  usage: AIMessage['usage_metadata'] | undefined
): number {
  if (!usage) return 0
  return queryTokensFromUsageRecord(usage)
}

/** 从单次 LLM 调用的 LLMResult 汇总 token（兼容 llmOutput 与 generations） */
export function queryTokensFromLlmResult(result: LLMResult): number {
  const llmOutput = result.llmOutput as Record<string, unknown> | undefined
  if (llmOutput) {
    const fromOutput =
      queryTokensFromUsageRecord(llmOutput.tokenUsage) ||
      queryTokensFromUsageRecord(llmOutput.usage)
    if (fromOutput > 0) return fromOutput
  }

  let total = 0
  for (const generationGroup of result.generations) {
    for (const generation of generationGroup) {
      const message = generation.message
      if (message && typeof message === 'object' && 'usage_metadata' in message) {
        total += queryTokensFromUsageMetadata(
          (message as AIMessage).usage_metadata
        )
      }
      const responseMetadata =
        message && typeof message === 'object' && 'response_metadata' in message
          ? ((message as AIMessage).response_metadata as Record<string, unknown>)
          : undefined
      if (responseMetadata) {
        total +=
          queryTokensFromUsageRecord(responseMetadata.tokenUsage) ||
          queryTokensFromUsageRecord(responseMetadata.usage)
      }
    }
  }
  return total
}

/**
 * 累加会话 token 并落盘，同时推送 token_update 供 UI 实时刷新。
 * 每次 LLM 调用结束通过 callback 触发一次。
 */
export function postSessionTokenDelta(sessionId: string, delta: number): void {
  if (!Number.isFinite(delta) || delta <= 0) return

  const session = querySession(sessionId)
  if (!session) return

  session.tokenUsed += Math.round(delta)
  session.updatedAt = Date.now()
  postSession(session)

  emitAgentEvent({
    type: 'token_update',
    sessionId,
    tokenUsed: session.tokenUsed,
    delta: Math.round(delta)
  })
}

/**
 * 绑定到 ChatModel 的 callback：在每次 LLM 调用结束时记录 token 消耗。
 * 优先取模型返回的 usage；缺失时仅对「送入模型的 prompt + 模型补全」做字符估算。
 */
export function createSessionTokenUsageHandler(sessionId: string): BaseCallbackHandler {
  /** runId → 本次调用送入模型的交互文本（仅模型交互，不含 UI 展示态） */
  const promptTextByRunId = new Map<string, string>()

  return BaseCallbackHandler.fromMethods({
    handleLLMStart(_llm, prompts, runId) {
      promptTextByRunId.set(runId, prompts.join(''))
    },
    handleChatModelStart(_llm, messages, runId) {
      const text = messages
        .flat()
        .map((message) => queryTextFromBaseMessage(message))
        .join('')
      promptTextByRunId.set(runId, text)
    },
    handleLLMEnd(output: LLMResult, runId: string) {
      // 优先：模型返回的 usage（真实计费）
      const fromUsage = queryTokensFromLlmResult(output)
      if (fromUsage > 0) {
        promptTextByRunId.delete(runId)
        postSessionTokenDelta(sessionId, fromUsage)
        return
      }

      // 兜底：仅统计本轮与模型交互的 prompt + completion 文本
      const promptText = promptTextByRunId.get(runId) ?? ''
      promptTextByRunId.delete(runId)
      const completionText = queryTextFromLlmResult(output)
      const estimated = queryEstimateTokensFromText(promptText + completionText)
      postSessionTokenDelta(sessionId, estimated)
    },
    handleLLMError(_error, runId: string) {
      promptTextByRunId.delete(runId)
    }
  })
}

/**
 * 为 ChatModel 注入会话级 token 统计 callback。
 * 聊天图与工作流单步 ReAct 共用。
 * 为什么：LangChain withConfig 返回 Runnable 超类型，需断言回原模型类型供 createAgent 使用。
 */
export function withSessionTokenUsage<T extends { withConfig: (config: object) => unknown }>(
  model: T,
  sessionId: string
): T {
  return model.withConfig({
    callbacks: [
      thinkingRoundtripCallback,
      createSessionTokenUsageHandler(sessionId),
      createSessionStreamHandler(sessionId)
    ]
  }) as T
}
