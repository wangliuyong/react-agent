import type { ReactNode } from 'react'
import styles from './page-shell.module.css'

export interface FeatureScrollBodyProps {
  children: ReactNode
  /** 去掉左右内边距（画布等全宽内容） */
  flush?: boolean
  /** 锁定外层滚动，由内部面板自行滚动 */
  locked?: boolean
  className?: string
}

/**
 * 功能页可滚动主体。
 * 内边距放在内层，避免 Chromium 下 flex 滚动容器 padding-bottom 被裁切。
 */
export function FeatureScrollBody({
  children,
  flush = false,
  locked = false,
  className
}: FeatureScrollBodyProps): React.ReactElement {
  const bodyClass = [
    styles.body,
    flush ? styles.bodyFlush : '',
    locked ? styles.bodyLocked : '',
    className
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={bodyClass}>
      <div className={styles.bodyInner}>{children}</div>
    </div>
  )
}
