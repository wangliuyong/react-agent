/**
 * LLM 流式回调：将 token 级增量推送到渲染进程。
 * 与 token-usage 分离，避免与 graph-bridge 循环依赖。
 */
import { BaseCallbackHandler } from '@langchain/core/callbacks/base'
import type { HandleLLMNewTokenCallbackFields } from '@langchain/core/callbacks/base'
import type { AIMessageChunk } from '@langchain/core/messages'
import type { LLMResult } from '@langchain/core/outputs'
import type { AgentEvent } from '../../../shared/types'
import { getMainWindow } from '../window'
import {
  postThinkingReasoningComplete,
  postThinkingReasoningStart
} from './thinking-gate'

/** 推送 Agent 事件到渲染进程 */
function emitAgentEvent(event: AgentEvent): void {
  const win = getMainWindow()
  if (win && !win.isDestroyed()) {
    win.webContents.send('event:agent', event)
  }
}

/** 从 LangChain 流式 chunk 中提取 reasoning / thinking 增量 */
function queryReasoningDelta(fields?: HandleLLMNewTokenCallbackFields): string {
  const message = fields?.chunk?.message as AIMessageChunk | undefined
  const reasoning = message?.additional_kwargs?.reasoning_content
  return typeof reasoning === 'string' ? reasoning : ''
}

/** 从 LLM 结束结果中提取完整 reasoning_content（流式未推送时的兜底） */
function queryReasoningFromLlmResult(output: LLMResult): string {
  for (const generationGroup of output.generations) {
    for (const generation of generationGroup) {
      const message = generation.message as AIMessageChunk | undefined
      const reasoning = message?.additional_kwargs?.reasoning_content
      if (typeof reasoning === 'string' && reasoning.trim()) {
        return reasoning
      }
    }
  }
  return ''
}

/**
 * 绑定到 ChatModel：LLM 流式输出时推送 thinking_delta。
 * 推理结束后发 thinking_complete，后续工具/回答/工作流节点须等待该信号。
 */
export function createSessionStreamHandler(sessionId: string): BaseCallbackHandler {
  /** 已推送的 reasoning 长度，用于 handleLLMEnd 兜底时避免重复 */
  let streamedReasoningLen = 0
  let reasoningStarted = false

  const postReasoningStart = (): void => {
    if (reasoningStarted) return
    reasoningStarted = true
    postThinkingReasoningStart(sessionId)
  }

  const postReasoningEnd = (): void => {
    if (!reasoningStarted) return
    reasoningStarted = false
    streamedReasoningLen = 0
    postThinkingReasoningComplete(sessionId)
  }

  return BaseCallbackHandler.fromMethods({
    handleLLMNewToken(
      token: string,
      _idx,
      _runId,
      _parentRunId,
      _tags,
      fields?: HandleLLMNewTokenCallbackFields
    ) {
      const reasoningDelta = queryReasoningDelta(fields)
      if (reasoningDelta) {
        postReasoningStart()
        streamedReasoningLen += reasoningDelta.length
        emitAgentEvent({ type: 'thinking_delta', sessionId, delta: reasoningDelta })
      }
      void token
    },
    handleLLMEnd(output: LLMResult) {
      const fullReasoning = queryReasoningFromLlmResult(output)
      if (fullReasoning) {
        if (!reasoningStarted) {
          postReasoningStart()
          emitAgentEvent({ type: 'thinking_delta', sessionId, delta: fullReasoning })
          streamedReasoningLen = fullReasoning.length
        } else if (fullReasoning.length > streamedReasoningLen) {
          const tail = fullReasoning.slice(streamedReasoningLen)
          if (tail.trim()) {
            emitAgentEvent({ type: 'thinking_delta', sessionId, delta: tail })
          }
          streamedReasoningLen = fullReasoning.length
        }
      }
      postReasoningEnd()
    }
  })
}

/** Agent 执行步骤摘要：工具调用、角色切换等，作为思考过程补充展示 */
export function emitThinkingStep(sessionId: string, line: string): void {
  const trimmed = line.trim()
  if (!trimmed) return
  postThinkingReasoningStart(sessionId)
  emitAgentEvent({ type: 'thinking_delta', sessionId, delta: `${trimmed}\n` })
}
