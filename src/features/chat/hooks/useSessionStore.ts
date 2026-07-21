import { create } from 'zustand'
import { pauseRunningTasks, queryHasRunningTasks } from '@shared/pause-running-tasks'
import type { AgentEvent, ChatMessage, Session, SessionType, TaskItem } from '@shared/types'
import { queryLatestWorkflowRunBySession } from '@/features/business/api'
import { postResumeWorkflow } from '@/features/workflows/api'
import {
  postAgentAbort,
  postAgentChat,
  postAgentContinue,
  postCreateSession,
  postDeleteSession,
  querySession,
  querySessions
} from '../api'
import { queryAwaitUserReasonFromMessages } from '../utils/queryAwaitUserReasonFromMessages'
import { querySessionType } from '../utils/querySessionType'
import { queryShouldResumeViaWorkflow } from '../utils/queryShouldResumeViaWorkflow'
import { useAppStore } from '@/stores/app-store'

function findLastIndex<T>(items: T[], predicate: (item: T) => boolean): number {
  for (let i = items.length - 1; i >= 0; i--) {
    if (predicate(items[i])) return i
  }
  return -1
}

interface SessionState {
  sessions: Session[]
  activeSessionId: string | null
  /** 进程内各会话的执行中标记，用于侧边栏历史图标 loading */
  runningSessionIds: Set<string>
  running: boolean
  awaitUserReason: string | null
  /**
   * 各会话挂起确认原因（含非当前会话）。
   * await_user 事件只对当前会话写 awaitUserReason 时，切换会话会丢提示；用此表兜底。
   */
  pendingAwaitReasons: Record<string, string>
  /** 用户主动中断且仍有未完成任务时，可点「继续」恢复执行 */
  canResume: boolean
  streamingText: string
  /** 模型推理 / Agent 思考过程（流式增量拼接） */
  thinkingText: string
  /** 当前正在执行的工具名（tool_start ~ tool_result 之间） */
  activeToolName: string | null
  /** 当前任务选用的模型连接展示名（model_switch 事件更新） */
  activeModelLabel: string | null
  hydrate: () => Promise<void>
  setActive: (id: string | null) => void
  createSession: (type?: SessionType) => Promise<Session>
  removeSession: (id: string) => Promise<void>
  sendMessage: (content: string, attachmentPaths?: string[]) => Promise<void>
  abort: () => Promise<void>
  continueRun: (userInput?: string) => Promise<void>
  /** 中断后从任务清单未完成的步骤重新拉起 Agent */
  resumeRun: () => Promise<void>
  /**
   * 外部编排（工作流引擎）拉起会话时标记执行中，
   * 以便任务清单展示「中断」且不经过 sendMessage。
   */
  beginExternalRun: (sessionId: string) => void
  bindAgentEvents: () => () => void
  getActiveSession: () => Session | null
}

/** 是否存在尚未完成（待执行 / 执行中）的任务项 */
function queryHasIncompleteTasks(tasks: TaskItem[]): boolean {
  return tasks.some((t) => t.status === 'pending' || t.status === 'running')
}

/**
 * 非执行中且任务清单仍有未完成项时，应展示「继续」。
 * 刷新后进程内 abort/await 状态会丢，只能从落盘的 tasks 恢复该按钮。
 */
function queryCanResumeFromSession(
  session: Session | null | undefined,
  running: boolean
): boolean {
  if (running || !session) return false
  return queryHasIncompleteTasks(session.tasks ?? [])
}

function patchSession(
  sessions: Session[],
  id: string,
  patch: (s: Session) => Session
): Session[] {
  return sessions.map((s) => (s.id === id ? patch(s) : s))
}

/** 不可变地向执行中会话集合添加一项 */
function withRunningSession(ids: Set<string>, sessionId: string): Set<string> {
  if (ids.has(sessionId)) return ids
  const next = new Set(ids)
  next.add(sessionId)
  return next
}

/** 不可变地从执行中会话集合移除一项 */
function withoutRunningSession(ids: Set<string>, sessionId: string): Set<string> {
  if (!ids.has(sessionId)) return ids
  const next = new Set(ids)
  next.delete(sessionId)
  return next
}

