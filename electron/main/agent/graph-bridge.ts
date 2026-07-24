/**
 * LangGraph ↔ 现有 AgentEvent / Session 桥接层。
 * 负责：abort、continue（Command resume）、流式事件映射、消息落盘。
 */
import {
  AIMessage,
  HumanMessage,
  ToolMessage,
  isAIMessage
} from '@langchain/core/messages'
import type { BaseMessage } from '@langchain/core/messages'
import {
  Command,
  GraphInterrupt,
  INTERRUPT,
  isGraphInterrupt,
  isInterrupted
} from '@langchain/langgraph'
import { pauseRunningTasks, queryHasRunningTasks } from '../../../shared/pause-running-tasks'
import type {
  AgentContinuePayload,
  AgentEvent,
  AgentRoleName,
  ChatMessage,
  ModelCapability,
  Session,
  TaskItem,
  UserChoiceOption
} from '../../../shared/types'
import { querySettings } from '../store/settings'
import { querySession, postSession } from '../store/sessions'
import { getMainWindow } from '../window'
import { handleScheduleAgentDone } from '../schedule/agent-hook'
import { queryWaitThinkingSettled, postResetThinkingGate, postThinkingReasoningComplete } from './thinking-gate'
import type { ToolContext } from './tools/types'
import {
  buildChatGraph,
  buildStepReactGraph,
  type CapabilityBox
} from './graph/chat-graph'
import { buildRoleSystemPrompt } from './graph/prompts'
import { queryRecursionLimit } from './graph/react-subgraph'
import { sanitizeMessagesForModel, trimMessagesToCharBudget } from './token-budget'
import { queryResolveModelConnection } from './model-router'
import {
  formatUserContinueMessage,
  normalizeContinuePayload,
  resolveUserContinue,
  type UserContinueResult
} from './choice-resolver'

export type { UserContinueResult } from './choice-resolver'

/** 等待用户确认时的请求体 */
export interface AwaitUserRequest {
  reason: string
  choices?: UserChoiceOption[]
}

interface PendingAwaitState {
  reason: string
  choices?: UserChoiceOption[]
  interruptId: string
}

const abortMap = new Map<string, AbortController>()
/** 挂起期间缓存方案列表，供 postGraphContinue 解析 choiceId */
const pendingAwaitBySession = new Map<string, PendingAwaitState>()
const continueWaiters = new Map<
  string,
  { resolve: (result: UserContinueResult) => void; reject: (e: Error) => void }
>()

function uuidv4(): string {
  return crypto.randomUUID()
}

function normalizeAwaitRequest(request: string | AwaitUserRequest): AwaitUserRequest {
  return typeof request === 'string' ? { reason: request } : request
}

/**
 * 用户已继续后清除 awaitMeta，避免刷新会话时从落盘消息误恢复方案选择 UI。
 */
function markAwaitUserResolved(sessionId: string, interruptId?: string): void {
  const session = querySession(sessionId)
  if (!session) return

  let fallbackIndex: number | null = null

  for (let i = session.messages.length - 1; i >= 0; i--) {
    const m = session.messages[i]
    if (m.role !== 'assistant' || !m.awaitMeta) continue

    if (interruptId && m.awaitMeta.interruptId === interruptId) {
      delete m.awaitMeta
      persistSession(session)
      return
    }

    if (!m.awaitMeta.interruptId && fallbackIndex === null) {
      fallbackIndex = i
    }
  }

  if (fallbackIndex == null) return
  delete session.messages[fallbackIndex]!.awaitMeta
  persistSession(session)
}

/** 写入带 awaitMeta 的 assistant 占位消息，供切换会话后恢复确认 UI */
function appendAwaitUserPlaceholder(
  sessionId: string,
  params: { reason: string; choices?: UserChoiceOption[]; interruptId: string }
): void {
  const session = querySession(sessionId)
  if (!session) return
  const content = `等待确认：${params.reason}`
  const placeholder = appendMessage(session, {
    role: 'assistant',
    content,
    awaitMeta: {
      reason: params.reason,
      choices: params.choices,
      interruptId: params.interruptId
    }
  })
  persistSession(session)
  emitAgentEvent({ type: 'message', sessionId, message: placeholder })
}

