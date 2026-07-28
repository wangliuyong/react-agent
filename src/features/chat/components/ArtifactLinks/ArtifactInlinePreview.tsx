/**
 * 产物条目内联预览：图片缩略图、音视频控件、文本摘要。
 * 与画廊/播放器互补——覆盖「仅出现在产物列表」的路径。
 */
import { Image, Spin } from 'antd'
import { useEffect, useState } from 'react'
import {
  queryAgentAssetTextPreview,
  queryLocalImageDataUrl,
  queryLocalMediaUrl
} from '../../api'
import { queryAttachmentExt } from '../../utils/queryAttachmentKind'
import styles from './ArtifactInlinePreview.module.css'

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.svg'])
const VIDEO_EXT = new Set(['.mp4', '.mov', '.webm', '.mkv'])
const AUDIO_EXT = new Set(['.wav', '.mp3', '.m4a', '.aac', '.ogg'])
const TEXT_EXT = new Set([
  '.md',
  '.txt',
  '.json',
  '.csv',
  '.yaml',
  '.yml',
  '.xml',
  '.log',
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.css',
  '.html',
  '.htm'
])

type PreviewKind = 'image' | 'video' | 'audio' | 'text' | 'none'

function queryPreviewKind(filePath: string): PreviewKind {
  const ext = queryAttachmentExt(filePath)
  if (IMAGE_EXT.has(ext)) return 'image'
  if (VIDEO_EXT.has(ext)) return 'video'
  if (AUDIO_EXT.has(ext)) return 'audio'
  if (TEXT_EXT.has(ext)) return 'text'
  return 'none'
}

interface ArtifactInlinePreviewProps {
  filePath: string
}

/** 根据扩展名加载并展示产物内联预览 */
export function ArtifactInlinePreview({
  filePath
}: ArtifactInlinePreviewProps): React.ReactElement | null {
  const kind = queryPreviewKind(filePath)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [textContent, setTextContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(kind !== 'none')

  useEffect(() => {
    if (kind === 'none') {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setImageUrl(null)
    setMediaUrl(null)
    setTextContent(null)

    void (async () => {
      if (kind === 'image') {
        const url = await queryLocalImageDataUrl(filePath)
        if (!cancelled) setImageUrl(url)
      } else if (kind === 'video' || kind === 'audio') {
        const url = await queryLocalMediaUrl(filePath)
        if (!cancelled) setMediaUrl(url)
      } else if (kind === 'text') {
        const text = await queryAgentAssetTextPreview(filePath)
        if (!cancelled) setTextContent(text)
      }
      if (!cancelled) setLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [filePath, kind])

  if (kind === 'none') return null

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spin size="small" />
      </div>
    )
  }

  if (kind === 'image' && imageUrl) {
    return (
      <div className={styles.imageWrap}>
        <Image
          src={imageUrl}
          alt="产物预览"
          className={styles.image}
          rootClassName={styles.imageRoot}
          preview={{ mask: '预览' }}
        />
      </div>
    )
  }

  if (kind === 'video' && mediaUrl) {
    return <video controls preload="metadata" className={styles.video} src={mediaUrl} />
  }

  if (kind === 'audio' && mediaUrl) {
    return <audio controls preload="metadata" className={styles.audio} src={mediaUrl} />
  }

  if (kind === 'text' && textContent != null) {
    return <pre className={styles.text}>{textContent}</pre>
  }

  return null
}
