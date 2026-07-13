import { LogoutOutlined, SettingOutlined } from '@ant-design/icons'
import { Button, Tooltip } from 'antd'
import type { AppView } from '@/stores/app-store'
import { SidebarCollapseToggle } from './SidebarCollapseToggle'
import styles from './Sidebar.module.css'

interface SidebarFooterProps {
  activeView: AppView
  collapsed?: boolean
  onNavigate: (view: AppView) => void
  onToggleCollapse: () => void
}

/** 侧边栏底部：设置、退出、折叠切换 */
export function SidebarFooter({
  activeView,
  collapsed = false,
  onNavigate,
  onToggleCollapse
}: SidebarFooterProps): React.ReactElement {
  const collapseToggle = (
    <SidebarCollapseToggle collapsed={collapsed} onToggle={onToggleCollapse} />
  )

  if (collapsed) {
    return (
      <div className={styles.collapsedFooter}>
        <Tooltip title="设置" placement="right">
          <Button
            type="text"
            className={styles.collapsedIconBtn}
            icon={<SettingOutlined />}
            data-active={activeView === 'settings'}
            onClick={() => onNavigate('settings')}
          />
        </Tooltip>
        <Tooltip title="退出" placement="right">
          <Button
            type="text"
            className={styles.collapsedIconBtn}
            icon={<LogoutOutlined />}
            disabled
          />
        </Tooltip>
        {collapseToggle}
      </div>
    )
  }

  return (
    <div className={styles.sidebarFooter}>
      <Tooltip title="设置">
        <Button type="text" icon={<SettingOutlined />} onClick={() => onNavigate('settings')} />
      </Tooltip>
      <Tooltip title="退出">
        <Button type="text" icon={<LogoutOutlined />} disabled />
      </Tooltip>
      <div className={styles.collapseToggleWrap}>{collapseToggle}</div>
    </div>
  )
}
