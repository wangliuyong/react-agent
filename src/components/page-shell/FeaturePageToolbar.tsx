import type { ReactNode } from 'react'
import styles from './page-shell.module.css'

export interface FeaturePageToolbarProps {
  children: ReactNode
  className?: string
}

/** 筛选 / Segmented 工具栏，子元素自行组合；右侧区可用 shellStyles.toolbarRight */
export function FeaturePageToolbar({
  children,
  className
}: FeaturePageToolbarProps): React.ReactElement {
  return (
    <div className={[styles.toolbar, className].filter(Boolean).join(' ')}>{children}</div>
  )
}
