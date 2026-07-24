import type { ReactNode } from 'react'
import styles from './page-shell.module.css'

export interface FeaturePageShellProps {
  children: ReactNode
  /** 是否显示角向渐变氛围层，默认开启 */
  atmosphere?: boolean
  className?: string
}

/** 功能页根容器：全高列布局 + 可选背景氛围 */
export function FeaturePageShell({
  children,
  atmosphere = true,
  className
}: FeaturePageShellProps): React.ReactElement {
  return (
    <div
      className={[styles.page, className].filter(Boolean).join(' ')}
      data-atmosphere={atmosphere ? 'true' : 'false'}
    >
      {children}
    </div>
  )
}
