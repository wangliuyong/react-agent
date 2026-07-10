import { create } from 'zustand'
import type { AgentEvent, ChatMessage, Session, TaskItem } from '@shared/types'
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
  streamingText: string
  hydrate: () => Promise<void>
  setActive: (id: string | null) => void
  createSession: () => Promise<Session>
  removeSession: (id: string) => Promise<void>
  sendMessage: (content: string, attachmentPaths?: string[]) => Promise<void>
  abort: () => Promise<void>
  continueRun: () => Promise<void>
  bindAgentEvents: () => () => void
  getActiveSession: () => Session | null
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
  streamingText: '',

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

  setActive: (id) => set({ activeSessionId: id, streamingText: '', awaitUserReason: null }),

  createSession: async () => {
    const session = await postCreateSession()
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
    set({ running: true, awaitUserReason: null, streamingText: '' })
    useAppStore.getState().setBrowserOpen(true)
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
    set({ awaitUserReason: null })
    await postAgentContinue(id)
  },

  bindAgentEvents: () => {
    return window.api.onAgentEvent((event: AgentEvent) => {
      const activeId = get().activeSessionId

      if (event.type === 'text_delta') {
        if (event.sessionId !== activeId) return
        set((s) => ({ streamingText: s.streamingText + event.delta }))
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
        set((state) => ({
          sessions: patchSession(state.sessions, event.sessionId, (session) => ({
            ...session,
            tasks: event.tasks as TaskItem[]
          }))
        }))
        return
      }

      if (event.type === 'await_user') {
        if (event.sessionId === activeId) {
          set({ awaitUserReason: event.reason })
          useAppStore.getState().setBrowserOpen(true)
        }
        return
      }

      if (event.type === 'browser_open') {
        useAppStore.getState().setBrowserOpen(true)
        return
      }

      if (event.type === 'done') {
        if (event.sessionId === activeId) {
          set({ running: false, awaitUserReason: null, streamingText: '' })
        }
        void get().hydrate()
        return
      }

      if (event.type === 'error') {
        if (event.sessionId === activeId) {
          set({ running: false })
        }
        return
      }
    })
  }
}))
