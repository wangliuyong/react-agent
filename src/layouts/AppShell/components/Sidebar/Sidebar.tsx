import type { AppView } from '@/stores/app-store'
import { useSidebar, useSidebarNavigation } from '../../hooks'
import { SidebarCollapsed } from './SidebarCollapsed'
import { SidebarExpanded } from './SidebarExpanded'
import styles from './Sidebar.module.css'

interface SidebarProps {
  view: AppView
}

/** 侧边栏容器：组合 hooks 与展开/折叠展示组件 */
export function Sidebar({ view }: SidebarProps): React.ReactElement {
  const { sidebarCollapsed, toggleSidebar } = useSidebar()
  const { historyItems, activeSessionId, navigateTo, selectSession, createNewSession } =
    useSidebarNavigation({ view })

  return (
    <aside className={styles.sidebar} data-collapsed={sidebarCollapsed}>
      <div className={`${styles.sidebarTop} app-drag`}>
        <div className={`${styles.trafficSpacer} app-no-drag`} />
      </div>

      {sidebarCollapsed ? (
        <SidebarCollapsed
          view={view}
          onNavigate={navigateTo}
          onCreateSession={createNewSession}
          onToggleCollapse={toggleSidebar}
        />
      ) : (
        <SidebarExpanded
          view={view}
          historyItems={historyItems}
          activeSessionId={activeSessionId}
          onNavigate={navigateTo}
          onSelectSession={selectSession}
          onCreateSession={createNewSession}
          onToggleCollapse={toggleSidebar}
        />
      )}
    </aside>
  )
}