export function emitAgentEvent(event: AgentEvent): void {
  const win = getMainWindow()
  if (win && !win.isDestroyed()) {
    win.webContents.send('event:agent', event)
  }
  handleScheduleAgentDone(event)
}

/** 通知渲染进程：本次任务/流程已新建独立会话（每次执行一条新对话） */
export function emitSessionStarted(session: Session): void {
  emitAgentEvent({ type: 'session_started', sessionId: session.id, session })
}

function persistSession(session: Session): void {
  session.updatedAt = Date.now()
  postSession(session)
}

function appendMessage(session: Session, msg: Omit<ChatMessage, 'id' | 'createdAt'>): ChatMessage {
  const full: ChatMessage = {
    id: uuidv4(),
    createdAt: Date.now(),
    ...msg
  }
  session.messages.push(full)
  return full
}

/**
 * 中断时将落盘任务从 running 重置为 pending，并推送 task_update。
 * 避免刷新后 hydrate 根据 running 任务误判会话仍在执行。
 */
export function pauseRunningSessionTasks(sessionId: string): void {
  const session = querySession(sessionId)
  if (!session?.tasks?.length || !queryHasRunningTasks(session.tasks)) return
  session.tasks = pauseRunningTasks(session.tasks)
  persistSession(session)
  emitAgentEvent({ type: 'task_update', sessionId, tasks: session.tasks })
}

export function postGraphAbort(sessionId: string): void {
  abortMap.get(sessionId)?.abort()
  abortMap.delete(sessionId)
  pendingAwaitBySession.delete(sessionId)
  const waiter = continueWaiters.get(sessionId)
  if (waiter) {
    waiter.reject(new Error('用户已中止'))
    continueWaiters.delete(sessionId)
  }
  // 立即杀死并落盘暂停任务，不等 Agent 异步收尾
  pauseRunningSessionTasks(sessionId)
}

export function postGraphContinue(
  sessionId: string,
  payload?: AgentContinuePayload | string
): void {
  const waiter = continueWaiters.get(sessionId)
  if (!waiter) return

  const normalized = normalizeContinuePayload(payload)
  const pending = pendingAwaitBySession.get(sessionId)
  const result = resolveUserContinue(normalized, pending?.choices)

  markAwaitUserResolved(sessionId, pending?.interruptId)
  pendingAwaitBySession.delete(sessionId)
  // 统一在此落盘用户选择与补充说明，供后续 ReAct 轮次读取
  appendUserContinueMessage(sessionId, result)
  waiter.resolve(result)
  continueWaiters.delete(sessionId)
}

/**
 * 用户点「继续」或「发送并继续」时，将选择与补充说明写入会话消息。
 * @returns 落盘后的完整消息文本；无有效内容时 undefined
 */
export function appendUserContinueMessage(
  sessionId: string,
  result: UserContinueResult | string | undefined
): string | undefined {
  const normalized: UserContinueResult =
    typeof result === 'string' ? { userInput: result } : (result ?? {})
  const content = formatUserContinueMessage(normalized)
  if (!content) return undefined

  const session = querySession(sessionId)
  if (!session) return content
  const userMsg = appendMessage(session, { role: 'user', content })
  persistSession(session)
  emitAgentEvent({ type: 'message', sessionId, message: userMsg })
  return content
}

/** LangGraph Command resume 载荷：有用户说明时用字符串，否则 true（消息已在 postGraphContinue 落盘） */
export function queryGraphResumePayload(
  sessionId: string,
  result: UserContinueResult | string | undefined
): string | boolean {
  const normalized: UserContinueResult =
    typeof result === 'string' ? { userInput: result } : (result ?? {})
  const content = formatUserContinueMessage(normalized)
  return content ?? true
}

export function bindGraphSessionAbort(sessionId: string): AbortController {
  postGraphAbort(sessionId)
  const controller = new AbortController()
  abortMap.set(sessionId, controller)
  return controller
}

export function releaseGraphSessionAbort(sessionId: string): void {
  abortMap.delete(sessionId)
}

export function getGraphAbortSignal(sessionId: string): AbortSignal | undefined {
  return abortMap.get(sessionId)?.signal
}

