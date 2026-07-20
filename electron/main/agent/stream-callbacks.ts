/**
 * LLM 流式回调：将 token 级增量推送到渲染进程。
 * 与 token-usage 分离，避免与 graph-bridge 循环依赖。
 */
import { BaseCallbackHandler } from '@langchain/core/callbacks/base'
import type { HandleLLMNewTokenCallbackFields } from '@langchain/core/callbacks/base'
import type { AIMessageChunk } from '@langchain/core/messages'
import type { AgentEvent } from '../../../shared/types'
import { getMainWindow } from '../window'

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

/**
 * 绑定到 ChatModel：LLM 流式输出时推送 text_delta / thinking_delta。
 * 为什么：graph 使用 invoke + streaming:true 时，需靠 callback 才能把 token 实时送到 UI。
 */
export function createSessionStreamHandler(sessionId: string): BaseCallbackHandler {
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
        emitAgentEvent({ type: 'thinking_delta', sessionId, delta: reasoningDelta })
      }
      // 注意：主回答的 text_delta 仍由 graph-bridge 的 syncNewMessagesToSession 推送。
      // 这里不再复用 token 来避免与现有 text_delta 机制重复拼接导致「重复输出」。
      void token
    }
  })
}

/** Agent 执行步骤摘要：工具调用、角色切换等，作为思考过程补充展示 */
export function emitThinkingStep(sessionId: string, line: string): void {
  const trimmed = line.trim()
  if (!trimmed) return
  emitAgentEvent({ type: 'thinking_delta', sessionId, delta: `${trimmed}\n` })
}
