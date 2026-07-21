import styles from './Sidebar.module.css'

interface SidebarCollapseToggleProps {
  collapsed: boolean
  onToggle: () => void
}

/** 侧边栏折叠/展开按钮，统一放在底部 */
export function SidebarCollapseToggle({
  collapsed,
  onToggle
}: SidebarCollapseToggleProps): React.ReactElement {
  return (
    <Tooltip
      title={collapsed ? '展开侧边栏' : '收起侧边栏'}
      placement={collapsed ? 'right' : 'top'}
    >
      <Button
        className={`app-no-drag ${collapsed ? styles.footerIconBtn : ''}`}
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={onToggle}
      />
    </Tooltip>
  )
}
