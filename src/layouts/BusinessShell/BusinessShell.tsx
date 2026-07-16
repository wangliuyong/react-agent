import { BUSINESS_MENUS, BusinessPanel, useBusinessStore } from '@/features/business'
import { useAppStore } from '@/stores/app-store'
import { SidebarBrand } from '@/layouts/AppShell/components/Sidebar/SidebarBrand'
import { SidebarBusinessNav } from '@/layouts/AppShell/components/Sidebar/SidebarBusinessNav'
import { SidebarCollapseToggle } from '@/layouts/AppShell/components/Sidebar/SidebarCollapseToggle'
import sidebarStyles from '@/layouts/AppShell/components/Sidebar/Sidebar.module.css'
import styles from './BusinessShell.module.css'

/** 业务系统独立壳层：左侧业务菜单 + 主内容（BrowserView 子视图专用） */
export function BusinessShell(): React.ReactElement {
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)
  const activeMenu = useBusinessStore((s) => s.activeMenu)
  const setActiveMenu = useBusinessStore((s) => s.setActiveMenu)

  return (
    <div className={styles.shell}>
      <aside className={sidebarStyles.sidebar} data-collapsed={sidebarCollapsed}>
        {sidebarCollapsed ? (
          <div className={sidebarStyles.collapsedBody}>
            <SidebarBrand collapsed />
            <SidebarBusinessNav
              items={BUSINESS_MENUS}
              activeMenu={activeMenu}
              collapsed
              onSelect={setActiveMenu}
            />
            <div className={sidebarStyles.collapsedFooter}>
              <SidebarCollapseToggle collapsed onToggle={toggleSidebar} />
            </div>
          </div>
        ) : (
          <>
            <SidebarBrand />
            <div className={sidebarStyles.sectionLabel}>
              <span className={sidebarStyles.sectionLabelText}>
                <ApartmentOutlined className={sidebarStyles.sectionLabelIcon} />
                业务系统
              </span>
            </div>
            <SidebarBusinessNav
              items={BUSINESS_MENUS}
              activeMenu={activeMenu}
              onSelect={setActiveMenu}
            />
            <div className={sidebarStyles.sidebarFooter}>
              <div className={sidebarStyles.collapseToggleWrap}>
                <SidebarCollapseToggle onToggle={toggleSidebar} />
              </div>
            </div>
          </>
        )}
      </aside>
      <BusinessPanel />
    </div>
  )
}
