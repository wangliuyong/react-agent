import type { ComponentType } from 'react'
import { Player } from '@remotion/player'
import type { RemotionTemplatePlayerConfig } from '../../templates/template-preview-registry'
import styles from './RemotionTemplatePlayer.module.css'

interface RemotionTemplatePlayerProps {
  config: RemotionTemplatePlayerConfig
}

/**
 * 模板预览播放器：仅负责 Remotion Player 展示，不拉取远端数据。
 */
export function RemotionTemplatePlayer({ config }: RemotionTemplatePlayerProps): React.ReactElement {
  const { component: Component, durationInFrames, fps, width, height, defaultProps, label } =
    config

  return (
    <div className={styles.wrap}>
      <div className={styles.meta}>
        <span className={styles.metaLabel}>{label}</span>
        <span className={styles.metaSpec}>
          {width}×{height} · {fps}fps · {Math.round(durationInFrames / fps)}s
        </span>
      </div>
      <div
        className={styles.stage}
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        <Player
          component={Component as unknown as ComponentType<Record<string, unknown>>}
          inputProps={defaultProps}
          durationInFrames={durationInFrames}
          fps={fps}
          compositionWidth={width}
          compositionHeight={height}
          style={{ width: '100%', height: '100%' }}
          controls
          loop
          acknowledgeRemotionLicense
        />
      </div>
    </div>
  )
}
