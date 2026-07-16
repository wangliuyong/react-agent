import type { AppView } from '@/stores/app-store'
import { useNewChatShortcut, useSidebar, useSidebarNavigation } from '../../hooks'
import { SidebarCollapsed } from './SidebarCollapsed'
import { SidebarExpanded } from './SidebarExpanded'
import styles from './Sidebar.module.css'

interface SidebarProps {
  view: AppView
}

/** 侧边栏容器：助手 / 业务系统独立视图切换主导航 */
export function Sidebar({ view }: SidebarProps): React.ReactElement {
  const { sidebarCollapsed, toggleSidebar } = useSidebar()
  const {
    historyItems,
    activeSessionId,
    isFreshChatSession,
    navigateTo,
    selectSession,
    createNewSession,
    deleteSession
  } = useSidebarNavigation({ view })

  /** 业务系统为独立 AppView，刷新后由 localStorage 恢复 */
  const isBusinessMode = view === 'business'

  useNewChatShortcut({ onCreate: createNewSession, enabled: !isBusinessMode })

  return (
    <aside className={styles.sidebar} data-collapsed={sidebarCollapsed}>
      {sidebarCollapsed ? (
        <SidebarCollapsed
          view={view}
          isFreshChatSession={isFreshChatSession}
          isBusinessMode={isBusinessMode}
          onNavigate={navigateTo}
          onCreateSession={createNewSession}
          onToggleCollapse={toggleSidebar}
        />
      ) : (
        <SidebarExpanded
          view={view}
          historyItems={historyItems}
          activeSessionId={activeSessionId}
          isFreshChatSession={isFreshChatSession}
          isBusinessMode={isBusinessMode}
          onNavigate={navigateTo}
          onSelectSession={selectSession}
          onDeleteSession={(id) => void deleteSession(id)}
          onCreateSession={createNewSession}
          onToggleCollapse={toggleSidebar}
        />
      )}
    </aside>
  )
}
