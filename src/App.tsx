import { useEffect, type ReactElement } from 'react'
import { AppShell } from '@/layouts/AppShell'
import { useAppStore } from '@/stores/app-store'
import { useSessionStore } from '@/features/chat'
import { useSettingsStore } from '@/features/settings'
import { usePublishStore } from '@/features/publish'

/**
 * 根编排：启动时拉取设置 / 会话 / 发布计划，并订阅 Agent 事件。
 * 业务 UI 下沉到 features，App 只做装配。
 */
export default function App(): ReactElement {
  const view = useAppStore((s) => s.view)
  const hydrateSessions = useSessionStore((s) => s.hydrate)
  const bindAgentEvents = useSessionStore((s) => s.bindAgentEvents)
  const hydrateSettings = useSettingsStore((s) => s.hydrate)
  const hydratePlans = usePublishStore((s) => s.hydrate)

  useEffect(() => {
    void hydrateSettings()
    void hydrateSessions()
    void hydratePlans()
    const unsub = bindAgentEvents()
    return unsub
  }, [hydrateSettings, hydrateSessions, hydratePlans, bindAgentEvents])

  return <AppShell view={view} />
}
