import lingxiAvatar from '@/assets/lingxi-avatar-sm.webp'
import styles from './Sidebar.module.css'

interface SidebarBrandProps {
  collapsed?: boolean
}

/** 品牌 Logo：图标与文案同一 DOM，折叠时淡出品牌名 */
export function SidebarBrand({ collapsed = false }: SidebarBrandProps): React.ReactElement {
  const brand = (
    <div className={styles.brand} data-collapsed={collapsed || undefined}>
      <img
        className={styles.brandIcon}
        src={lingxiAvatar}
        alt="灵犀"
        width={32}
        height={32}
        draggable={false}
      />
      <span className={`${styles.brandName} ${styles.sidebarLabel}`}>灵犀</span>
    </div>
  )

  if (!collapsed) return brand

  return (
    <Tooltip title="灵犀" placement="right" mouseEnterDelay={0.35}>
      {brand}
    </Tooltip>
  )
}
