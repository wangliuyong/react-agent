import type { BusinessMenuItem, BusinessMenuKey } from '@/features/business'
import styles from './Sidebar.module.css'

interface SidebarBusinessNavProps {
  items: BusinessMenuItem[]
  activeMenu: BusinessMenuKey
  collapsed?: boolean
  onSelect: (key: BusinessMenuKey) => void
}

/** 业务系统侧边栏菜单：展开态带文案，折叠态仅图标 + Tooltip */
export function SidebarBusinessNav({
  items,
  activeMenu,
  collapsed = false,
  onSelect
}: SidebarBusinessNavProps): React.ReactElement {
  if (collapsed) {
    return (
      <nav className={styles.collapsedNav} aria-label="业务系统菜单">
        {items.map((item) => (
          <Tooltip key={item.key} title={item.label} placement="right">
            <button
              type="button"
              className={styles.collapsedNavItem}
              data-active={activeMenu === item.key}
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
    <nav className={styles.nav} aria-label="业务系统菜单">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          className={styles.navItem}
          data-active={activeMenu === item.key}
          onClick={() => onSelect(item.key)}
        >
          <span className={styles.navIcon}>{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
