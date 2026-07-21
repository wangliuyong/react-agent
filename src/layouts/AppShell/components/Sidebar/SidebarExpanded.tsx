import type { AppView } from '@/stores/app-store'
import { BUSINESS_MENUS, useBusinessStore } from '@/features/business'
import { NAV_ITEMS } from '../../config/nav-items'
import type { SessionHistoryItem } from '../../types'
import { SidebarBrand } from './SidebarBrand'
import { SidebarFooter } from './SidebarFooter'
import { SidebarHistory } from './SidebarHistory'
import { SidebarMenu } from './SidebarMenu'
import { SidebarNewChatButton } from './SidebarNewChatButton'
import styles from './Sidebar.module.css'

interface SidebarExpandedProps {
  /** 折叠态：裁剪可见区域并淡出文案，不切换 DOM */
  collapsed: boolean
  view: AppView
  historyItems: SessionHistoryItem[]
  activeSessionId: string | null
  isFreshChatSession: boolean
  isBusinessMode: boolean
  onNavigate: (view: AppView) => void
  onSelectSession: (sessionId: string) => void
  onDeleteSession: (sessionId: string) => void
  onCreateSession: () => void
  onToggleCollapse: () => void
}

/** 侧边栏内容：助手 = 导航 + 历史；业务系统 = Logo + 菜单 */
export function SidebarExpanded({
  collapsed,
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
    <div className={styles.expandedBody} data-collapsed={collapsed || undefined}>
      {isBusinessMode ? (
        <div className={styles.businessMain}>
          <SidebarBrand collapsed={collapsed} />
          <SidebarMenu
            items={BUSINESS_MENUS}
            activeKey={activeMenu}
            collapsed={collapsed}
            ariaLabel="业务系统菜单"
            onSelect={setActiveMenu}
          />
        </div>
      ) : (
        <>
          <SidebarBrand collapsed={collapsed} />
          <SidebarNewChatButton
            collapsed={collapsed}
            active={isFreshChatSession}
            onCreate={onCreateSession}
          />
          <SidebarMenu
            items={NAV_ITEMS}
            activeKey={view}
            collapsed={collapsed}
            ariaLabel="主导航"
            onSelect={onNavigate}
          />
          <div className={styles.historySection} data-hidden={collapsed || undefined}>
            <SidebarHistory
              items={historyItems}
              activeSessionId={activeSessionId}
              activeView={view}
              isFreshChatSession={isFreshChatSession}
              onSelect={onSelectSession}
              onDelete={onDeleteSession}
            />
          </div>
        </>
      )}
      <SidebarFooter
        activeView={view}
        collapsed={collapsed}
        onNavigate={onNavigate}
        onToggleCollapse={onToggleCollapse}
      />
    </div>
  )
}
