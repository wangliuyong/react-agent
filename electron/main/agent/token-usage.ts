import { BaseCallbackHandler } from '@langchain/core/callbacks/base'
import type { AIMessage } from '@langchain/core/messages'
import type { LLMResult } from '@langchain/core/outputs'
import type { AgentEvent } from '../../../shared/types'
import { querySession, postSession } from '../store/sessions'
import { getMainWindow } from '../window'

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
 */
export function createSessionTokenUsageHandler(sessionId: string): BaseCallbackHandler {
  return BaseCallbackHandler.fromMethods({
    handleLLMEnd(output: LLMResult) {
      const delta = queryTokensFromLlmResult(output)
      postSessionTokenDelta(sessionId, delta)
    }
  })
}

/**
 * 为 ChatModel 注入会话级 token 统计 callback。
 * 聊天图与工作流单步 ReAct 共用。
 */
export function withSessionTokenUsage<T extends { withConfig: (config: object) => T }>(
  model: T,
  sessionId: string
): T {
  return model.withConfig({
    callbacks: [createSessionTokenUsageHandler(sessionId)]
  })
}
