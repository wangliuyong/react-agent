import { queryLocalMediaUrl } from '../../api'
import type { MessageMediaRef } from '../../utils/message-media'
import styles from './MessageVideoPlayer.module.css'

interface MessageVideoPlayerProps {
  items: MessageMediaRef[]
}

/**
 * 聊天消息视频播放器：本地路径经 IPC 转为 media:// URL，支持 seek。
 */
export function MessageVideoPlayer({ items }: MessageVideoPlayerProps): React.ReactElement | null {
  const [urlMap, setUrlMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!items.length) return

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
  }, [items])

  const ready = items.filter((item) => urlMap[item.key])
  if (!ready.length && !loading) return null

  return (
    <div className={styles.gallery}>
      {loading && ready.length === 0 ? <Spin size="small" /> : null}
      {ready.map((item) => (
        <div key={item.key} className={styles.item} title={item.label}>
          <video
            controls
            preload="metadata"
            className={styles.player}
            src={urlMap[item.key]}
          />
          <span className={styles.label}>{item.label}</span>
        </div>
      ))}
    </div>
  )
}
