import { END, MemorySaver, START, StateGraph } from '@langchain/langgraph'
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages'
import type { BaseMessage } from '@langchain/core/messages'
import type { AppSettings, AgentRoleName } from '../../../../shared/types'
import { createChatModel } from '../llm-langchain'
import { adaptAgentTools } from '../tools/langchain-adapter'
import type { ToolContext } from '../tools/types'
import { AgentGraphAnnotation, type AgentGraphState } from './state'
import { buildRoleSystemPrompt } from './prompts'
import { queryToolsForRole, queryToolsByWhitelist } from './role-tools'
import { createReactSubgraph, queryRecursionLimit } from './react-subgraph'

/** 进程内唯一 checkpointer；thread_id = sessionId */
export const chatCheckpointer = new MemorySaver()

export interface BuildChatGraphParams {
  settings: AppSettings
  toolCtx: ToolContext
}

/**
 * 构建聊天多智能体协作图：
 * START → supervisor → general | researcher → writer → publisher → END
 */
export function buildChatGraph(params: BuildChatGraphParams) {
  const { settings, toolCtx } = params
  const llm = createChatModel(settings)
  const recursionLimit = queryRecursionLimit(settings.maxTurns)

  async function runRoleAgent(
    role: Exclude<AgentRoleName, 'supervisor'>,
    state: AgentGraphState
  ): Promise<Partial<AgentGraphState>> {
    const tools = adaptAgentTools(queryToolsForRole(role), { ctx: toolCtx })
    const agent = createReactSubgraph({
      llm,
      tools,
      systemPrompt: buildRoleSystemPrompt(role),
      name: `role_${role}`
    })
    const result = await agent.invoke(
      { messages: state.messages },
      { recursionLimit }
    )
    // messagesStateReducer 会追加；只回传本角色新增的消息，避免整段历史重复
    const all = result.messages as BaseMessage[]
    const delta = all.slice(state.messages.length)
    return {
      messages: delta,
      activeAgent: role
    }
  }

  async function supervisorNode(state: AgentGraphState): Promise<Partial<AgentGraphState>> {
    const reply = await llm.invoke([
      new SystemMessage(buildRoleSystemPrompt('supervisor')),
      ...state.messages.slice(-12)
    ])
    const text =
      typeof reply.content === 'string'
        ? reply.content
        : Array.isArray(reply.content)
          ? reply.content.map((c) => ('text' in c ? c.text : '')).join('')
          : String(reply.content ?? '')

    let nextAgent = 'general'
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      const parsed = JSON.parse(jsonMatch?.[0] ?? text) as { next?: string }
      if (parsed.next === 'publish') nextAgent = 'researcher'
      else nextAgent = 'general'
    } catch {
      // 路由解析失败时用关键词兜底
      if (/发布|小红书|抖音|热点|撰稿|配图|图文/.test(text + lastUserText(state.messages))) {
        nextAgent = 'researcher'
      }
    }

    return {
      nextAgent,
      activeAgent: 'supervisor',
      messages: [new AIMessage({ content: `[路由] → ${nextAgent}` })]
    }
  }

  const graph = new StateGraph(AgentGraphAnnotation)
    .addNode('supervisor', supervisorNode)
    .addNode('general', async (state) => runRoleAgent('general', state))
    .addNode('researcher', async (state) => runRoleAgent('researcher', state))
    .addNode('writer', async (state) => runRoleAgent('writer', state))
    .addNode('publisher', async (state) => runRoleAgent('publisher', state))
    .addEdge(START, 'supervisor')
    .addConditionalEdges('supervisor', (state) => state.nextAgent || 'general', {
      general: 'general',
      researcher: 'researcher'
    })
    .addEdge('general', END)
    .addEdge('researcher', 'writer')
    .addEdge('writer', 'publisher')
    .addEdge('publisher', END)

  return graph.compile({ checkpointer: chatCheckpointer })
}

function lastUserText(messages: BaseMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]
    if (HumanMessage.isInstance(m) || m.getType?.() === 'human') {
      return typeof m.content === 'string' ? m.content : ''
    }
  }
  return ''
}

/**
 * 工作流单步 / 受限 ReAct：独立小图（不走 supervisor）。
 */
export function buildStepReactGraph(params: {
  settings: AppSettings
  toolCtx: ToolContext
  systemPrompt: string
  toolWhitelist?: string[]
}) {
  const { settings, toolCtx, systemPrompt, toolWhitelist } = params
  const llm = createChatModel(settings)
  const tools = adaptAgentTools(queryToolsByWhitelist(toolWhitelist), { ctx: toolCtx })
  return createReactSubgraph({
    llm,
    tools,
    systemPrompt,
    checkpointer: chatCheckpointer,
    name: 'workflow_step_agent'
  })
}
