import type { AppView } from '@/stores/app-store'
import { BUSINESS_MENUS, useBusinessStore } from '@/features/business'
import { NAV_ITEMS } from '../../config/nav-items'
import { SidebarBrand } from './SidebarBrand'
import { SidebarBusinessNav } from './SidebarBusinessNav'
import { SidebarFooter } from './SidebarFooter'
import { SidebarNav } from './SidebarNav'
import { SidebarNewChatButton } from './SidebarNewChatButton'
import styles from './Sidebar.module.css'

interface SidebarCollapsedProps {
  view: AppView
  isFreshChatSession: boolean
  isBusinessMode: boolean
  onNavigate: (view: AppView) => void
  onCreateSession: () => void
  onToggleCollapse: () => void
}

/** 折叠态侧边栏：助手 / 业务系统两套快捷导航 */
export function SidebarCollapsed({
  view,
  isFreshChatSession,
  isBusinessMode,
  onNavigate,
  onCreateSession,
  onToggleCollapse
}: SidebarCollapsedProps): React.ReactElement {
  const activeMenu = useBusinessStore((s) => s.activeMenu)
  const setActiveMenu = useBusinessStore((s) => s.setActiveMenu)

  return (
    <div className={styles.collapsedBody}>
      {/* 业务系统 Logo 在 businessMainCollapsed 内单独展示，避免折叠态重复渲染 */}
      {!isBusinessMode && <SidebarBrand collapsed />}
      {isBusinessMode ? (
        <div className={styles.businessMainCollapsed}>
          <SidebarBrand collapsed />
          <SidebarBusinessNav
            items={BUSINESS_MENUS}
            activeMenu={activeMenu}
            collapsed
            onSelect={setActiveMenu}
          />
        </div>
      ) : (
        <>
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
        </>
      )}
      <SidebarFooter
        activeView={view}
        collapsed
        onNavigate={onNavigate}
        onToggleCollapse={onToggleCollapse}
      />
    </div>
  )
}
