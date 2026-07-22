import { queryLocalMediaUrl } from '../../api'
import type { MessageHtmlRef } from '../../utils/message-html'
import { ArtifactPathMeta } from '../ArtifactPathMeta'
import styles from './MessageHtmlPreview.module.css'

interface MessageHtmlPreviewProps {
  items: MessageHtmlRef[]
}

/**
 * 聊天消息 HTML 预览：iframe 内嵌展示，支持在系统浏览器中打开与定位文件。
 */
export function MessageHtmlPreview({ items }: MessageHtmlPreviewProps): React.ReactElement | null {
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

  if (items.length === 0) return null

  return (
    <div className={styles.gallery}>
      {items.map((item) => (
        <div key={item.key} className={styles.item}>
          <div className={styles.header}>
            {/* <FileTextOutlined className={styles.fileIcon} /> */}
            <ArtifactPathMeta filePath={item.src} showBrowserOpen className={styles.meta} />
          </div>
          {urlMap[item.key] ? (
            <iframe
              className={styles.frame}
              title={item.label}
              src={urlMap[item.key]}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          ) : (
            <div className={styles.framePlaceholder}>
              {loading ? <Spin size="small" /> : <span className={styles.frameHint}>无法加载预览</span>}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
