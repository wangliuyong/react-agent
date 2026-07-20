import { createReactAgent } from '@langchain/langgraph/prebuilt'
import type { BaseCheckpointSaver } from '@langchain/langgraph'
import type { StructuredToolInterface } from '@langchain/core/tools'
import type { LanguageModelLike } from '@langchain/core/language_models/base'

/** 静态模型，或每次 LLM 调用前重新解析的工厂（支持中途换模） */
export type ReactSubgraphLlm =
  | LanguageModelLike
  | (() => LanguageModelLike | Promise<LanguageModelLike>)

export interface CreateReactSubgraphParams {
  llm: ReactSubgraphLlm
  tools: StructuredToolInterface[]
  systemPrompt: string
  checkpointer?: BaseCheckpointSaver
  /** 与 settings.maxTurns 对齐；LangGraph recursion_limit ≈ 轮次 * 2 */
  recursionLimit?: number
  name?: string
}

function queryHasBindTools(
  model: LanguageModelLike
): model is LanguageModelLike & {
  bindTools: (tools: StructuredToolInterface[]) => LanguageModelLike
} {
  return (
    typeof model === 'object' &&
    model !== null &&
    'bindTools' in model &&
    typeof (model as { bindTools?: unknown }).bindTools === 'function'
  )
}

/**
 * 可复用 ReAct 子图：模型 ↔ 工具循环。
 * 供聊天角色节点与工作流 agent 步共用。
 *
 * 当 llm 为工厂函数时：每次 agent 节点调用都会重新解析模型并 bindTools，
 * 从而支持 switch_model 在同一次 ReAct 循环内切换连接。
 * （createReactAgent 对动态 llm 不会自动 bindTools，需在此包装。）
 */
export function createReactSubgraph(params: CreateReactSubgraphParams) {
  const { llm, tools, systemPrompt, checkpointer, name } = params

  const resolvedLlm =
    typeof llm === 'function'
      ? async () => {
          const model = await Promise.resolve(llm())
          if (tools.length > 0 && queryHasBindTools(model)) {
            return model.bindTools(tools)
          }
          return model
        }
      : llm

  return createReactAgent({
    // 动态工厂：每次 agent 节点调用重新解析模型（见 createReactAgent llm: function）
    llm: resolvedLlm as never,
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