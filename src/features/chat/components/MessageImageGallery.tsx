import { useEffect, useState } from 'react'
import { Image, Spin } from 'antd'
import { queryLocalImageDataUrl } from '../api'
import type { MessageImageRef } from '../utils/message-images'
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

  useEffect(() => {
    if (!images.length) return

    let cancelled = false
    setLoading(true)

    void (async () => {
      const next: Record<string, string> = {}
      await Promise.all(
        images.map(async (img) => {
          if (img.kind === 'remote') {
            next[img.key] = img.src
            return
          }
          const dataUrl = await queryLocalImageDataUrl(img.src)
          if (dataUrl) next[img.key] = dataUrl
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
  }, [images])

  const ready = images.filter((img) => previewMap[img.key])
  if (!ready.length && !loading) return null

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
                width={112}
                height={112}
                className={styles.thumb}
                rootClassName={styles.thumbRoot}
              />
              <span className={styles.thumbLabel}>{img.label}</span>
            </div>
          ))}
        </Image.PreviewGroup>
      )}
    </div>
  )
}
