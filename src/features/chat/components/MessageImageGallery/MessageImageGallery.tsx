import { Image } from 'antd'
import { queryLocalImageDataUrl } from '../../api'
import type { MessageImageRef } from '../../utils/message-images'
import { ArtifactFileActions } from '../ArtifactFileActions'
import styles from './MessageImageGallery.module.css'

interface MessageImageGalleryProps {
  images: MessageImageRef[]
}

/**
 * 聊天消息图片画廊：本地路径经 IPC 转 data URL，支持 Ant Design 大图预览。
 */
export function MessageImageGallery({ images }: MessageImageGalleryProps): React.ReactElement | null {
  const [previewMap, setPreviewMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  /** 用 key 串作为依赖，避免父组件每次 render 新建 images 数组导致重复加载 */
  const imageKeys = images.map((img) => img.key).join('\0')

  useEffect(() => {
    if (!images.length) {
      setPreviewMap({})
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setPreviewMap({})

    void (async () => {
      const next: Record<string, string> = {}
      await Promise.all(
        images.map(async (img) => {
          if (img.kind === 'local') {
            const dataUrl = await queryLocalImageDataUrl(img.src)
            if (dataUrl) next[img.key] = dataUrl
            return
          }
          // 远程图在 Electron 内可能因防盗链失败，仍尝试加载
          next[img.key] = img.src
        })
      )
      if (!cancelled) {
        setPreviewMap(next)
        setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 以 imageKeys 稳定依赖
  }, [imageKeys])

  const ready = images.filter((img) => previewMap[img.key])
  if (!ready.length && !loading) return null

  const handleImageError = (key: string): void => {
    setPreviewMap((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  return (
    <div className={styles.gallery}>
      {loading && ready.length === 0 ? (
        <Spin size="small" />
      ) : (
        <Image.PreviewGroup>
          {ready.map((img) => (
            <div key={img.key} className={styles.thumbWrap} title={img.label}>
              <Image
                src={previewMap[img.key]}
                alt={img.label}
                width={200}
                height={200}
                className={styles.thumb}
                rootClassName={styles.thumbRoot}
                onError={() => handleImageError(img.key)}
              />
              <span className={styles.thumbLabel}>{img.label}</span>
              {img.kind === 'local' ? (
                <ArtifactFileActions filePath={img.src} className={styles.fileActions} />
              ) : null}
            </div>
          ))}
        </Image.PreviewGroup>
      )}
    </div>
  )
}
