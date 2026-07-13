import styles from './Sidebar.module.css'

interface SidebarBrandProps {
  /** 折叠态仅展示图标，展开态展示完整品牌名 */
  collapsed?: boolean
}

/** 品牌 Logo 展示，无业务逻辑 */
export function SidebarBrand({ collapsed = false }: SidebarBrandProps): React.ReactElement {
  const icon = <div className={styles.brandIcon}>灵</div>

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
