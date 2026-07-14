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
import type { AgentEvent, AgentRoleName, ChatMessage, Session, TaskItem } from '../../../shared/types'
import { querySettings } from '../store/settings'
import { querySession, postSession } from '../store/sessions'
import { getMainWindow } from '../window'
import { handleScheduleAgentDone } from '../schedule/agent-hook'
import type { ToolContext } from './tools/types'
import { buildChatGraph, buildStepReactGraph } from './graph/chat-graph'
import { buildRoleSystemPrompt } from './graph/prompts'
import { queryRecursionLimit } from './graph/react-subgraph'

function uuidv4(): string {
  return crypto.randomUUID()
}

const abortMap = new Map<string, AbortController>()
const continueWaiters = new Map<string, { resolve: () => void; reject: (e: Error) => void }>()

export function emitAgentEvent(event: AgentEvent): void {
  const win = getMainWindow()
  if (win && !win.isDestroyed()) {
    win.webContents.send('event:agent', event)
  }
  handleScheduleAgentDone(event)
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

export function postGraphAbort(sessionId: string): void {
  abortMap.get(sessionId)?.abort()
  abortMap.delete(sessionId)
  const waiter = continueWaiters.get(sessionId)
  if (waiter) {
    waiter.reject(new Error('用户已中止'))
    continueWaiters.delete(sessionId)
  }
}

export function postGraphContinue(sessionId: string): void {
  const waiter = continueWaiters.get(sessionId)
  if (waiter) {
    waiter.resolve()
    continueWaiters.delete(sessionId)
  }
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
  reason: string
): Promise<void> {
  emitAgentEvent({ type: 'await_user', sessionId, reason })
  await new Promise<void>((resolve, reject) => {
    continueWaiters.set(sessionId, { resolve, reject })
  })
}

function buildToolContext(
  sessionId: string,
  attachmentPaths: string[],
  signal: AbortSignal,
  fullAccess: boolean
): ToolContext {
  return {
    sessionId,
    fullAccess,
    attachmentPaths,
    signal,
    emitAwaitUser: async (reason) => {
      await waitForGraphUserContinue(sessionId, reason)
    },
    updateTasks: (updater) => {
      const current = querySession(sessionId)
      if (!current) return
      current.tasks = updater(current.tasks) as TaskItem[]
      persistSession(current)
      emitAgentEvent({ type: 'task_update', sessionId, tasks: current.tasks })
    }
  }
}

function sessionToLcMessages(session: Session): BaseMessage[] {
  const recent = session.messages.slice(-50)
  const out: BaseMessage[] = []
  for (const m of recent) {
    if (m.role === 'user') {
      out.push(new HumanMessage(m.content))
    } else if (m.role === 'assistant') {
      out.push(new AIMessage(m.content))
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
  return out
}

function syncNewMessagesToSession(
  sessionId: string,
  prevCount: number,
  messages: BaseMessage[]
): number {
  let session = querySession(sessionId)
  if (!session) return prevCount
  const fresh = messages.slice(prevCount)
  for (const msg of fresh) {
    session = querySession(sessionId) ?? session
    if (!session) break
    if (HumanMessage.isInstance(msg)) continue

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

      if (ai.tool_calls?.length) {
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
        const assistantMsg = appendMessage(session, { role: 'assistant', content: display })
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

  const toolCtx = buildToolContext(
    sessionId,
    attachmentPaths,
    controller.signal,
    settings.fullAccess
  )

  let graph
  try {
    graph = buildChatGraph({ settings, toolCtx })
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
    }
    | Command = {
    messages: hasCheckpoint ? [human] : [...prior, human],
    sessionId,
    attachmentPaths,
    activeAgent: 'supervisor' as AgentRoleName,
    nextAgent: 'general'
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
      let needResume = false

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
            await waitForGraphUserContinue(sessionId, chunkReason)
            if (controller.signal.aborted) {
              emitAgentEvent({ type: 'done', sessionId, reason: 'aborted' })
              return
            }
            needResume = true
            break
          }
          if (state && typeof state === 'object' && 'messages' in state) {
            const s = state as { messages: BaseMessage[]; activeAgent?: AgentRoleName }
            synced = syncNewMessagesToSession(sessionId, synced, s.messages)
            if (s.activeAgent) {
              emitAgentEvent({ type: 'agent_role', sessionId, role: s.activeAgent })
            }
          }
        }
        if (needResume) {
          input = new Command({ resume: true })
          continue
        }
      } catch (streamErr) {
        const reason = extractInterruptReason(streamErr)
        if (reason) {
          await waitForGraphUserContinue(sessionId, reason)
          if (controller.signal.aborted) {
            emitAgentEvent({ type: 'done', sessionId, reason: 'aborted' })
            return
          }
          input = new Command({ resume: true })
          continue
        }
        throw streamErr
      }

      // stream 正常结束：检查 checkpoint 是否仍挂起 interrupt
      const snap = await graph.getState(config)
      const interruptReason = queryInterruptReasonFromState(snap)
      if (interruptReason) {
        await waitForGraphUserContinue(sessionId, interruptReason)
        if (controller.signal.aborted) {
          emitAgentEvent({ type: 'done', sessionId, reason: 'aborted' })
          return
        }
        input = new Command({ resume: true })
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

      emitAgentEvent({ type: 'done', sessionId, reason: 'end_turn' })
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
  const toolCtx = buildToolContext(
    sessionId,
    attachmentPaths,
    controller.signal,
    true
  )

  let agent
  try {
    agent = buildStepReactGraph({
      settings,
      toolCtx,
      systemPrompt: buildRoleSystemPrompt('general'),
      toolWhitelist
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
      let needResume = false
      try {
        const stream = await agent.stream(input as Parameters<typeof agent.stream>[0], {
          ...config,
          streamMode: 'values'
        })
        for await (const state of stream) {
          if (controller.signal.aborted) return 'aborted'
          const chunkReason = queryInterruptReasonFromChunk(state)
          if (chunkReason) {
            await waitForGraphUserContinue(sessionId, chunkReason)
            if (controller.signal.aborted) return 'aborted'
            needResume = true
            break
          }
          if (state && typeof state === 'object' && 'messages' in state) {
            synced = syncNewMessagesToSession(
              sessionId,
              synced,
              (state as { messages: BaseMessage[] }).messages
            )
          }
        }
        if (needResume) {
          input = new Command({ resume: true })
          continue
        }
      } catch (streamErr) {
        const reason = extractInterruptReason(streamErr)
        if (reason) {
          await waitForGraphUserContinue(sessionId, reason)
          if (controller.signal.aborted) return 'aborted'
          input = new Command({ resume: true })
          continue
        }
        throw streamErr
      }

      const snap = await agent.getState(config)
      const interruptReason = queryInterruptReasonFromState(snap)
      if (interruptReason) {
        await waitForGraphUserContinue(sessionId, interruptReason)
        if (controller.signal.aborted) return 'aborted'
        input = new Command({ resume: true })
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
