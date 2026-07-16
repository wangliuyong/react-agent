import styles from './Sidebar.module.css'

/** 侧边栏菜单项通用结构：灵犀助手与业务系统共用同一组件，由外部传入不同配置 */
export interface SidebarMenuItem<T extends string = string> {
  /** 菜单项唯一标识，与选中态、点击回调对齐 */
  key: T
  label: string
  icon: React.ReactNode
}

interface SidebarMenuProps<T extends string> {
  /** 菜单配置项 */
  items: SidebarMenuItem<T>[]
  /** 当前选中项 key */
  activeKey: T
  /** 折叠态：仅图标 + Tooltip */
  collapsed?: boolean
  /** 无障碍：nav 区域名称（灵犀助手 / 业务系统文案不同） */
  ariaLabel: string
  onSelect: (key: T) => void
}

/**
 * 侧边栏通用菜单列表。
 * 灵犀助手传入 NAV_ITEMS + AppView 导航；业务系统传入 BUSINESS_MENUS + 菜单 key 切换。
 */
export function SidebarMenu<T extends string>({
  items,
  activeKey,
  collapsed = false,
  ariaLabel,
  onSelect
}: SidebarMenuProps<T>): React.ReactElement {
  if (collapsed) {
    return (
      <nav className={styles.collapsedNav} aria-label={ariaLabel}>
        {items.map((item) => (
          <Tooltip key={item.key} title={item.label} placement="right">
            <button
              type="button"
              className={styles.collapsedNavItem}
              data-active={activeKey === item.key}
              onClick={() => onSelect(item.key)}
            >
              {item.icon}
            </button>
          </Tooltip>
        ))}
      </nav>
    )
  }

  return (
    <nav className={styles.nav} aria-label={ariaLabel}>
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          className={styles.navItem}
          data-active={activeKey === item.key}
          onClick={() => onSelect(item.key)}
        >
          <span className={styles.navIcon}>{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
