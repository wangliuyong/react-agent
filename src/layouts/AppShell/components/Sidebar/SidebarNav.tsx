import type { AppView } from '@/stores/app-store'
import type { NavItem } from '../../types'
import styles from './Sidebar.module.css'

interface SidebarNavProps {
  items: NavItem[]
  activeView: AppView
  collapsed?: boolean
  onNavigate: (view: AppView) => void
}

/** 主导航列表：展开态带文字，折叠态仅图标 + Tooltip */
export function SidebarNav({
  items,
  activeView,
  collapsed = false,
  onNavigate
}: SidebarNavProps): React.ReactElement {
  if (collapsed) {
    return (
      <nav className={styles.collapsedNav} aria-label="主导航">
        {items.map((item) => (
          <Tooltip key={item.key} title={item.label} placement="right">
            <button
              type="button"
              className={styles.collapsedNavItem}
              data-active={activeView === item.key}
              onClick={() => onNavigate(item.key)}
            >
              {item.icon}
            </button>
          </Tooltip>
        ))}
      </nav>
    )
  }

  return (
    <nav className={styles.nav} aria-label="主导航">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          className={styles.navItem}
          data-active={activeView === item.key}
          onClick={() => onNavigate(item.key)}
        >
          <span className={styles.navIcon}>{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
