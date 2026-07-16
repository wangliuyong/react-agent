import { useSessionStore } from '@/features/chat'
import { BusinessShell } from '@/layouts/BusinessShell'

/**
 * 业务系统独立应用根（运行在 BrowserView 子视图）。
 * 与灵犀助手主视图进程隔离，各自维护 UI 状态。
 */
export default function BusinessApp(): React.ReactElement {
  const hydrateSessions = useSessionStore((s) => s.hydrate)
  const bindAgentEvents = useSessionStore((s) => s.bindAgentEvents)

  useEffect(() => {
    void hydrateSessions()
    const unsub = bindAgentEvents()
    return unsub
  }, [hydrateSessions, bindAgentEvents])

  return <BusinessShell />
}
