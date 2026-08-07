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
  querySanitizeModelCapability,
  type SupervisorNextTarget
} from '../model-router'
import { querySession } from '../../store/sessions'
import type { SkillInjectContext } from '../../store/skills'

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

/** 组装当前角色的技能注入上下文（会话选中 ∪ 角色关联） */
function querySkillCtxForRole(
  role: AgentRoleName,
  settings: AppSettings,
  sessionId: string
): SkillInjectContext {
  const session = querySession(sessionId)
  return {
    sessionSkillIds: session?.selectedSkillIds ?? [],
    roleSkillIds: settings.roleSkillIds?.[role as ModelRoleKey] ?? []
  }
}

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
    const skillCtx = querySkillCtxForRole(role, settings, toolCtx.sessionId)
    toolCtx.skillInjectCtx = skillCtx

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
        settings,
        skillCtx
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

    // Supervisor capability 优先；缺失则规则推断；creative 仅保留明确文生图/图生成视频
    const capability: ModelCapability =
      querySanitizeModelCapability(
        route.capability ?? queryInferModelCapability(userText, state.attachmentPaths),
        userText
      ) ?? 'chat'

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
  // 以 AgentGraphAnnotation 定义状态 schema，创建可链式注册节点的 StateGraph 构建器
  let builder: any = new StateGraph(AgentGraphAnnotation)
    // 注册调度节点：解析用户意图并决定下一步进入哪个角色
    .addNode('supervisor', supervisorNode)
    // 通用对话角色：直接回答，不进入后续流水线
    .addNode('general', async (state) => runRoleAgent('general', state))
    // 调研角色：收集资料，通常衔接到 writer
    .addNode('researcher', async (state) => runRoleAgent('researcher', state))
    // 写作角色：基于调研结果产出文案
    .addNode('writer', async (state) => runRoleAgent('writer', state))
    // 发布角色：在 publish 流水线中执行平台发布
    .addNode('publisher', async (state) => runRoleAgent('publisher', state))
    // 脚本角色：撰写视频脚本，进入视频流水线
    .addNode('scriptwriter', async (state) => runRoleAgent('scriptwriter', state))
    // 拍摄/成片角色：按脚本生成或处理视频素材
    .addNode('videographer', async (state) => runRoleAgent('videographer', state))
    // 剪辑角色：视频流水线末端，完成剪辑后结束
    .addNode('editor', async (state) => runRoleAgent('editor', state))

  // 遍历用户自定义 Agent 角色，动态挂到同一张图上
  for (const cr of customRoles) {
    // 将自定义角色 id 视为 PipelineRole，供 runRoleAgent 与边路由使用
    const roleId = cr.id as PipelineRole
    // 以角色 id 为节点名注册；执行时复用统一的 runRoleAgent 入口
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