export async function waitForGraphUserContinue(
  sessionId: string,
  request: string | AwaitUserRequest,
  options?: { skipPlaceholder?: boolean }
): Promise<UserContinueResult> {
  const normalized = normalizeAwaitRequest(request)
  const interruptId = uuidv4()

  pendingAwaitBySession.set(sessionId, {
    reason: normalized.reason,
    choices: normalized.choices,
    interruptId
  })

  if (!options?.skipPlaceholder) {
    appendAwaitUserPlaceholder(sessionId, { ...normalized, interruptId })
  }

  emitAgentEvent({
    type: 'await_user',
    sessionId,
    reason: normalized.reason,
    choices: normalized.choices,
    interruptId
  })

  return new Promise<UserContinueResult>((resolve, reject) => {
    continueWaiters.set(sessionId, { resolve, reject })
  })
}

/** 等待用户确认后构造 LangGraph resume Command（含可选用户说明与方案选择） */
async function waitForGraphUserResumeCommand(
  sessionId: string,
  reason: string
): Promise<Command> {
  const result = await waitForGraphUserContinue(sessionId, reason, { skipPlaceholder: true })
  return new Command({ resume: queryGraphResumePayload(sessionId, result) })
}

function buildToolContext(
  sessionId: string,
  attachmentPaths: string[],
  signal: AbortSignal,
  fullAccess: boolean,
  capabilityBox?: CapabilityBox
): ToolContext {
  const postActiveCapability = (capability: ModelCapability) => {
    if (capabilityBox) {
      capabilityBox.current = capability
    }
    const settings = querySettings()
    const connection = queryResolveModelConnection(settings, {
      role: 'general',
      capability
    })
    emitAgentEvent({
      type: 'model_switch',
      sessionId,
      capability,
      model: connection.model,
      connectionLabel: connection.label
    })
  }

  return {
    sessionId,
    fullAccess,
    attachmentPaths,
    signal,
    emitAwaitUser: async (reason, choices?) => {
      return waitForGraphUserContinue(sessionId, { reason, choices })
    },
    updateTasks: (updater) => {
      const current = querySession(sessionId)
      if (!current) return
      current.tasks = updater(current.tasks) as TaskItem[]
      persistSession(current)
      emitAgentEvent({ type: 'task_update', sessionId, tasks: current.tasks })
    },
    queryActiveCapability: capabilityBox
      ? () => capabilityBox.current || undefined
      : undefined,
    postActiveCapability: capabilityBox ? postActiveCapability : undefined,
    emitToolProgress: (toolName, progress) => {
      emitAgentEvent({ type: 'tool_progress', sessionId, toolName, progress })
    }
  }
}

/**
 * 将会话落盘消息还原为 LangChain 消息。
 * 会恢复 assistant.toolCalls，并清洗无法配对的孤立 tool 结果（兼容旧会话）。
 */
function sessionToLcMessages(session: Session): BaseMessage[] {
  const out: BaseMessage[] = []
  for (const m of session.messages) {
    if (m.role === 'user') {
      out.push(new HumanMessage(m.content))
    } else if (m.role === 'assistant') {
      // 有 toolCalls 时必须带上，否则后续 ToolMessage 会变成孤立结果被供应商拒绝
      if (m.toolCalls?.length) {
        out.push(
          new AIMessage({
            content: m.content,
            tool_calls: m.toolCalls.map((tc) => ({
              id: tc.id,
              name: tc.name,
              args: tc.args,
              type: 'tool_call' as const
            }))
          })
        )
      } else {
        out.push(new AIMessage(m.content))
      }
    } else if (m.role === 'tool') {
      out.push(
        new ToolMessage({
          content: m.content,
          tool_call_id: m.toolCallId || m.id,
          name: m.toolName
        })
      )
    }
  }
  return sanitizeMessagesForModel(trimMessagesToCharBudget(out))
}

