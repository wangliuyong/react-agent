import type { AppView } from '@/stores/app-store'
import { BUSINESS_MENUS, useBusinessStore } from '@/features/business'
import { NAV_ITEMS } from '../../config/nav-items'
import type { SessionHistoryItem } from '../../types'
import { SidebarBrand } from './SidebarBrand'
import { SidebarBusinessNav } from './SidebarBusinessNav'
import { SidebarFooter } from './SidebarFooter'
import { SidebarHistory } from './SidebarHistory'
import { SidebarNav } from './SidebarNav'
import { SidebarNewChatButton } from './SidebarNewChatButton'
import styles from './Sidebar.module.css'

interface SidebarExpandedProps {
  view: AppView
  historyItems: SessionHistoryItem[]
  activeSessionId: string | null
  isFreshChatSession: boolean
  /** 业务系统模式：侧边栏仅 Logo + 业务菜单 */
  isBusinessMode: boolean
  onNavigate: (view: AppView) => void
  onSelectSession: (sessionId: string) => void
  onDeleteSession: (sessionId: string) => void
  onCreateSession: () => void
  onToggleCollapse: () => void
}

/** 展开态侧边栏：助手 = 导航 + 历史；业务系统 = Logo + 菜单，Footer 固定底部 */
export function SidebarExpanded({
  view,
  historyItems,
  activeSessionId,
  isFreshChatSession,
  isBusinessMode,
  onNavigate,
  onSelectSession,
  onDeleteSession,
  onCreateSession,
  onToggleCollapse
}: SidebarExpandedProps): React.ReactElement {
  const activeMenu = useBusinessStore((s) => s.activeMenu)
  const setActiveMenu = useBusinessStore((s) => s.setActiveMenu)

  return (
    <div className={styles.expandedBody}>
      {isBusinessMode ? (
        <div className={styles.businessMain}>
          <SidebarBrand />
          <SidebarBusinessNav
            items={BUSINESS_MENUS}
            activeMenu={activeMenu}
            onSelect={setActiveMenu}
          />
        </div>
      ) : (
        <>
          <SidebarBrand />
          <SidebarNewChatButton active={isFreshChatSession} onCreate={onCreateSession} />
          <SidebarNav items={NAV_ITEMS} activeView={view} onNavigate={onNavigate} />
          <SidebarHistory
            items={historyItems}
            activeSessionId={activeSessionId}
            activeView={view}
            isFreshChatSession={isFreshChatSession}
            onSelect={onSelectSession}
            onDelete={onDeleteSession}
          />
        </>
      )}
      <SidebarFooter
        activeView={view}
        onNavigate={onNavigate}
        onToggleCollapse={onToggleCollapse}
      />
    </div>
  )
}
