import styles from './RemotionTemplatePlayer.module.css'

interface RemotionTemplatePlayerProps {
  /** Studio 预览地址；拼装成功后由主进程返回 */
  studioUrl?: string | null
  /** 拼装状态文案 */
  statusText?: string
  compositionId?: string
  width?: number
  height?: number
  fps?: number
  durationInFrames?: number
  variant?: 'inline' | 'modal'
}

/**
 * 模版预览区：画面在 Remotion Studio 中播放（技能 template 拼装后打开）。
 * 不再内嵌写死的 HotNews Composition。
 */
export function RemotionTemplatePlayer({
  studioUrl,
  statusText,
  compositionId,
  width,
  height,
  fps,
  durationInFrames,
  variant = 'inline'
}: RemotionTemplatePlayerProps): React.ReactElement {
  const handleOpenStudio = (): void => {
    if (!studioUrl) return
    void window.api.postOpenExternal(studioUrl)
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.meta}>
        <span className={styles.metaLabel}>{compositionId ?? 'Composition'}</span>
        {width && height && fps && durationInFrames ? (
          <span className={styles.metaSpec}>
            {width}×{height} · {fps}fps · {Math.round(durationInFrames / fps)}s
          </span>
        ) : null}
      </div>
      <div
        className={`${styles.stage}${variant === 'modal' ? ` ${styles.stageModal}` : ''}`}
        style={width && height ? { aspectRatio: `${width} / ${height}` } : undefined}
      >
        <div className={styles.studioPanel}>
          <p className={styles.studioStatus}>
            {statusText ??
              (studioUrl
                ? '模版已拼装，请在 Remotion Studio 中预览'
                : '尚未拼装模版')}
          </p>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            disabled={!studioUrl}
            onClick={handleOpenStudio}
          >
            打开 Studio 预览
          </Button>
          {studioUrl ? (
            <Typography.Text type="secondary" copyable className={styles.studioUrl}>
              {studioUrl}
            </Typography.Text>
          ) : null}
        </div>
      </div>
    </div>
  )
}