async function syncNewMessagesToSession(
  sessionId: string,
  prevCount: number,
  messages: BaseMessage[]
): Promise<number> {
  let session = querySession(sessionId)
  if (!session) return prevCount
  const fresh = messages.slice(prevCount)
  for (const msg of fresh) {
    session = querySession(sessionId) ?? session
    if (!session) break
    if (HumanMessage.isInstance(msg)) continue

    // 工具结果须在思考完成后才展示
    await queryWaitThinkingSettled(sessionId)

    if (ToolMessage.isInstance(msg)) {
      const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
      const toolMsg = appendMessage(session, {
        role: 'tool',
        content,
        toolName: msg.name,
        toolCallId: msg.tool_call_id
      })
      persistSession(session)
      emitAgentEvent({
        type: 'tool_result',
        sessionId,
        toolName: msg.name || 'tool',
        result: content
      })
      emitAgentEvent({ type: 'message', sessionId, message: toolMsg })
      continue
    }

    if (isAIMessage(msg) || AIMessage.isInstance(msg)) {
      const ai = msg as AIMessage
      const content =
        typeof ai.content === 'string'
          ? ai.content
          : Array.isArray(ai.content)
            ? ai.content.map((c) => ('text' in c ? String(c.text) : '')).join('')
            : String(ai.content ?? '')

      // 推理过程写入消息 thinkingContent，UI 渲染在回答之前（先思考再输出）
      const reasoningRaw = ai.additional_kwargs?.reasoning_content
      const thinkingContent =
        typeof reasoningRaw === 'string' && reasoningRaw.trim() ? reasoningRaw.trim() : undefined

      // 推理结束事件由 stream-callbacks 统一推送，避免与 graph-bridge 重复触发
      await queryWaitThinkingSettled(sessionId)

      if (ai.tool_calls?.length) {
        // 工具即将执行：强制结束推理阶段，避免 tool_result 被 thinking gate 永久阻塞
        postThinkingReasoningComplete(sessionId)
        for (const tc of ai.tool_calls) {
          emitAgentEvent({
            type: 'tool_start',
            sessionId,
            toolName: tc.name,
            args: tc.args
          })
        }
      }

      // 跳过纯路由内部标记，避免污染聊天
      if (content.startsWith('[路由]')) continue

      if (content.trim() || ai.tool_calls?.length) {
        const display =
          content.trim() ||
          (ai.tool_calls?.length
            ? `调用工具: ${ai.tool_calls.map((t) => t.name).join(', ')}`
            : '')
        // 持久化 tool_calls，供进程重启后冷启动还原给模型
        const toolCalls = ai.tool_calls
          ?.filter((tc) => Boolean(tc.id) && Boolean(tc.name))
          .map((tc) => ({
            id: String(tc.id),
            name: String(tc.name),
            args: (tc.args ?? {}) as Record<string, unknown>
          }))
        const assistantMsg = appendMessage(session, {
          role: 'assistant',
          content: display,
          ...(thinkingContent ? { thinkingContent } : {}),
          ...(toolCalls?.length ? { toolCalls } : {})
        })
        persistSession(session)
        emitAgentEvent({ type: 'message', sessionId, message: assistantMsg })
        if (content.trim()) {
          emitAgentEvent({ type: 'text_delta', sessionId, delta: content })
        }
      }
    }
  }
  return messages.length
}

function queryReasonFromInterruptValue(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value
  if (value && typeof value === 'object' && typeof (value as { reason?: unknown }).reason === 'string') {
    return (value as { reason: string }).reason
  }
  return null
}

function extractInterruptReason(err: unknown): string | null {
  if (isGraphInterrupt(err) || err instanceof GraphInterrupt) {
    const interrupts = (err as GraphInterrupt).interrupts ?? []
    for (const item of interrupts) {
      const reason = queryReasonFromInterruptValue(item?.value)
      if (reason) return reason
    }
    return '需要用户确认后继续'
  }
  return null
}

/** 从 stream values 块中解析 __interrupt__ 原因 */
function queryInterruptReasonFromChunk(chunk: unknown): string | null {
  if (!isInterrupted(chunk)) return null
  const list = (chunk as Record<string, Array<{ value?: unknown }>>)[INTERRUPT] ?? []
  for (const item of list) {
    const reason = queryReasonFromInterruptValue(item?.value)
    if (reason) return reason
  }
  return '需要用户确认后继续'
}

function queryInterruptReasonFromState(state: {
  values?: unknown
  tasks?: Array<{ interrupts?: Array<{ value?: unknown }> }>
}): string | null {
  const fromValues = queryInterruptReasonFromChunk(state.values)
  if (fromValues) return fromValues

  const tasks = state.tasks ?? []
  for (const task of tasks) {
    for (const item of task.interrupts ?? []) {
      const reason = queryReasonFromInterruptValue(item?.value)
      if (reason) return reason
    }
  }
  return null
}

