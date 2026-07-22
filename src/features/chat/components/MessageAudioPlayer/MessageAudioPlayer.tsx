import { queryLocalMediaUrl } from '../../api'
import type { MessageMediaRef } from '../../utils/message-media'
import { ArtifactFileActions } from '../ArtifactFileActions'
import styles from './MessageAudioPlayer.module.css'

interface MessageAudioPlayerProps {
  items: MessageMediaRef[]
}

/**
 * 聊天消息音频播放器：本地路径经 IPC 转为 media:// URL。
 */
export function MessageAudioPlayer({ items }: MessageAudioPlayerProps): React.ReactElement | null {
  const [urlMap, setUrlMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
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
    <div className={styles.gallery}>
      {loading && ready.length === 0 ? <Spin size="small" /> : null}
      {ready.map((item) => (
        <div key={item.key} className={styles.item} title={item.label}>
          <audio controls preload="metadata" className={styles.player} src={urlMap[item.key]} />
          <span className={styles.label}>{item.label}</span>
          <ArtifactFileActions filePath={item.src} />
        </div>
      ))}
    </div>
  )
}
