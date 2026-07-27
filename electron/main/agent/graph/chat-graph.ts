import { END, MemorySaver, START, StateGraph } from '@langchain/langgraph'
import { SystemMessage, AIMessage } from '@langchain/core/messages'
import type { BaseMessage } from '@langchain/core/messages'
import type {
  AppSettings,
  AgentRoleName,
  ModelCapability,
  ModelRoleKey
} from '../../../../shared/types'
import { createCapabilityRoutedModel, createChatModel } from '../llm-langchain'
import { withSessionTokenUsage } from '../token-usage'
import { adaptAgentTools } from '../tools/langchain-adapter'
import type { ToolContext } from '../tools/types'
import { AgentGraphAnnotation, type AgentGraphState } from './state'
import { buildRoleSystemPrompt } from './prompts'
import { queryToolsForRole, queryToolsByWhitelist } from './role-tools'
import { createReactSubgraph, queryRecursionLimit } from './react-subgraph'
import { queryLatestHumanMessage, trimMessagesToCharBudget } from '../token-budget'
import { queryCustomAgentRoleIds } from '../../../../shared/agent-role-registry'
import {
  queryInferModelCapability,
  queryResolveSupervisorRoute,
  queryResolveModelConnection,
  type SupervisorNextTarget
} from '../model-router'

/** 进程内唯一 checkpointer；thread_id = sessionId */
export const chatCheckpointer = new MemorySaver()

/** 可变能力盒：与 graph state / ToolContext 共享，供 ReAct 动态选型 */
export interface CapabilityBox {
  current: ModelCapability | ''
}

export interface BuildChatGraphParams {
  settings: AppSettings
  toolCtx: ToolContext
  /** 与 toolCtx.postActiveCapability 写入同一引用 */
  capabilityBox: CapabilityBox
  /** 能力变更时通知 UI（supervisor 初次选型 / 角色入口） */
  onModelResolved?: (payload: {
    capability: ModelCapability
    model: string
    connectionLabel: string
  }) => void
}

type PipelineRole = Exclude<AgentRoleName, 'supervisor'>

/**
 * 构建聊天多智能体协作图：
 * START → supervisor → general | content/publish管线 | video管线 → END
 *
 * content: researcher → writer → END（只创作不发布）
 * publish: researcher → writer → publisher
 * video:   scriptwriter → videographer → editor
 */
