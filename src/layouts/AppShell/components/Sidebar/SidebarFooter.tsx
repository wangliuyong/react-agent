import type { AppView } from '@/stores/app-store'
import { SidebarCollapseToggle } from './SidebarCollapseToggle'
import styles from './Sidebar.module.css'

interface SidebarFooterProps {
  activeView: AppView
  collapsed?: boolean
  onNavigate: (view: AppView) => void
  onToggleCollapse: () => void
}

/** 侧边栏底部：设置、退出、折叠切换（固定 DOM，折叠时纵向排布） */
export function SidebarFooter({
  activeView,
  collapsed = false,
  onNavigate,
  onToggleCollapse
}: SidebarFooterProps): React.ReactElement {
  return (
    <div className={styles.sidebarFooter} data-collapsed={collapsed || undefined}>
      <div className={styles.footerActions}>
        {collapsed ? (
          <Tooltip title="设置" placement="right" mouseEnterDelay={0.35}>
            <Button
              type="text"
              className={styles.footerIconBtn}
              icon={<SettingOutlined />}
              data-active={activeView === 'settings'}
              aria-label="设置"
              onClick={() => onNavigate('settings')}
            />
          </Tooltip>
        ) : (
          <Button
            type="text"
            icon={<SettingOutlined />}
            data-active={activeView === 'settings'}
            aria-label="设置"
            onClick={() => onNavigate('settings')}
          />
        )}
        {collapsed ? (
          <Tooltip title="退出" placement="right" mouseEnterDelay={0.35}>
            <Button
              type="text"
              className={styles.footerIconBtn}
              icon={<LogoutOutlined />}
              aria-label="退出"
              disabled
            />
          </Tooltip>
        ) : (
          <Button type="text" icon={<LogoutOutlined />} aria-label="退出" disabled />
        )}
      </div>
      <div className={styles.collapseToggleWrap}>
        <SidebarCollapseToggle collapsed={collapsed} onToggle={onToggleCollapse} />
      </div>
    </div>
  )
}
