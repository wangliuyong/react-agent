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
import { Command, GraphInterrupt, isGraphInterrupt } from '@langchain/langgraph'
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

function extractInterruptReason(err: unknown): string | null {
  if (isGraphInterrupt(err) || err instanceof GraphInterrupt) {
    const interrupts = (err as GraphInterrupt).interrupts ?? []
    for (const item of interrupts) {
      const v = item?.value as { reason?: string } | string | undefined
      if (typeof v === 'string') return v
      if (v && typeof v === 'object' && typeof v.reason === 'string') return v.reason
    }
    return '需要用户确认后继续'
  }
  return null
}

function queryInterruptReasonFromState(state: {
  tasks?: Array<{ interrupts?: Array<{ value?: unknown }> }>
}): string | null {
  const tasks = state.tasks ?? []
  for (const task of tasks) {
    for (const item of task.interrupts ?? []) {
      const v = item?.value as { reason?: string } | string | undefined
      if (typeof v === 'string') return v
      if (v && typeof v === 'object' && typeof v.reason === 'string') return v.reason
    }
  }
  return null
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

  let synced = 0
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
    messages: [...prior, human],
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
          if (state && typeof state === 'object' && 'messages' in state) {
            const s = state as { messages: BaseMessage[]; activeAgent?: AgentRoleName }
            synced = syncNewMessagesToSession(sessionId, synced, s.messages)
            if (s.activeAgent) {
              emitAgentEvent({ type: 'agent_role', sessionId, role: s.activeAgent })
            }
          }
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

  const toolCtx = buildToolContext(
    sessionId,
    attachmentPaths,
    controller.signal,
    settings.fullAccess
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
      try {
        const stream = await agent.stream(input as Parameters<typeof agent.stream>[0], {
          ...config,
          streamMode: 'values'
        })
        for await (const state of stream) {
          if (controller.signal.aborted) return 'aborted'
          if (state && typeof state === 'object' && 'messages' in state) {
            synced = syncNewMessagesToSession(
              sessionId,
              synced,
              (state as { messages: BaseMessage[] }).messages
            )
          }
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
