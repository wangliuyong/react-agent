import styles from './Sidebar.module.css'

/** 侧边栏菜单项通用结构：灵犀助手与业务系统共用同一组件，由外部传入不同配置 */
export interface SidebarMenuItem<T extends string = string> {
  key: T
  label: string
  icon: React.ReactNode
}

interface SidebarMenuProps<T extends string> {
  items: SidebarMenuItem<T>[]
  activeKey: T
  /** 折叠态：文案淡出，仅保留图标（同一 DOM，避免宽度动画时换行） */
  collapsed?: boolean
  ariaLabel: string
  onSelect: (key: T) => void
}

/**
 * 侧边栏通用菜单列表。
 * 固定 navItem 结构，折叠时由 CSS 裁剪/淡出 label，不切换为另一套按钮 DOM。
 */
export function SidebarMenu<T extends string>({
  items,
  activeKey,
  collapsed = false,
  ariaLabel,
  onSelect
}: SidebarMenuProps<T>): React.ReactElement {
  return (
    <nav className={styles.nav} aria-label={ariaLabel} data-collapsed={collapsed || undefined}>
      {items.map((item) => {
        const button = (
          <button
            type="button"
            className={styles.navItem}
            data-active={activeKey === item.key}
            aria-label={item.label}
            onClick={() => onSelect(item.key)}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.sidebarLabel}>{item.label}</span>
          </button>
        )

        if (!collapsed) return <Fragment key={item.key}>{button}</Fragment>

        return (
          <Tooltip key={item.key} title={item.label} placement="right" mouseEnterDelay={0.35}>
            {button}
          </Tooltip>
        )
      })}
    </nav>
  )
}
