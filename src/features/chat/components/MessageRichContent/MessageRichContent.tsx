import type { ChatMessage } from '@shared/types'
import { ChatMarkdown } from '../ChatMarkdown'
import { MessageImageGallery } from '../MessageImageGallery'
import { MessageAudioPlayer } from '../MessageAudioPlayer'
import { MessageVideoPlayer } from '../MessageVideoPlayer'
import { ArtifactLinks } from '../ArtifactLinks'
import {
  extractMessageImages,
  type MessageImageRef
} from '../../utils/message-images'
import { extractMessageMedia } from '../../utils/message-media'
import {
  extractStockCharts,
  queryDisplayContentWithCharts
} from '../../utils/message-charts'
import { MessageKlineChart } from '../MessageKlineChart/MessageKlineChart'
import styles from './MessageRichContent.module.css'

interface MessageRichContentProps {
  content: string
  attachmentPaths?: string[]
  streaming?: boolean
  markdownClassName?: string
  showDoneAlert?: boolean
}

/**
 * 消息富媒体展示：Markdown + 图片画廊 + 音频/视频播放器 + 产物链接。
 */
export function MessageRichContent({
  content,
  attachmentPaths,
  streaming = false,
  markdownClassName,
  showDoneAlert = true
}: MessageRichContentProps): React.ReactElement {
  const images = extractMessageImages(content, attachmentPaths)
  const { audio, video } = extractMessageMedia(content)
  const stockCharts = extractStockCharts(content)
  const displayText = queryDisplayContentWithCharts(content, images)

  const previewPaths = [
    ...images.filter((i) => i.kind === 'local').map((i) => i.src),
    ...audio.map((a) => a.src),
    ...video.map((v) => v.src)
  ]

  return (
    <>
      {displayText ? (
        <ChatMarkdown source={displayText} streaming={streaming} className={markdownClassName} />
      ) : streaming ? (
        <span className={styles.cursor} />
      ) : null}
      <MessageKlineChart charts={stockCharts} />
      <MessageImageGallery images={images} />
      <MessageAudioPlayer items={audio} />
      <MessageVideoPlayer items={video} />
      <ArtifactLinks content={content} excludePaths={previewPaths} />
      {showDoneAlert && /执行完毕/.test(content) ? (
        <Alert type="success" showIcon message="执行完毕" className={styles.doneAlert} />
      ) : null}
    </>
  )
}

/** 工具折叠标题中的媒体计数摘要 */
export function queryMediaCountLabel(content: string, attachmentPaths?: string[]): string {
  const images = extractMessageImages(content, attachmentPaths)
  const { audio, video } = extractMessageMedia(content)
  const stockCharts = extractStockCharts(content)
  const parts: string[] = []
  if (stockCharts.length) parts.push(`${stockCharts.length} 只K线`)
  if (images.length) parts.push(`${images.length} 张图`)
  if (audio.length) parts.push(`${audio.length} 段音频`)
  if (video.length) parts.push(`${video.length} 个视频`)
  return parts.length ? ` · ${parts.join(' · ')}` : ''
}

export type { MessageImageRef }