export function buildChatGraph(params: BuildChatGraphParams) {
  const { settings, toolCtx, capabilityBox, onModelResolved } = params
  const recursionLimit = queryRecursionLimit(settings.maxTurns)

  function postResolveForRole(role: ModelRoleKey, capability: ModelCapability | '') {
    const conn = queryResolveModelConnection(settings, {
      role,
      capability: capability || undefined
    })
    if (capability) {
      onModelResolved?.({
        capability,
        model: conn.model,
        connectionLabel: conn.label
      })
    }
  }

  function queryRoleLlmFactory(role: ModelRoleKey) {
    const factory = createCapabilityRoutedModel(settings, role, () => capabilityBox.current)
    return () => withSessionTokenUsage(factory(), toolCtx.sessionId)
  }

  async function runRoleAgent(
    role: PipelineRole,
    state: AgentGraphState
  ): Promise<Partial<AgentGraphState>> {
    // 管线后续角色继承 supervisor 写入的 capability；若仍为空则按最新用户话规则补齐
    if (!capabilityBox.current) {
      const inferred = queryInferModelCapability(
        lastUserText(state.messages),
        state.attachmentPaths
      )
      capabilityBox.current = inferred
    }
    postResolveForRole(role, capabilityBox.current)

    // 报错上下文：工具失败 / LLM 失败时带上角色与 Agent 名
    toolCtx.activeRole = role
    toolCtx.agentName = `role_${role}`

    const tools = adaptAgentTools(
      queryToolsForRole(
        role,
        settings.roleToolWhitelistOverrides,
        settings.customAgentRoles
      ),
      { ctx: toolCtx }
    )
    const roleInputMessages = trimMessagesToCharBudget(state.messages)
    const agent = createReactSubgraph({
      llm: queryRoleLlmFactory(role),
      tools,
      systemPrompt: buildRoleSystemPrompt(
        role,
        settings.rolePromptOverrides,
        settings
      ),
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
      activeAgent: role,
      activeCapability: capabilityBox.current
    }
  }

  async function supervisorNode(state: AgentGraphState): Promise<Partial<AgentGraphState>> {
    toolCtx.activeRole = 'supervisor'
    toolCtx.agentName = 'supervisor'
    const llm = withSessionTokenUsage(createChatModel(settings, 'supervisor'), toolCtx.sessionId)
    const latestUserMessage = queryLatestHumanMessage(state.messages)
    const reply = await llm.invoke(
      latestUserMessage
        ? [
            new SystemMessage(buildRoleSystemPrompt('supervisor', undefined, settings)),
            latestUserMessage
          ]
        : [new SystemMessage(buildRoleSystemPrompt('supervisor', undefined, settings))]
    )
    const text =
      typeof reply.content === 'string'
        ? reply.content
        : Array.isArray(reply.content)
          ? reply.content.map((c) => ('text' in c ? c.text : '')).join('')
          : String(reply.content ?? '')

    const userText = lastUserText(state.messages)
    const customIds = new Set(queryCustomAgentRoleIds(settings))
    const route = queryResolveSupervisorRoute(text, userText, customIds)
    const nextAgent = route.nextAgent
    const nextTarget: SupervisorNextTarget = route.pipelineKind

    // Supervisor capability 优先；缺失则规则推断
    const capability: ModelCapability =
      route.capability ?? queryInferModelCapability(userText, state.attachmentPaths)

    capabilityBox.current = capability
    postResolveForRole(nextAgent as ModelRoleKey, capability)

    return {
      nextAgent,
      pipelineKind: nextTarget,
      activeAgent: 'supervisor',
      activeCapability: capability,
      messages: [new AIMessage({ content: `[路由] → ${nextAgent} · ${capability} · ${nextTarget}` })]
    }
  }

  const customRoles = settings.customAgentRoles ?? []
  // LangGraph 对动态节点名的泛型较严；自定义角色在运行时注册，此处用宽松构建再 compile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let builder: any = new StateGraph(AgentGraphAnnotation)
    .addNode('supervisor', supervisorNode)
    .addNode('general', async (state) => runRoleAgent('general', state))
    .addNode('researcher', async (state) => runRoleAgent('researcher', state))
    .addNode('writer', async (state) => runRoleAgent('writer', state))
    .addNode('publisher', async (state) => runRoleAgent('publisher', state))
    .addNode('scriptwriter', async (state) => runRoleAgent('scriptwriter', state))
    .addNode('videographer', async (state) => runRoleAgent('videographer', state))
    .addNode('editor', async (state) => runRoleAgent('editor', state))

  for (const cr of customRoles) {
    const roleId = cr.id as PipelineRole
    builder = builder.addNode(cr.id, async (state: AgentGraphState) =>
      runRoleAgent(roleId, state)
    )
  }

  const supervisorBranches: Record<string, string> = {
    general: 'general',
    researcher: 'researcher',
    scriptwriter: 'scriptwriter'
  }
  for (const cr of customRoles) {
    supervisorBranches[cr.id] = cr.id
  }

  builder = builder
    .addEdge(START, 'supervisor')
    .addConditionalEdges(
      'supervisor',
      (state: AgentGraphState) => state.nextAgent || 'general',
      supervisorBranches
    )
    .addEdge('general', END)
    .addEdge('researcher', 'writer')
    .addConditionalEdges(
      'writer',
      (state: AgentGraphState) => (state.pipelineKind === 'publish' ? 'publisher' : END),
      {
        publisher: 'publisher',
        [END]: END
      }
    )
    .addEdge('publisher', END)
    .addEdge('scriptwriter', 'videographer')
    .addEdge('videographer', 'editor')
    .addEdge('editor', END)

  for (const cr of customRoles) {
    builder = builder.addEdge(cr.id, END)
  }

  return builder.compile({ checkpointer: chatCheckpointer }) as ReturnType<
    typeof StateGraph.prototype.compile
  >
}

function lastUserText(messages: BaseMessage[]): string {
  const message = queryLatestHumanMessage(messages)
  return typeof message?.content === 'string' ? message.content : ''
}

/**
 * 工作流单步 / 受限 ReAct：独立小图（不走 supervisor）。
 * 入口用规则推断 capability；支持 switch_model 中途换模。
 */
export function buildStepReactGraph(params: {
  settings: AppSettings
  toolCtx: ToolContext
  systemPrompt: string
  toolWhitelist?: string[]
  /** 步骤提示词，用于规则推断 */
  stepPrompt?: string
  attachmentPaths?: string[]
  capabilityBox?: CapabilityBox
  /** 子 Agent / 工作流步骤使用的模型角色映射 */
  modelRole?: ModelRoleKey
  onModelResolved?: BuildChatGraphParams['onModelResolved']
}) {
  const {
    settings,
    toolCtx,
    systemPrompt,
    toolWhitelist,
    stepPrompt = '',
    attachmentPaths = [],
    modelRole = 'general',
    onModelResolved
  } = params

  const capabilityBox = params.capabilityBox ?? { current: '' as ModelCapability | '' }
  if (!capabilityBox.current) {
    capabilityBox.current = queryInferModelCapability(stepPrompt, attachmentPaths)
  }

  // 将 box 接到 ToolContext（若调用方尚未接线）
  if (!toolCtx.postActiveCapability) {
    toolCtx.postActiveCapability = (capability) => {
      capabilityBox.current = capability
    }
  }
  if (!toolCtx.queryActiveCapability) {
    toolCtx.queryActiveCapability = () => capabilityBox.current || undefined
  }

  const conn = queryResolveModelConnection(settings, {
    role: modelRole,
    capability: capabilityBox.current || undefined
  })
  if (capabilityBox.current) {
    onModelResolved?.({
      capability: capabilityBox.current,
      model: conn.model,
      connectionLabel: conn.label
    })
  }

  // 步骤 / 工作流 Agent：写入报错上下文
  toolCtx.activeRole = modelRole
  toolCtx.agentName = 'workflow_step_agent'

  const factory = createCapabilityRoutedModel(
    settings,
    modelRole,
    () => capabilityBox.current
  )
  const tools = adaptAgentTools(queryToolsByWhitelist(toolWhitelist), { ctx: toolCtx })
  return createReactSubgraph({
    llm: () => withSessionTokenUsage(factory(), toolCtx.sessionId),
    tools,
    systemPrompt,
    checkpointer: chatCheckpointer,
    name: 'workflow_step_agent'
  })
}
