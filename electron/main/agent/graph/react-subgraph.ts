import { createAgent, createMiddleware } from 'langchain'
import type { BaseCheckpointSaver } from '@langchain/langgraph'
import type { StructuredToolInterface } from '@langchain/core/tools'
import type { LanguageModelLike } from '@langchain/core/language_models/base'
import { queryResolveToolName } from '../tools/query-resolve-tool-name'

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

/**
 * 可复用 ReAct 子图：模型 ↔ 工具循环。
 * 供聊天角色节点与工作流 agent 步共用。
 *
 * 使用 langchain `createAgent`（替代已弃用的 langgraph `createReactAgent`）。
 * 返回底层 CompiledStateGraph，保持 invoke / stream / getState 与既有调用方兼容。
 *
 * - 动态 llm 工厂：经 wrapModelCall 每次模型调用前重新解析（支持 switch_model）
 * - 工具名模糊匹配：经 wrapToolCall，≥90% 相似即命中，避免轻微拼写偏差报 not found
 * - 不预 bindTools：createAgent 自行绑定；预绑定模型与 structured output 不兼容
 */
export function createReactSubgraph(params: CreateReactSubgraphParams) {
  const { llm, tools, systemPrompt, checkpointer, name } = params

  const middleware = []

  // 动态工厂：每次模型调用重新解析连接（capability / switch_model）
  if (typeof llm === 'function') {
    middleware.push(
      createMiddleware({
        name: 'DynamicCapabilityModel',
        wrapModelCall: async (request, handler) => {
          const model = await Promise.resolve(llm())
          return handler({ ...request, model })
        }
      })
    )
  }

  // 工具名模糊匹配（原 FuzzyToolNode 逻辑迁到 wrapToolCall）
  if (tools.length > 0) {
    const toolNames = tools.map((t) => t.name)
    middleware.push(
      createMiddleware({
        name: 'FuzzyToolName',
        wrapToolCall: async (request, handler) => {
          const resolved = queryResolveToolName(String(request.toolCall.name ?? ''), toolNames)
          if (!resolved || resolved.name === request.toolCall.name) {
            return handler(request)
          }
          const tool = tools.find((t) => t.name === resolved.name)
          return handler({
            ...request,
            toolCall: { ...request.toolCall, name: resolved.name },
            ...(tool ? { tool } : {})
          })
        }
      })
    )
  }

  /**
   * createAgent 需要一个初始 model 实例；工厂场景下先同步解析一次作占位，
   * 实际每次调用由 DynamicCapabilityModel.wrapModelCall 覆盖。
   */
  const model =
    typeof llm === 'function'
      ? (() => {
          const resolved = llm()
          if (resolved && typeof (resolved as PromiseLike<LanguageModelLike>).then === 'function') {
            throw new Error(
              'createReactSubgraph: llm 工厂首次解析须同步返回模型（异步请在 wrapModelCall 内处理）'
            )
          }
          return resolved as LanguageModelLike
        })()
      : llm

  const agent = createAgent({
    model,
    tools,
    systemPrompt,
    checkpointer,
    name: name ?? 'react_agent',
    middleware
  })

  // 暴露 CompiledStateGraph，保留 getState 等公开类型（ReactAgent.getState 类型为 never）
  return agent.graph
}

/** maxTurns → LangGraph recursion_limit（agent+tools 各计一步） */
export function queryRecursionLimit(maxTurns: number): number {
  return Math.max(8, maxTurns * 2)
}