/**
 * 若最后一条 AI 消息仍有未配对的 tool_calls，说明工具节点未跑完（常见于 interrupt 漏检）。
 * 此时绝不能把步骤标为 completed，否则发布类工作流会出现假成功。
 */
function queryHasDanglingToolCalls(messages: BaseMessage[]): boolean {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]
    if (ToolMessage.isInstance(msg)) return false
    if (isAIMessage(msg) || AIMessage.isInstance(msg)) {
      const ai = msg as AIMessage
      return Boolean(ai.tool_calls?.length)
    }
  }
  return false
}

/**
 * LangGraph 版聊天入口。
 */
export async function runLangGraphChat(params: {
  sessionId: string
  content: string
  attachmentPaths?: string[]
}): Promise<void> {
  const { sessionId, content, attachmentPaths = [] } = params
  const settings = querySettings()
  let session = querySession(sessionId)
  if (!session) throw new Error(`会话不存在: ${sessionId}`)

  const controller = bindGraphSessionAbort(sessionId)

  const userMsg = appendMessage(session, {
    role: 'user',
    content:
      attachmentPaths.length > 0
        ? `${content}\n\n[附件]\n${attachmentPaths.join('\n')}`
        : content,
    attachmentPaths: attachmentPaths.length > 0 ? attachmentPaths : undefined
  })
  if (session.title === '新对话' || session.title === '新会话') {
    session.title = content.slice(0, 24) || '新对话'
  }
  persistSession(session)
  emitAgentEvent({ type: 'message', sessionId, message: userMsg })

  const capabilityBox: CapabilityBox = { current: '' }
  const toolCtx = buildToolContext(
    sessionId,
    attachmentPaths,
    controller.signal,
    settings.fullAccess,
    capabilityBox
  )

  let graph
  try {
    graph = buildChatGraph({
      settings,
      toolCtx,
      capabilityBox,
      onModelResolved: ({ capability, model, connectionLabel }) => {
        emitAgentEvent({
          type: 'model_switch',
          sessionId,
          capability,
          model,
          connectionLabel
        })
      }
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    emitAgentEvent({ type: 'error', sessionId, message })
    emitAgentEvent({ type: 'done', sessionId, reason: 'error' })
    abortMap.delete(sessionId)
    return
  }

  const history = sessionToLcMessages(querySession(sessionId)!)
  // 当前 user 已写入 session；prior 为不含本轮 human 的历史（供 checkpoint 冷启动回填）
  const prior = history.slice(0, -1)
  const human = new HumanMessage(
    attachmentPaths.length > 0
      ? `${content}\n\n[附件]\n${attachmentPaths.join('\n')}`
      : content
  )

  const config = {
    configurable: { thread_id: sessionId },
    recursionLimit: queryRecursionLimit(settings.maxTurns),
    signal: controller.signal
  }

  /**
   * MemorySaver 按 thread_id 保留上轮 messages。若本轮再传入完整 prior，
   * messagesStateReducer 会追加到 checkpoint → 历史翻倍，UI 同步也会重复落盘。
   * 有 checkpoint 时只增量传入本轮 human；无 checkpoint（进程重启）再回填 prior。
   */
  const checkpointSnap = await graph.getState(config)
  const checkpointMessages =
    checkpointSnap.values &&
      typeof checkpointSnap.values === 'object' &&
      'messages' in checkpointSnap.values
      ? ((checkpointSnap.values as { messages: BaseMessage[] }).messages ?? [])
      : []
  const hasCheckpoint = checkpointMessages.length > 0
  // 已在 session / checkpoint 中的消息不再经 sync 落盘；从该下标起才是本轮增量
  let synced = hasCheckpoint ? checkpointMessages.length : prior.length

  // Command resume 与首轮 state 共用流入口
  let input:
    | {
      messages: BaseMessage[]
      sessionId: string
      attachmentPaths: string[]
      activeAgent: AgentRoleName
      nextAgent: string
      activeCapability: ModelCapability | ''
    }
    | Command = {
    messages: hasCheckpoint ? [human] : [...prior, human],
    sessionId,
    attachmentPaths,
    activeAgent: 'supervisor' as AgentRoleName,
    nextAgent: 'general',
    activeCapability: ''
  }

  try {
    // interrupt → 等人 → Command resume 可循环多次
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (controller.signal.aborted) {
        emitAgentEvent({ type: 'done', sessionId, reason: 'aborted' })
        return
      }

      /** 本轮 stream 是否因 __interrupt__ chunk 而需要 resume */
      let resumeCommand: Command | null = null

      try {
        // Command 泛型与图节点联合类型不完全对齐，运行时 resume 合法
        const stream = await graph.stream(input as Parameters<typeof graph.stream>[0], {
          ...config,
          streamMode: 'values'
        })
        for await (const state of stream) {
          if (controller.signal.aborted) {
            emitAgentEvent({ type: 'done', sessionId, reason: 'aborted' })
            return
          }
          // values 流可能直接吐出 { __interrupt__: [...] }，需在循环内识别
          const chunkReason = queryInterruptReasonFromChunk(state)
          if (chunkReason) {
            resumeCommand = await waitForGraphUserResumeCommand(sessionId, chunkReason)
            if (controller.signal.aborted) {
              emitAgentEvent({ type: 'done', sessionId, reason: 'aborted' })
              return
            }
            break
          }
          if (state && typeof state === 'object' && 'messages' in state) {
            const s = state as { messages: BaseMessage[]; activeAgent?: AgentRoleName }
            synced = await syncNewMessagesToSession(sessionId, synced, s.messages)
            if (s.activeAgent) {
              emitAgentEvent({ type: 'agent_role', sessionId, role: s.activeAgent })
            }
          }
        }
        if (resumeCommand) {
          input = resumeCommand
          continue
        }
      } catch (streamErr) {
        const reason = extractInterruptReason(streamErr)
        if (reason) {
          const cmd = await waitForGraphUserResumeCommand(sessionId, reason)
          if (controller.signal.aborted) {
            emitAgentEvent({ type: 'done', sessionId, reason: 'aborted' })
            return
          }
          input = cmd
          continue
        }
        throw streamErr
      }

      // stream 正常结束：检查 checkpoint 是否仍挂起 interrupt
      const snap = await graph.getState(config)
      const interruptReason = queryInterruptReasonFromState(snap)
      if (interruptReason) {
        const cmd = await waitForGraphUserResumeCommand(sessionId, interruptReason)
        if (controller.signal.aborted) {
          emitAgentEvent({ type: 'done', sessionId, reason: 'aborted' })
          return
        }
        input = cmd
        continue
      }

      const finalMessages =
        snap.values && typeof snap.values === 'object' && 'messages' in snap.values
          ? ((snap.values as { messages: BaseMessage[] }).messages ?? [])
          : []
      if (queryHasDanglingToolCalls(finalMessages)) {
        emitAgentEvent({
          type: 'error',
          sessionId,
          message: '工具调用未完成（可能登录确认被中断），请重试本轮'
        })
        emitAgentEvent({ type: 'done', sessionId, reason: 'error' })
        return
      }

      await queryWaitThinkingSettled(sessionId)
      emitAgentEvent({ type: 'done', sessionId, reason: 'end_turn' })
      postResetThinkingGate(sessionId)
      return
    }
  } catch (e) {
    if (controller.signal.aborted) {
      emitAgentEvent({ type: 'done', sessionId, reason: 'aborted' })
      return
    }
    const message = e instanceof Error ? e.message : String(e)
    if (/recursion/i.test(message)) {
      emitAgentEvent({ type: 'error', sessionId, message: '达到最大工具轮次' })
      emitAgentEvent({ type: 'done', sessionId, reason: 'max_turns' })
      return
    }
    emitAgentEvent({ type: 'error', sessionId, message })
    emitAgentEvent({ type: 'done', sessionId, reason: 'error' })
  } finally {
    abortMap.delete(sessionId)
  }
}

export type LangGraphStepResult = 'completed' | 'aborted' | 'error' | 'max_turns'

export async function runLangGraphStep(params: {
  sessionId: string
  prompt: string
  toolWhitelist?: string[]
  attachmentPaths?: string[]
}): Promise<LangGraphStepResult> {
  const { sessionId, prompt, toolWhitelist, attachmentPaths = [] } = params
  const settings = querySettings()
  let session = querySession(sessionId)
  if (!session) throw new Error(`会话不存在: ${sessionId}`)

  let controller = abortMap.get(sessionId)
  if (!controller || controller.signal.aborted) {
    controller = new AbortController()
    abortMap.set(sessionId, controller)
  }

  const userMsg = appendMessage(session, {
    role: 'user',
    content:
      attachmentPaths.length > 0
        ? `${prompt}\n\n[附件]\n${attachmentPaths.join('\n')}`
        : prompt,
    attachmentPaths: attachmentPaths.length > 0 ? attachmentPaths : undefined
  })
  persistSession(session)
  emitAgentEvent({ type: 'message', sessionId, message: userMsg })

  // 任务/工作流步骤：跳过危险工具与「点发布前」确认；未登录仍会 emitAwaitUser 暂停
  const capabilityBox: CapabilityBox = { current: '' }
  const toolCtx = buildToolContext(
    sessionId,
    attachmentPaths,
    controller.signal,
    true,
    capabilityBox
  )

  let agent
  try {
    agent = buildStepReactGraph({
      settings,
      toolCtx,
      systemPrompt: buildRoleSystemPrompt('general'),
      toolWhitelist,
      stepPrompt: prompt,
      attachmentPaths,
      capabilityBox,
      onModelResolved: ({ capability, model, connectionLabel }) => {
        emitAgentEvent({
          type: 'model_switch',
          sessionId,
          capability,
          model,
          connectionLabel
        })
      }
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    emitAgentEvent({ type: 'error', sessionId, message })
    return 'error'
  }

  const threadId = `${sessionId}:step:${uuidv4()}`
  const config = {
    configurable: { thread_id: threadId },
    recursionLimit: queryRecursionLimit(settings.maxTurns),
    signal: controller.signal
  }

  const human = new HumanMessage(
    attachmentPaths.length > 0
      ? `${prompt}\n\n[附件]\n${attachmentPaths.join('\n')}`
      : prompt
  )

  let synced = 0
  let input: { messages: BaseMessage[] } | Command = { messages: [human] }

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (controller.signal.aborted) return 'aborted'
      let resumeCommand: Command | null = null
      try {
        const stream = await agent.stream(input as Parameters<typeof agent.stream>[0], {
          ...config,
          streamMode: 'values'
        })
        for await (const state of stream) {
          if (controller.signal.aborted) return 'aborted'
          const chunkReason = queryInterruptReasonFromChunk(state)
          if (chunkReason) {
            resumeCommand = await waitForGraphUserResumeCommand(sessionId, chunkReason)
            if (controller.signal.aborted) return 'aborted'
            break
          }
          if (state && typeof state === 'object' && 'messages' in state) {
            synced = await syncNewMessagesToSession(
              sessionId,
              synced,
              (state as { messages: BaseMessage[] }).messages
            )
          }
        }
        if (resumeCommand) {
          input = resumeCommand
          continue
        }
      } catch (streamErr) {
        const reason = extractInterruptReason(streamErr)
        if (reason) {
          const cmd = await waitForGraphUserResumeCommand(sessionId, reason)
          if (controller.signal.aborted) return 'aborted'
          input = cmd
          continue
        }
        throw streamErr
      }

      const snap = await agent.getState(config)
      const interruptReason = queryInterruptReasonFromState(snap)
      if (interruptReason) {
        const cmd = await waitForGraphUserResumeCommand(sessionId, interruptReason)
        if (controller.signal.aborted) return 'aborted'
        input = cmd
        continue
      }

      const finalMessages =
        snap.values && typeof snap.values === 'object' && 'messages' in snap.values
          ? ((snap.values as { messages: BaseMessage[] }).messages ?? [])
          : []
      if (queryHasDanglingToolCalls(finalMessages)) {
        emitAgentEvent({
          type: 'error',
          sessionId,
          message: '发布工具调用未完成（常见于抖音登录等待被当作步骤结束）。请重新执行该发布步骤。'
        })
        return 'error'
      }
      await queryWaitThinkingSettled(sessionId)
      postResetThinkingGate(sessionId)
      return 'completed'
    }
  } catch (e) {
    if (controller.signal.aborted) return 'aborted'
    const message = e instanceof Error ? e.message : String(e)
    if (/recursion/i.test(message)) return 'max_turns'
    emitAgentEvent({ type: 'error', sessionId, message })
    return 'error'
  }
}
