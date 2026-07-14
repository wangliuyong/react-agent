import { create } from 'zustand'
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
  running: boolean
  awaitUserReason: string | null
  /** 用户主动中断且仍有未完成任务时，可点「继续」恢复执行 */
  canResume: boolean
  streamingText: string
  /** 当前正在执行的工具名（tool_start ~ tool_result 之间） */
  activeToolName: string | null
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

function patchSession(
  sessions: Session[],
  id: string,
  patch: (s: Session) => Session
): Session[] {
  return sessions.map((s) => (s.id === id ? patch(s) : s))
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  running: false,
  awaitUserReason: null,
  canResume: false,
  streamingText: '',
  activeToolName: null,

  getActiveSession: () => {
    const { sessions, activeSessionId } = get()
    return sessions.find((s) => s.id === activeSessionId) ?? null
  },

  hydrate: async () => {
    const sessions = await querySessions()
    set({
      sessions,
      activeSessionId: sessions[0]?.id ?? null
    })
  },

  setActive: (id) =>
    set({ activeSessionId: id, streamingText: '', awaitUserReason: null, canResume: false }),

  createSession: async (type: SessionType = 'chat') => {
    const session = await postCreateSession(type)
    set((state) => ({
      sessions: [session, ...state.sessions],
      activeSessionId: session.id,
      streamingText: '',
      awaitUserReason: null
    }))
    useAppStore.getState().setView('chat')
    return session
  },

  removeSession: async (id) => {
    await postDeleteSession(id)
    set((state) => {
      const sessions = state.sessions.filter((s) => s.id !== id)
      return {
        sessions,
        activeSessionId:
          state.activeSessionId === id ? (sessions[0]?.id ?? null) : state.activeSessionId
      }
    })
  },

  sendMessage: async (content, attachmentPaths) => {
    let { activeSessionId } = get()
    if (!activeSessionId) {
      const session = await get().createSession()
      activeSessionId = session.id
    }
    set({ running: true, awaitUserReason: null, canResume: false, streamingText: '', activeToolName: null })
    await postAgentChat(activeSessionId, content, attachmentPaths)
  },

  abort: async () => {
    const id = get().activeSessionId
    if (!id) return
    await postAgentAbort(id)
    set({ running: false, awaitUserReason: null })
  },

  continueRun: async () => {
    const id = get().activeSessionId
    if (!id) return
    set({ awaitUserReason: null, canResume: false })
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
    set({
      activeSessionId: sessionId,
      running: true,
      awaitUserReason: null,
      canResume: false,
      streamingText: '',
      activeToolName: null
    })
  },

  bindAgentEvents: () => {
    return window.api.onAgentEvent((event: AgentEvent) => {
      // agent_role 仅驱动状态文案，不改正文列表
      if (event.type === 'agent_role') {
        return
      }
      const activeId = get().activeSessionId

      if (event.type === 'text_delta') {
        if (event.sessionId !== activeId) return
        set((s) => ({
          streamingText: s.streamingText + event.delta,
          activeToolName: null
        }))
        return
      }

      if (event.type === 'tool_start') {
        if (event.sessionId !== activeId) return
        set({ activeToolName: event.toolName, streamingText: '' })
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

      if (event.type === 'task_update') {
        const tasks = event.tasks as TaskItem[]
        const hasRunningTask = tasks.some((t) => t.status === 'running')
        set((state) => ({
          sessions: patchSession(state.sessions, event.sessionId, (session) => ({
            ...session,
            tasks
          })),
          // 工作流引擎推进步骤时同步「执行中」，确保清单可中断
          ...(event.sessionId === activeId && hasRunningTask
            ? { running: true, canResume: false }
            : {})
        }))
        return
      }

      if (event.type === 'await_user') {
        if (event.sessionId === activeId) {
          set({ awaitUserReason: event.reason })
        }
        return
      }

      if (event.type === 'done') {
        if (event.sessionId === activeId) {
          const session = get().sessions.find((s) => s.id === event.sessionId)
          const canResume =
            event.reason === 'aborted' && queryHasIncompleteTasks(session?.tasks ?? [])
          set({
            running: false,
            awaitUserReason: null,
            streamingText: '',
            activeToolName: null,
            canResume
          })
        }
        void get().hydrate()
        return
      }

      if (event.type === 'error') {
        if (event.sessionId === activeId) {
          set({ running: false, activeToolName: null })
        }
        return
      }
    })
  }
}))
