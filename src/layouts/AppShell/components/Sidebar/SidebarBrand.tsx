import lingxiAvatar from '@/assets/lingxi-avatar.png'
import styles from './Sidebar.module.css'

interface SidebarBrandProps {
  /** 折叠态仅展示图标，展开态展示完整品牌名 */
  collapsed?: boolean
}

/** 品牌 Logo 展示，无业务逻辑 */
export function SidebarBrand({ collapsed = false }: SidebarBrandProps): React.ReactElement {
  const icon = (
    <img
      className={styles.brandIcon}
      src={lingxiAvatar}
      alt="灵犀"
      width={32}
      height={32}
      draggable={false}
    />
  )

  if (collapsed) {
    return (
      <Tooltip title="灵犀" placement="right">
        {icon}
      </Tooltip>
    )
  }

  return (
    <div className={styles.brand}>
      {icon}
      <span className={styles.brandName}>灵犀</span>
    </div>
  )
}
