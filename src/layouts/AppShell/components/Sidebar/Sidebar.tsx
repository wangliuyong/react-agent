import type { AppView } from '@/stores/app-store'
import { useNewChatShortcut, useSidebar, useSidebarNavigation } from '../../hooks'
import { SidebarExpanded } from './SidebarExpanded'
import styles from './Sidebar.module.css'

interface SidebarProps {
  view: AppView
}

/**
 * 侧边栏容器：固定单一 DOM 树 + 宽度裁剪，避免折叠/展开时切换组件导致文字换行闪烁。
 */
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

  const isBusinessMode = view === 'business'

  useNewChatShortcut({ onCreate: createNewSession, enabled: !isBusinessMode })

  return (
    <aside className={styles.sidebar} data-collapsed={sidebarCollapsed || undefined}>
      <div className={styles.sidebarInner}>
        <SidebarExpanded
          collapsed={sidebarCollapsed}
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
      </div>
    </aside>
  )
}