/** 根据当前选中会话同步全局 running 布尔值 */
function syncActiveRunning(
  activeSessionId: string | null,
  runningSessionIds: Set<string>
): boolean {
  return activeSessionId != null && runningSessionIds.has(activeSessionId)
}

/** 从落盘任务清单恢复执行中会话（刷新后侧边栏 loading 仍可用） */
function queryRunningSessionIdsFromSessions(sessions: Session[]): Set<string> {
  const ids = new Set<string>()
  for (const session of sessions) {
    if ((session.tasks ?? []).some((t) => t.status === 'running')) {
      ids.add(session.id)
    }
  }
  return ids
}

/** 写入某会话的挂起确认原因（不可变） */
function withPendingAwaitReason(
  map: Record<string, string>,
  sessionId: string,
  reason: string
): Record<string, string> {
  if (map[sessionId] === reason) return map
  return { ...map, [sessionId]: reason }
}

/** 清除某会话的挂起确认原因（不可变） */
function withoutPendingAwaitReason(
  map: Record<string, string>,
  sessionId: string
): Record<string, string> {
  if (!(sessionId in map)) return map
  const next = { ...map }
  delete next[sessionId]
  return next
}

/**
 * 解析当前会话应展示的确认文案：内存表优先，其次从消息回填。
 * 仅在会话仍标记为执行中时回填，避免历史「等待确认」误亮按钮。
 */
function queryActiveAwaitUserReason(
  sessionId: string | null,
  session: Session | null | undefined,
  pendingAwaitReasons: Record<string, string>,
  running: boolean
): string | null {
  if (!sessionId) return null
  const fromMap = pendingAwaitReasons[sessionId]
  if (fromMap) return fromMap
  if (!running || !session) return null
  return queryAwaitUserReasonFromMessages(session.messages)
}

/** 是否已完成首次 hydrate（区分冷启动恢复与 done 后的增量同步） */
let sessionStoreHydratedOnce = false

/**
 * 进程内已无执行标记时，将落盘仍为 running 的任务视为暂停。
 * 避免 done / 中断后全量 hydrate 再次把界面锁进「执行中」。
 */
