import { useCallback } from 'react'
import { message } from 'antd'
import type { AppView } from '@/stores/app-store'
import { useAppStore } from '@/stores/app-store'
import { useSessionStore, querySessionType, queryIsFreshChatSession } from '@/features/chat'
import type { SessionHistoryItem } from '../types'

interface UseSidebarNavigationOptions {
  /** 当前主内容区视图，由 AppShell 根传入 */
  view: AppView
}

/** 侧边栏导航与会话历史：封装 store 读写与跳转副作用 */
export function useSidebarNavigation({ view }: UseSidebarNavigationOptions) {
  const setView = useAppStore((s) => s.setView)
  const sessions = useSessionStore((s) => s.sessions)
  const activeSessionId = useSessionStore((s) => s.activeSessionId)
  const setActive = useSessionStore((s) => s.setActive)
  const createSession = useSessionStore((s) => s.createSession)
  const removeSession = useSessionStore((s) => s.removeSession)
  const running = useSessionStore((s) => s.running)
  const abort = useSessionStore((s) => s.abort)

  const navigateTo = useCallback((target: AppView) => setView(target), [setView])

  const selectSession = useCallback(
    (sessionId: string) => {
      setActive(sessionId)
      setView('chat')
    },
    [setActive, setView]
  )

  const createNewSession = useCallback(() => {
    void createSession()
  }, [createSession])

  /** 删除历史对话；若正在执行则先中止 Agent */
  const deleteSession = useCallback(
    async (sessionId: string) => {
      if (running && activeSessionId === sessionId) {
        await abort()
      }
      await removeSession(sessionId)
      message.success('已删除对话')
    },
    [running, activeSessionId, abort, removeSession]
  )

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null
  const isFreshChatSession = view === 'chat' && queryIsFreshChatSession(activeSession)

  const historyItems: SessionHistoryItem[] = sessions.map((s) => ({
    id: s.id,
    title: s.title,
    updatedAt: s.updatedAt,
    type: querySessionType(s)
  }))

  return {
    view,
    historyItems,
    activeSessionId,
    isFreshChatSession,
    navigateTo,
    selectSession,
    createNewSession,
    deleteSession
  }
}
