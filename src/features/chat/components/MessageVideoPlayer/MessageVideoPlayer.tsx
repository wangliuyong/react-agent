import { queryLocalMediaUrl } from '../../api'
import type { MessageMediaRef } from '../../utils/message-media'
import { ArtifactFileActions } from '../ArtifactFileActions'
import {
  queryIsRemotionSessionVideoPath,
  SaveRemotionTemplateModal
} from './SaveRemotionTemplateModal'
import styles from './MessageVideoPlayer.module.css'

interface MessageVideoPlayerProps {
  items: MessageMediaRef[]
  /** 当前聊天会话 id，用于「存为模板」 */
  sessionId?: string | null
}

/**
 * 聊天消息视频播放器：本地路径经 IPC 转为 media:// URL，支持 seek。
 */
export function MessageVideoPlayer({
  items,
  sessionId = null
}: MessageVideoPlayerProps): React.ReactElement | null {
  const [urlMap, setUrlMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [savePath, setSavePath] = useState<string | null>(null)
  const itemKeys = items.map((item) => item.key).join('\0')

  useEffect(() => {
    if (!items.length) {
      setUrlMap({})
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setUrlMap({})

    void (async () => {
      const next: Record<string, string> = {}
      await Promise.all(
        items.map(async (item) => {
          const url = await queryLocalMediaUrl(item.src)
          if (url) next[item.key] = url
        })
      )
      if (!cancelled) {
        setUrlMap(next)
        setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 以 itemKeys 稳定依赖
  }, [itemKeys])

  const ready = items.filter((item) => urlMap[item.key])
  if (!ready.length && !loading) return null

  return (
    <>
      <div className={styles.gallery}>
        {loading && ready.length === 0 ? <Spin size="small" /> : null}
        {ready.map((item) => {
          const canSave = Boolean(sessionId) && queryIsRemotionSessionVideoPath(item.src)
          return (
            <div key={item.key} className={styles.item} title={item.label}>
              <video
                controls
                preload="metadata"
                className={styles.player}
                src={urlMap[item.key]}
              />
              <span className={styles.label}>{item.label}</span>
              <ArtifactFileActions filePath={item.src} />
              {canSave ? (
                <Button
                  type="link"
                  size="small"
                  className={styles.saveBtn}
                  onClick={() => setSavePath(item.src)}
                >
                  存为 Remotion 模板
                </Button>
              ) : null}
            </div>
          )
        })}
      </div>
      <SaveRemotionTemplateModal
        open={savePath != null}
        sessionId={sessionId}
        videoPath={savePath ?? ''}
        defaultName="会话成片模板"
        onClose={() => setSavePath(null)}
      />
    </>
  )
}