function querySessionsWithStaleRunningPaused(
  sessions: Session[],
  runningSessionIds: Set<string>
): Session[] {
  return sessions.map((s) => {
    if (runningSessionIds.has(s.id)) return s
    if (!queryHasRunningTasks(s.tasks ?? [])) return s
    return { ...s, tasks: pauseRunningTasks(s.tasks ?? []) }
  })
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  runningSessionIds: new Set<string>(),
  running: false,
  awaitUserReason: null,
  pendingAwaitReasons: {},
  canResume: false,
  streamingText: '',
  thinkingText: '',
  activeToolName: null,
  activeModelLabel: null,

  getActiveSession: () => {
    const { sessions, activeSessionId } = get()
    return sessions.find((s) => s.id === activeSessionId) ?? null
  },

  hydrate: async () => {
    const sessions = await querySessions()
    const prevId = get().activeSessionId
    // 保留当前选中会话（若仍存在），避免 done 后 hydrate 把焦点跳走并丢掉继续态
    const activeSessionId =
      (prevId && sessions.some((s) => s.id === prevId) ? prevId : null) ??
      sessions[0]?.id ??
      null
    const sessionIdSet = new Set(sessions.map((s) => s.id))
    const persistedRunningIds = queryRunningSessionIdsFromSessions(sessions)
    // 合并进程内标记；仅冷启动时从落盘 running 任务恢复，避免 done 后 hydrate 误判仍在执行
    const runningSessionIds = new Set<string>()
    for (const id of Array.from(get().runningSessionIds)) {
      if (sessionIdSet.has(id)) runningSessionIds.add(id)
    }
    if (!sessionStoreHydratedOnce) {
      for (const id of Array.from(persistedRunningIds)) {
        runningSessionIds.add(id)
      }
    }
    sessionStoreHydratedOnce = true
    const normalizedSessions = querySessionsWithStaleRunningPaused(sessions, runningSessionIds)
    const activeNormalized = normalizedSessions.find((s) => s.id === activeSessionId)
    const running = syncActiveRunning(activeSessionId, runningSessionIds)
    const pendingAwaitReasons = get().pendingAwaitReasons
    set({
      sessions: normalizedSessions,
      activeSessionId,
      runningSessionIds,
      running,
      awaitUserReason: queryActiveAwaitUserReason(
        activeSessionId,
        activeNormalized,
        pendingAwaitReasons,
        running
      ),
      canResume: queryCanResumeFromSession(activeNormalized, running)
    })
  },

  setActive: (id) => {
    const session = get().sessions.find((s) => s.id === id)
    const running = syncActiveRunning(id, get().runningSessionIds)
    set({
      activeSessionId: id,
      running,
      streamingText: '',
      // 切换会话时从挂起表 / 消息回填确认条，避免「等待确认」文案在、按钮却没了
      awaitUserReason: queryActiveAwaitUserReason(
        id,
        session,
        get().pendingAwaitReasons,
        running
      ),
      activeToolName: null,
      activeModelLabel: null,
      canResume: queryCanResumeFromSession(session, running)
    })
  },

  createSession: async (type: SessionType = 'chat') => {
    const session = await postCreateSession(type)
    set((state) => ({
      sessions: [session, ...state.sessions],
      activeSessionId: session.id,
      runningSessionIds: withoutRunningSession(state.runningSessionIds, session.id),
      running: false,
      streamingText: '',
      awaitUserReason: null,
      canResume: false
    }))
    useAppStore.getState().setView('chat')
    return session
  },

  removeSession: async (id) => {
    await postDeleteSession(id)
    set((state) => {
      const sessions = state.sessions.filter((s) => s.id !== id)
      const runningSessionIds = withoutRunningSession(state.runningSessionIds, id)
      const nextActiveId =
        state.activeSessionId === id ? (sessions[0]?.id ?? null) : state.activeSessionId
      const nextActive = sessions.find((s) => s.id === nextActiveId)
      const running = syncActiveRunning(nextActiveId, runningSessionIds)
      const pendingAwaitReasons = withoutPendingAwaitReason(state.pendingAwaitReasons, id)
      return {
        sessions,
        runningSessionIds,
        pendingAwaitReasons,
        activeSessionId: nextActiveId,
        running,
        awaitUserReason: queryActiveAwaitUserReason(
          nextActiveId,
          nextActive,
          pendingAwaitReasons,
          running
        )
      }
    })
  },

  sendMessage: async (content, attachmentPaths) => {
    let { activeSessionId, runningSessionIds } = get()
    if (!activeSessionId) {
      const session = await get().createSession()
      activeSessionId = session.id
    } else if (runningSessionIds.has(activeSessionId)) {
      message.warning('当前会话正在执行中，请稍候或点击中断')
      return
    }
    set((state) => ({
      runningSessionIds: withRunningSession(state.runningSessionIds, activeSessionId),
      running: true,
      awaitUserReason: null,
      pendingAwaitReasons: withoutPendingAwaitReason(
        state.pendingAwaitReasons,
        activeSessionId
      ),
      canResume: false,
      streamingText: '',
      thinkingText: '',
      activeToolName: null,
      activeModelLabel: null
    }))
    await postAgentChat(activeSessionId, content, attachmentPaths)
  },

  abort: async () => {
    const id = get().activeSessionId
    if (!id) return
    await postAgentAbort(id)
    set((state) => {
      const session = state.sessions.find((s) => s.id === id)
      const pausedTasks = pauseRunningTasks(session?.tasks ?? [])
      return {
        sessions: patchSession(state.sessions, id, (s) => ({ ...s, tasks: pausedTasks })),
        runningSessionIds: withoutRunningSession(state.runningSessionIds, id),
        running: false,
        awaitUserReason: null,
        pendingAwaitReasons: withoutPendingAwaitReason(state.pendingAwaitReasons, id),
        // 不必等 done：有未完成任务时立刻可继续（刷新场景依赖主进程落盘）
        canResume: queryHasIncompleteTasks(pausedTasks)
      }
    })
  },

  continueRun: async (userInput?: string) => {
    const id = get().activeSessionId
    if (!id) return
    const trimmed = userInput?.trim()
    set((state) => {
      const next: Partial<SessionState> = {
        awaitUserReason: null,
        pendingAwaitReasons: withoutPendingAwaitReason(state.pendingAwaitReasons, id),
        canResume: false,
        runningSessionIds: withRunningSession(state.runningSessionIds, id),
        running: true
      }
      // 乐观写入用户说明，避免等主进程 message 事件才出现在列表
      if (trimmed) {
        const userMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'user',
          content: trimmed,
          createdAt: Date.now()
        }
        next.sessions = patchSession(state.sessions, id, (session) => ({
          ...session,
          messages: [...session.messages, userMsg],
          updatedAt: Date.now()
        }))
      }
      return next
    })
    await postAgentContinue(id, trimmed)
  },

  resumeRun: async () => {
    const { activeSessionId, sessions, runningSessionIds } = get()
    if (!activeSessionId) return
    if (runningSessionIds.has(activeSessionId)) {
      message.warning('任务正在执行中，请勿重复继续')
      return
    }

    const session = sessions.find((s) => s.id === activeSessionId)
    if (!session) return

    const incomplete = (session.tasks ?? []).filter(
      (t) => t.status === 'pending' || t.status === 'running'
    )
    if (!incomplete.length) {
      set({ canResume: false })
      return
    }

    set({ canResume: false })

    // 流程 / 定时 / 发布会话：走工作流引擎恢复，避免仅向 Agent 发消息却无法推进节点
    const sessionType = querySessionType(session)
    const workflowRun = await queryLatestWorkflowRunBySession(activeSessionId)
    if (queryShouldResumeViaWorkflow(sessionType, workflowRun)) {
      get().beginExternalRun(activeSessionId)
      try {
        await postResumeWorkflow(workflowRun.id)
      } catch (err) {
        set((state) => ({
          runningSessionIds: withoutRunningSession(state.runningSessionIds, activeSessionId),
          running: false,
          canResume: true
        }))
        message.error(err instanceof Error ? err.message : '恢复流程执行失败')
      }
      return
    }

    const lines = incomplete
      .map((t) => `- ${t.title}（${t.status === 'running' ? '进行中' : '待执行'}）`)
      .join('\n')
    const content = `请从上次中断处继续，完成以下未完成任务：\n${lines}`

    await get().sendMessage(content)
  },

  beginExternalRun: (sessionId) => {
    set((state) => ({
      activeSessionId: sessionId,
      runningSessionIds: withRunningSession(state.runningSessionIds, sessionId),
      running: true,
      // 保留该会话已挂起的确认原因，避免清掉即将展示的确认条
      awaitUserReason: state.pendingAwaitReasons[sessionId] ?? null,
      canResume: false,
      streamingText: '',
      thinkingText: '',
      activeToolName: null
    }))
  },

  bindAgentEvents: () => {
    return window.api.onAgentEvent((event: AgentEvent) => {
      // agent_role 仅驱动状态文案，不改正文列表
      if (event.type === 'agent_role') {
        return
      }

      if (event.type === 'model_switch') {
        const activeId = get().activeSessionId
        if (event.sessionId === activeId) {
          set({
            activeModelLabel: event.connectionLabel || event.model
          })
        }
        return
      }

      /** 工作流 Toast 节点：全局弹出，不依赖当前会话 */
      if (event.type === 'workflow_toast') {
        const fn = message[event.level]
        if (typeof fn === 'function') {
          fn(event.content)
        } else {
          message.info(event.content)
        }
        return
      }

      /** 定时/发布/流程每次执行新建会话：侧边栏追加并切换到该对话 */
      if (event.type === 'session_started') {
        const isTaskSession =
          event.session.type === 'schedule' ||
          event.session.type === 'workflow' ||
          event.session.type === 'publish'
        set((state) => {
          const exists = state.sessions.some((s) => s.id === event.session.id)
          return {
            sessions: exists
              ? state.sessions
              : [event.session, ...state.sessions],
            ...(isTaskSession
              ? {
                  activeSessionId: event.session.id,
                  runningSessionIds: withRunningSession(
                    state.runningSessionIds,
                    event.session.id
                  ),
                  running: true,
                  awaitUserReason: null,
                  canResume: false,
                  streamingText: '',
                  thinkingText: '',
                  activeToolName: null
                }
              : {})
          }
        })
        return
      }

      const activeId = get().activeSessionId

      if (event.type === 'thinking_delta') {
        set((s) => {
          const runningSessionIds = withRunningSession(s.runningSessionIds, event.sessionId)
          if (event.sessionId !== activeId) {
            return { runningSessionIds }
          }

          // 执行中：先累积到临时区，UI 展示在回答/工具之前
          if (s.running) {
            return {
              runningSessionIds,
              thinkingText: s.thinkingText + event.delta,
              activeToolName: null,
              running: true
            }
          }

          // 已结束仍收到推理增量：挂到最近一条 assistant，避免掉到列表末尾
          const session = s.sessions.find((x) => x.id === event.sessionId)
          const lastAssistantIdx = session
            ? findLastIndex(session.messages, (m) => m.role === 'assistant')
            : -1
          if (!session || lastAssistantIdx < 0) {
            return { runningSessionIds, thinkingText: event.delta }
          }

          const messages = session.messages.map((m, i) =>
            i === lastAssistantIdx
              ? { ...m, thinkingContent: `${m.thinkingContent ?? ''}${event.delta}` }
              : m
          )
          return {
            runningSessionIds,
            sessions: patchSession(s.sessions, event.sessionId, (sess) => ({
              ...sess,
              messages
            })),
            thinkingText: ''
          }
        })
        return
      }

      if (event.type === 'text_delta') {
        set((s) => ({
          runningSessionIds: withRunningSession(s.runningSessionIds, event.sessionId),
          ...(event.sessionId === activeId
            ? {
                streamingText: s.streamingText + event.delta,
                thinkingText: s.running ? s.thinkingText : '',
                activeToolName: null,
                running: true
              }
            : {})
        }))
        return
      }

      if (event.type === 'tool_start') {
        set((s) => ({
          runningSessionIds: withRunningSession(s.runningSessionIds, event.sessionId),
          ...(event.sessionId === activeId
            ? {
                activeToolName: event.toolName,
                streamingText: '',
                thinkingText: s.running ? s.thinkingText : '',
                running: true
              }
            : {})
        }))
        return
      }

      if (event.type === 'tool_result') {
        if (event.sessionId === activeId) {
          set({ activeToolName: null })
        }
        return
      }

      if (event.type === 'message') {
        set((state) => {
          const isActive = event.sessionId === activeId
          const liveThinking = isActive ? state.thinkingText.trim() : ''
          // 将本轮流式思考归并到 assistant 消息，保证「思考」展示在回答之前
          const incoming =
            event.message.role === 'assistant' &&
            liveThinking &&
            !event.message.thinkingContent?.trim()
              ? { ...event.message, thinkingContent: liveThinking }
              : event.message

          return {
            sessions: patchSession(state.sessions, event.sessionId, (session) => {
              const exists = session.messages.findIndex((m) => m.id === incoming.id)
              let messages: ChatMessage[]
              if (exists >= 0) {
                messages = session.messages.map((m) =>
                  m.id === incoming.id ? { ...m, ...incoming } : m
                )
              } else {
                messages = [...session.messages, incoming]
              }
              const title =
                session.title === '新对话' && incoming.role === 'user'
                  ? incoming.content.slice(0, 24)
                  : session.title
              return { ...session, messages, title, updatedAt: Date.now() }
            }),
            ...(isActive
              ? {
                  streamingText: '',
                  // 回答已落盘后清空临时思考，避免跑到列表末尾
                  thinkingText:
                    incoming.role === 'assistant' ? '' : state.thinkingText
                }
              : {})
          }
        })
        return
      }

      /** LLM 每次调用结束后同步累计 token，供输入框与历史对话展示 */
      if (event.type === 'token_update') {
        set((state) => ({
          sessions: patchSession(state.sessions, event.sessionId, (session) => ({
            ...session,
            tokenUsed: event.tokenUsed
          }))
        }))
        return
      }

      if (event.type === 'task_update') {
        const tasks = event.tasks as TaskItem[]
        const hasRunningTask = tasks.some((t) => t.status === 'running')
        set((state) => {
          const runningSessionIds = hasRunningTask
            ? withRunningSession(state.runningSessionIds, event.sessionId)
            : state.runningSessionIds
          return {
            sessions: patchSession(state.sessions, event.sessionId, (session) => ({
              ...session,
              tasks
            })),
            runningSessionIds,
            // 工作流引擎推进步骤时同步「执行中」，确保清单可中断
            ...(event.sessionId === activeId && hasRunningTask
              ? { running: true, canResume: false }
              : {})
          }
        })
        return
      }

      if (event.type === 'await_user') {
        // 任意会话都记入挂起表；当前会话同步点亮确认条
        set((state) => {
          const pendingAwaitReasons = withPendingAwaitReason(
            state.pendingAwaitReasons,
            event.sessionId,
            event.reason
          )
          return {
            pendingAwaitReasons,
            ...(event.sessionId === state.activeSessionId
              ? { awaitUserReason: event.reason }
              : {})
          }
        })
        return
      }

      if (event.type === 'done') {
        set((state) => {
          const runningSessionIds = withoutRunningSession(
            state.runningSessionIds,
            event.sessionId
          )
          const pendingAwaitReasons = withoutPendingAwaitReason(
            state.pendingAwaitReasons,
            event.sessionId
          )
          return {
            runningSessionIds,
            pendingAwaitReasons,
            ...(event.sessionId === activeId
              ? {
                  running: false,
                  awaitUserReason: null,
                  streamingText: '',
                  thinkingText: '',
                  activeToolName: null,
                  activeModelLabel: null
                }
              : {})
          }
        })
        // 单会话增量同步，避免 done 后全量 hydrate 同步读盘阻塞主线程
        void (async () => {
          const diskSession = await querySession(event.sessionId)
          if (!diskSession) return
          set((state) => {
            // 磁盘回灌时保留本轮已合并到消息上的 thinkingContent
            const local = state.sessions.find((s) => s.id === event.sessionId)
            const mergedMessages = diskSession.messages.map((diskMsg) => {
              const localMsg = local?.messages.find((m) => m.id === diskMsg.id)
              if (
                localMsg?.thinkingContent?.trim() &&
                !diskMsg.thinkingContent?.trim()
              ) {
                return { ...diskMsg, thinkingContent: localMsg.thinkingContent }
              }
              return diskMsg
            })
            const diskWithThinking = { ...diskSession, messages: mergedMessages }
            const sessions = querySessionsWithStaleRunningPaused(
              patchSession(state.sessions, event.sessionId, () => diskWithThinking),
              state.runningSessionIds
            )
            const active = sessions.find((s) => s.id === state.activeSessionId)
            const running = syncActiveRunning(state.activeSessionId, state.runningSessionIds)
            return {
              sessions,
              canResume: queryCanResumeFromSession(active, running),
              ...(event.sessionId === state.activeSessionId ? { thinkingText: '' } : {})
            }
          })
        })()
        return
      }

      if (event.type === 'error') {
        const errText = event.message?.trim() || 'Agent 执行失败'
        // 错误必须可见：此前仅清 running，用户会看到「发了消息却完全没响应」
        if (event.sessionId === activeId) {
          message.error(errText)
        }
        set((state) => {
          const errorMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `⚠️ ${errText}`,
            createdAt: Date.now()
          }
          return {
            sessions: patchSession(state.sessions, event.sessionId, (session) => ({
              ...session,
              messages: [...session.messages, errorMsg],
              updatedAt: Date.now()
            })),
            runningSessionIds: withoutRunningSession(state.runningSessionIds, event.sessionId),
            pendingAwaitReasons: withoutPendingAwaitReason(
              state.pendingAwaitReasons,
              event.sessionId
            ),
            ...(event.sessionId === activeId
              ? {
                  running: false,
                  awaitUserReason: null,
                  streamingText: '',
                  thinkingText: '',
                  activeToolName: null,
                  activeModelLabel: null
                }
              : {})
          }
        })
        return
      }
    })
  }
}))
