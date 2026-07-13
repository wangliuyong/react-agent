import type { AppView } from '@/stores/app-store'
import { NAV_ITEMS } from '../../config/nav-items'
import { SidebarBrand } from './SidebarBrand'
import { SidebarFooter } from './SidebarFooter'
import { SidebarNav } from './SidebarNav'
import { SidebarNewChatButton } from './SidebarNewChatButton'
import styles from './Sidebar.module.css'

interface SidebarCollapsedProps {
  view: AppView
  isFreshChatSession: boolean
  onNavigate: (view: AppView) => void
  onCreateSession: () => void
  onToggleCollapse: () => void
}

/** 折叠态侧边栏：图标快捷操作 + Tooltip */
export function SidebarCollapsed({
  view,
  isFreshChatSession,
  onNavigate,
  onCreateSession,
  onToggleCollapse
}: SidebarCollapsedProps): React.ReactElement {
  return (
    <div className={styles.collapsedBody}>
      <SidebarBrand collapsed />
      <SidebarNewChatButton
        collapsed
        active={isFreshChatSession}
        onCreate={onCreateSession}
      />
      <SidebarNav
        items={NAV_ITEMS}
        activeView={view}
        collapsed
        onNavigate={onNavigate}
      />
      <SidebarFooter
        activeView={view}
        collapsed
        onNavigate={onNavigate}
        onToggleCollapse={onToggleCollapse}
      />
    </div>
  )
}
