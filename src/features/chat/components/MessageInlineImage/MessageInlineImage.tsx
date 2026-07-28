import { Image } from 'antd'
import { queryLocalImageDataUrl } from '../../api'
import { queryNormalizeMarkdownImageSrc } from '../../utils/message-images'
import { ArtifactFileActions } from '../ArtifactFileActions'
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
 * 本地文件额外提供一键打开目录，与底部画廊操作一致。
 */
export function MessageInlineImage({
  src,
  alt = ''
}: MessageInlineImageProps): React.ReactElement {
  // 兼容 `![x](<abs with space>)` 被某些解析器原样传入的情况
  const normalizedSrc = queryNormalizeMarkdownImageSrc(src)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const isLocal = queryIsLocalImagePath(normalizedSrc)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setFailed(false)
    setPreviewUrl(null)

    void (async () => {
      if (isLocal) {
        const dataUrl = await queryLocalImageDataUrl(normalizedSrc)
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
        setPreviewUrl(normalizedSrc)
        setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [normalizedSrc, isLocal])

  if (loading) {
    return (
      <span className={styles.placeholder} aria-busy="true" aria-label="图片加载中">
        <Spin size="small" />
      </span>
    )
  }

  if (failed || !previewUrl) {
    return (
      <span className={styles.fallbackWrap}>
        <span className={styles.fallback} title={normalizedSrc}>
          {alt || '无法预览'}
        </span>
        {isLocal ? (
          <ArtifactFileActions filePath={normalizedSrc} iconOnly className={styles.fileActions} />
        ) : null}
      </span>
    )
  }

  return (
    <span className={styles.inlineWrap}>
      <Image
        src={previewUrl}
        alt={alt || '图片预览'}
        className={styles.thumb}
        rootClassName={styles.thumbRoot}
        preview={{ mask: '预览' }}
        onError={() => setFailed(true)}
      />
      {isLocal ? (
        <ArtifactFileActions filePath={normalizedSrc} iconOnly className={styles.fileActions} />
      ) : null}
    </span>
  )
}
