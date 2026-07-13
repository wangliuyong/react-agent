import styles from './TypingIndicator.module.css'

interface TypingIndicatorProps {
  /** 可选说明文字，如「正在思考…」 */
  label?: string
  /** compact 模式用于输入区状态条 */
  compact?: boolean
}

/** 豆包式三点跳动加载指示器 */
export function TypingIndicator({
  label = '正在思考',
  compact = false
}: TypingIndicatorProps): React.ReactElement {
  return (
    <div className={styles.wrap} data-compact={compact}>
      <div className={styles.dots} aria-hidden>
        <span className={styles.dot} />
        <span className={styles.dot} />
        <span className={styles.dot} />
      </div>
      {label ? <span className={styles.label}>{label}</span> : null}
    </div>
  )
}
