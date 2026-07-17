import { END, MemorySaver, START, StateGraph } from '@langchain/langgraph'
import { SystemMessage, AIMessage } from '@langchain/core/messages'
import type { BaseMessage } from '@langchain/core/messages'
import type { AppSettings, AgentRoleName, ModelRoleKey } from '../../../../shared/types'
import { createChatModel } from '../llm-langchain'
import { withSessionTokenUsage } from '../token-usage'
import { adaptAgentTools } from '../tools/langchain-adapter'
import type { ToolContext } from '../tools/types'
import { AgentGraphAnnotation, type AgentGraphState } from './state'
import { buildRoleSystemPrompt } from './prompts'
import { queryToolsForRole, queryToolsByWhitelist } from './role-tools'
import { createReactSubgraph, queryRecursionLimit } from './react-subgraph'
import { queryLatestHumanMessage, trimMessagesToCharBudget } from '../token-budget'

/** 进程内唯一 checkpointer；thread_id = sessionId */
export const chatCheckpointer = new MemorySaver()

export interface BuildChatGraphParams {
  settings: AppSettings
  toolCtx: ToolContext
}

type PipelineRole = Exclude<AgentRoleName, 'supervisor'>

/**
 * 构建聊天多智能体协作图：
 * START → supervisor → general | publish管线 | video管线 → END
 *
 * publish: researcher → writer → publisher
 * video:   scriptwriter → videographer → editor
 */
export function buildChatGraph(params: BuildChatGraphParams) {
  const { settings, toolCtx } = params
  const recursionLimit = queryRecursionLimit(settings.maxTurns)

  function queryRoleLlm(role: ModelRoleKey) {
    return withSessionTokenUsage(createChatModel(settings, role), toolCtx.sessionId)
  }

  async function runRoleAgent(
    role: PipelineRole,
    state: AgentGraphState
  ): Promise<Partial<AgentGraphState>> {
    const llm = queryRoleLlm(role)
    const tools = adaptAgentTools(queryToolsForRole(role), { ctx: toolCtx })
    const roleInputMessages = trimMessagesToCharBudget(state.messages)
    const agent = createReactSubgraph({
      llm,
      tools,
      systemPrompt: buildRoleSystemPrompt(role),
      name: `role_${role}`
    })
    const result = await agent.invoke(
      { messages: roleInputMessages },
      { recursionLimit }
    )
    const all = result.messages as BaseMessage[]
    const delta = all.slice(roleInputMessages.length)
    return {
      messages: delta,
      activeAgent: role
    }
  }

  async function supervisorNode(state: AgentGraphState): Promise<Partial<AgentGraphState>> {
    const llm = queryRoleLlm('supervisor')
    const latestUserMessage = queryLatestHumanMessage(state.messages)
    const reply = await llm.invoke(
      latestUserMessage
        ? [new SystemMessage(buildRoleSystemPrompt('supervisor')), latestUserMessage]
        : [new SystemMessage(buildRoleSystemPrompt('supervisor'))]
    )
    const text =
      typeof reply.content === 'string'
        ? reply.content
        : Array.isArray(reply.content)
          ? reply.content.map((c) => ('text' in c ? c.text : '')).join('')
          : String(reply.content ?? '')

    const userText = lastUserText(state.messages)
    let nextAgent: 'general' | 'researcher' | 'scriptwriter' = 'general'
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      const parsed = JSON.parse(jsonMatch?.[0] ?? text) as { next?: string }
      if (parsed.next === 'publish') nextAgent = 'researcher'
      else if (parsed.next === 'video') nextAgent = 'scriptwriter'
      else nextAgent = 'general'
    } catch {
      const blob = text + userText
      if (/剧本|分镜|成片|生成视频|一句话.*视频|短剧|口播视频/.test(blob)) {
        nextAgent = 'scriptwriter'
      } else if (/发布|小红书|抖音|热点|撰稿|配图|图文/.test(blob)) {
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
    .addNode('scriptwriter', async (state) => runRoleAgent('scriptwriter', state))
    .addNode('videographer', async (state) => runRoleAgent('videographer', state))
    .addNode('editor', async (state) => runRoleAgent('editor', state))
    .addEdge(START, 'supervisor')
    .addConditionalEdges('supervisor', (state) => state.nextAgent || 'general', {
      general: 'general',
      researcher: 'researcher',
      scriptwriter: 'scriptwriter'
    })
    .addEdge('general', END)
    .addEdge('researcher', 'writer')
    .addEdge('writer', 'publisher')
    .addEdge('publisher', END)
    .addEdge('scriptwriter', 'videographer')
    .addEdge('videographer', 'editor')
    .addEdge('editor', END)

  return graph.compile({ checkpointer: chatCheckpointer })
}

function lastUserText(messages: BaseMessage[]): string {
  const message = queryLatestHumanMessage(messages)
  return typeof message?.content === 'string' ? message.content : ''
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
  const llm = withSessionTokenUsage(createChatModel(settings, 'general'), toolCtx.sessionId)
  const tools = adaptAgentTools(queryToolsByWhitelist(toolWhitelist), { ctx: toolCtx })
  return createReactSubgraph({
    llm,
    tools,
    systemPrompt,
    checkpointer: chatCheckpointer,
    name: 'workflow_step_agent'
  })
}
