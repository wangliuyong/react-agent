import { useCallback } from 'react'
import type { AppView } from '@/stores/app-store'
import { useAppStore } from '@/stores/app-store'
import { useSessionStore } from '@/features/chat'
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

  const historyItems: SessionHistoryItem[] = sessions.map((s) => ({
    id: s.id,
    title: s.title,
    updatedAt: s.updatedAt
  }))

  return {
    view,
    historyItems,
    activeSessionId,
    navigateTo,
    selectSession,
    createNewSession
  }
}
