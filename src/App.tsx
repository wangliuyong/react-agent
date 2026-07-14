import { AppShell } from '@/layouts/AppShell'
import { useAppStore } from '@/stores/app-store'
import { useSessionStore } from '@/features/chat'
import { useSettingsStore } from '@/features/settings'
import { usePublishStore } from '@/features/publish'
import { useScheduleStore } from '@/features/schedule'
import { useChannelsStore } from '@/features/channels'
import { useRulesStore } from '@/features/rules'

/**
 * 根编排：启动时拉取设置 / 会话 / 发布计划 / 定时任务 / 规则，并订阅 Agent 与调度事件。
 * 业务 UI 下沉到 features，App 只做装配。
 */
export default function App(): React.ReactElement {
  const view = useAppStore((s) => s.view)
  const hydrateSessions = useSessionStore((s) => s.hydrate)
  const bindAgentEvents = useSessionStore((s) => s.bindAgentEvents)
  const hydrateSettings = useSettingsStore((s) => s.hydrate)
  const hydratePlans = usePublishStore((s) => s.hydrate)
  const hydrateSchedules = useScheduleStore((s) => s.hydrate)
  const hydrateChannels = useChannelsStore((s) => s.hydrate)
  const hydrateRules = useRulesStore((s) => s.hydrate)
  const bindScheduleUpdates = useScheduleStore((s) => s.bindScheduleUpdates)

  useEffect(() => {
    void hydrateSettings()
    void hydrateSessions()
    void hydratePlans()
    void hydrateSchedules()
    void hydrateChannels()
    void hydrateRules()
    const unsubAgent = bindAgentEvents()
    const unsubSchedule = bindScheduleUpdates()
    return () => {
      unsubAgent()
      unsubSchedule()
    }
  }, [
    hydrateSettings,
    hydrateSessions,
    hydratePlans,
    hydrateSchedules,
    hydrateChannels,
    hydrateRules,
    bindAgentEvents,
    bindScheduleUpdates
  ])

  return <AppShell view={view} />
}
