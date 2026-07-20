import { create } from 'zustand'
import { pauseRunningTasks } from '@shared/pause-running-tasks'
import type { AgentEvent, ChatMessage, Session, SessionType, TaskItem } from '@shared/types'
import {
  postAgentAbort,
  postAgentChat,
  postAgentContinue,
  postCreateSession,
  postDeleteSession,
  postSession,
  querySessions
} from '../api'
import { useAppStore } from '@/stores/app-store'

interface SessionState {
  sessions: Session[]
  activeSessionId: string | null
  /** 进程内各会话的执行中标记，用于侧边栏历史图标 loading */
  runningSessionIds: Set<string>
  running: boolean
  awaitUserReason: string | null
  /** 用户主动中断且仍有未完成任务时，可点「继续」恢复执行 */
  canResume: boolean
  streamingText: string
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
  continueRun: () => Promise<void>
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

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  runningSessionIds: new Set<string>(),
  running: false,
  awaitUserReason: null,
  canResume: false,
  streamingText: '',
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
    const active = sessions.find((s) => s.id === activeSessionId)
    const sessionIdSet = new Set(sessions.map((s) => s.id))
    const persistedRunningIds = queryRunningSessionIdsFromSessions(sessions)
    // 合并进程内标记与落盘任务，避免 hydrate 冲掉后台仍在执行的会话
    const runningSessionIds = new Set<string>()
    for (const id of Array.from(get().runningSessionIds)) {
      if (sessionIdSet.has(id)) runningSessionIds.add(id)
    }
    for (const id of Array.from(persistedRunningIds)) {
      runningSessionIds.add(id)
    }
    set({
      sessions,
      activeSessionId,
      runningSessionIds,
      running: syncActiveRunning(activeSessionId, runningSessionIds),
      canResume: queryCanResumeFromSession(active, syncActiveRunning(activeSessionId, runningSessionIds))
    })
  },

  setActive: (id) => {
    const session = get().sessions.find((s) => s.id === id)
    const running = syncActiveRunning(id, get().runningSessionIds)
    set({
      activeSessionId: id,
      running,
      streamingText: '',
      awaitUserReason: null,
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
      return {
        sessions,
        runningSessionIds,
        activeSessionId: nextActiveId,
        running: syncActiveRunning(nextActiveId, runningSessionIds)
      }
    })
  },

  sendMessage: async (content, attachmentPaths) => {
    let { activeSessionId } = get()
    if (!activeSessionId) {
      const session = await get().createSession()
      activeSessionId = session.id
    }
    set((state) => ({
      runningSessionIds: withRunningSession(state.runningSessionIds, activeSessionId),
      running: true,
      awaitUserReason: null,
      canResume: false,
      streamingText: '',
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
        // 不必等 done：有未完成任务时立刻可继续（刷新场景依赖主进程落盘）
        canResume: queryHasIncompleteTasks(pausedTasks)
      }
    })
  },

  continueRun: async () => {
    const id = get().activeSessionId
    if (!id) return
    set((state) => ({
      awaitUserReason: null,
      canResume: false,
      runningSessionIds: withRunningSession(state.runningSessionIds, id),
      running: true
    }))
    await postAgentContinue(id)
  },

  resumeRun: async () => {
    const { activeSessionId, sessions } = get()
    if (!activeSessionId) return

    const session = sessions.find((s) => s.id === activeSessionId)
    const incomplete = (session?.tasks ?? []).filter(
      (t) => t.status === 'pending' || t.status === 'running'
    )
    if (!incomplete.length) {
      set({ canResume: false })
      return
    }

    const lines = incomplete
      .map((t) => `- ${t.title}（${t.status === 'running' ? '进行中' : '待执行'}）`)
      .join('\n')
    const content = `请从上次中断处继续，完成以下未完成任务：\n${lines}`

    set({ canResume: false })
    await get().sendMessage(content)
  },

  beginExternalRun: (sessionId) => {
    set((state) => ({
      activeSessionId: sessionId,
      runningSessionIds: withRunningSession(state.runningSessionIds, sessionId),
      running: true,
      awaitUserReason: null,
      canResume: false,
      streamingText: '',
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
                  activeToolName: null
                }
              : {})
          }
        })
        return
      }

      const activeId = get().activeSessionId

      if (event.type === 'text_delta') {
        set((s) => ({
          runningSessionIds: withRunningSession(s.runningSessionIds, event.sessionId),
          ...(event.sessionId === activeId
            ? {
                streamingText: s.streamingText + event.delta,
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
        set((state) => ({
          sessions: patchSession(state.sessions, event.sessionId, (session) => {
            const exists = session.messages.findIndex((m) => m.id === event.message.id)
            let messages: ChatMessage[]
            if (exists >= 0) {
              messages = session.messages.map((m) =>
                m.id === event.message.id ? event.message : m
              )
            } else {
              messages = [...session.messages, event.message]
            }
            const title =
              session.title === '新对话' && event.message.role === 'user'
                ? event.message.content.slice(0, 24)
                : session.title
            return { ...session, messages, title, updatedAt: Date.now() }
          }),
          streamingText: event.sessionId === activeId ? '' : get().streamingText
        }))
        // 异步落盘最新会话（防抖可后续优化）
        const updated = get().sessions.find((s) => s.id === event.sessionId)
        if (updated) void postSession(updated)
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
        if (event.sessionId === activeId) {
          set({ awaitUserReason: event.reason })
        }
        return
      }

      if (event.type === 'done') {
        set((state) => {
          const runningSessionIds = withoutRunningSession(
            state.runningSessionIds,
            event.sessionId
          )
          return {
            runningSessionIds,
            ...(event.sessionId === activeId
              ? {
                  running: false,
                  awaitUserReason: null,
                  streamingText: '',
                  activeToolName: null,
                  activeModelLabel: null
                }
              : {})
          }
        })
        // hydrate 会按落盘 tasks 恢复 canResume（中断 / 刷新后均可继续）
        void get().hydrate()
        return
      }

      if (event.type === 'error') {
        set((state) => ({
          runningSessionIds: withoutRunningSession(state.runningSessionIds, event.sessionId),
          ...(event.sessionId === activeId
            ? { running: false, activeToolName: null, activeModelLabel: null }
            : {})
        }))
        return
      }
    })
  }
}))
