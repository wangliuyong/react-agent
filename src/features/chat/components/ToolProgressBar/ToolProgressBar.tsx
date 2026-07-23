import type { ToolProgressPayload } from '@shared/types'
import styles from './ToolProgressBar.module.css'

interface ToolProgressBarProps {
  /** 工具展示名，如「渲染 Remotion 视频」 */
  label: string
  progress: ToolProgressPayload
  /** 紧凑模式：用于输入区状态条 */
  compact?: boolean
}

/** Remotion 各阶段 → 用户可读短标签 */
const PHASE_LABELS: Record<string, string> = {
  browser: '准备浏览器',
  bundle: '打包工程',
  render: '渲染成片'
}

/**
 * 长耗时工具进度条（Remotion 渲染等）。
 * 胶片条纹 + 渐变进度，与聊天区主色 token 对齐。
 */
export function ToolProgressBar({
  label,
  progress,
  compact = false
}: ToolProgressBarProps): React.ReactElement {
  const phaseLabel = PHASE_LABELS[progress.phase] ?? progress.phase
  const detail = progress.message?.trim() || phaseLabel
  const clamped = Math.max(0, Math.min(100, Math.round(progress.percent)))

  return (
    <div
      className={`${styles.wrap} ${compact ? styles.wrapCompact : ''}`}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${label} ${clamped}%`}
    >
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        <span className={styles.percent}>{clamped}%</span>
      </div>
      <div className={styles.track}>
        <div className={styles.trackGrain} aria-hidden />
        <div className={styles.fill} style={{ width: `${clamped}%` }}>
          <span className={styles.fillGlow} aria-hidden />
        </div>
        <div className={styles.sprockets} aria-hidden>
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i} className={styles.sprocket} />
          ))}
        </div>
      </div>
      <p className={styles.detail}>
        <span className={styles.phaseTag}>{phaseLabel}</span>
        {detail !== phaseLabel ? <span className={styles.detailText}>{detail}</span> : null}
      </p>
    </div>
  )
}
