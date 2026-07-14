import { createReactAgent } from '@langchain/langgraph/prebuilt'
import type { BaseCheckpointSaver } from '@langchain/langgraph'
import type { StructuredToolInterface } from '@langchain/core/tools'
import type { LanguageModelLike } from '@langchain/core/language_models/base'

export interface CreateReactSubgraphParams {
  llm: LanguageModelLike
  tools: StructuredToolInterface[]
  systemPrompt: string
  checkpointer?: BaseCheckpointSaver
  /** 与 settings.maxTurns 对齐；LangGraph recursion_limit ≈ 轮次 * 2 */
  recursionLimit?: number
  name?: string
}

/**
 * 可复用 ReAct 子图：模型 ↔ 工具循环。
 * 供聊天角色节点与工作流 agent 步共用。
 */
export function createReactSubgraph(params: CreateReactSubgraphParams) {
  const { llm, tools, systemPrompt, checkpointer, name } = params
  return createReactAgent({
    llm,
    tools,
    prompt: systemPrompt,
    checkpointer,
    name: name ?? 'react_agent'
  })
}

/** maxTurns → LangGraph recursion_limit（agent+tools 各计一步） */
export function queryRecursionLimit(maxTurns: number): number {
  return Math.max(8, maxTurns * 2)
}
