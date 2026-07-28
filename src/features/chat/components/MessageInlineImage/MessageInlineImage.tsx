import { Image } from 'antd'
import { queryLocalImageDataUrl } from '../../api'
import styles from './MessageInlineImage.module.css'

interface MessageInlineImageProps {
  /** 本地绝对路径、http(s) 或 data URL */
  src: string
  alt?: string
}

function queryIsLocalImagePath(src: string): boolean {
  return src.startsWith('/') || /^[A-Za-z]:[\\/]/.test(src)
}

/**
 * Markdown 内联图片：本地路径经 IPC 转 data URL，点击走 Ant Design 大图预览。
 * 用于表格「预览」列与正文 `![]()`，与底部 MessageImageGallery 互补。
 */
export function MessageInlineImage({
  src,
  alt = ''
}: MessageInlineImageProps): React.ReactElement {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const isLocal = queryIsLocalImagePath(src)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setFailed(false)
    setPreviewUrl(null)

    void (async () => {
      if (isLocal) {
        const dataUrl = await queryLocalImageDataUrl(src)
        if (cancelled) return
        if (dataUrl) {
          setPreviewUrl(dataUrl)
        } else {
          setFailed(true)
        }
        setLoading(false)
        return
      }

      // 远程 / data URL 直接交给 <Image>，失败由 onError 兜底
      if (!cancelled) {
        setPreviewUrl(src)
        setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [src, isLocal])

  if (loading) {
    return (
      <span className={styles.placeholder} aria-busy="true" aria-label="图片加载中">
        <Spin size="small" />
      </span>
    )
  }

  if (failed || !previewUrl) {
    return (
      <span className={styles.fallback} title={src}>
        {alt || '无法预览'}
      </span>
    )
  }

  return (
    <Image
      src={previewUrl}
      alt={alt || '图片预览'}
      className={styles.thumb}
      rootClassName={styles.thumbRoot}
      preview={{ mask: '预览' }}
      onError={() => setFailed(true)}
    />
  )
}
