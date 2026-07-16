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
  /** 业务系统模式：侧边栏展示业务菜单而非助手导航 */
  isBusinessMode: boolean
  onNavigate: (view: AppView) => void
  onSelectSession: (sessionId: string) => void
  onDeleteSession: (sessionId: string) => void
  onCreateSession: () => void
  onToggleCollapse: () => void
}

/** 展开态侧边栏：助手模式 = 导航 + 历史；业务系统模式 = 业务菜单 */
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
    <>
      <SidebarBrand />
      {isBusinessMode ? (
        <>
          <div className={styles.sectionLabel}>
            <span className={styles.sectionLabelText}>
              <ApartmentOutlined className={styles.sectionLabelIcon} />
              业务系统
            </span>
          </div>
          <SidebarBusinessNav
            items={BUSINESS_MENUS}
            activeMenu={activeMenu}
            onSelect={setActiveMenu}
          />
        </>
      ) : (
        <>
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
    </>
  )
}
