import type { ChatMessage } from '@shared/types'
import { LazyChatMarkdown } from '../LazyChatMarkdown'
import { MessageImageGallery } from '../MessageImageGallery'
import { MessageAudioPlayer } from '../MessageAudioPlayer'
import { MessageVideoPlayer } from '../MessageVideoPlayer'
import { MessageHtmlPreview } from '../MessageHtmlPreview'
import { ArtifactLinks } from '../ArtifactLinks'
import {
  extractMessageImages,
  type MessageImageRef
} from '../../utils/message-images'
import { extractMessageMedia } from '../../utils/message-media'
import { extractMessageHtml } from '../../utils/message-html'
import {
  extractStockCharts,
  queryDisplayContentWithCharts,
  queryStockLiveRefresh
} from '../../utils/message-charts'
import { LazyMessageKlineChart } from '../LazyMessageKlineChart'
import styles from './MessageRichContent.module.css'

interface MessageRichContentProps {
  content: string
  attachmentPaths?: string[]
  streaming?: boolean
  markdownClassName?: string
  showDoneAlert?: boolean
  /** 为 false 时不渲染 K 线（由消息列表在正式内容区外置展示） */
  showStockCharts?: boolean
}

/**
 * 消息富媒体展示：Markdown + 图片画廊 + 音频/视频/HTML 预览 + 产物链接。
 */
export function MessageRichContent({
  content,
  attachmentPaths,
  streaming = false,
  markdownClassName,
  showDoneAlert = true,
  showStockCharts = true
}: MessageRichContentProps): React.ReactElement {
  const images = extractMessageImages(content, attachmentPaths)
  const { audio, video } = extractMessageMedia(content)
  const htmlItems = extractMessageHtml(content)
  const stockCharts = showStockCharts ? extractStockCharts(content) : []
  const stockLiveRefresh = showStockCharts ? queryStockLiveRefresh(content) : false
  const displayText = queryDisplayContentWithCharts(content, images)

  const previewPaths = [
    ...images.filter((i) => i.kind === 'local').map((i) => i.src),
    ...audio.map((a) => a.src),
    ...video.map((v) => v.src),
    ...htmlItems.map((h) => h.src)
  ]

  return (
    <>
      {displayText ? (
        <LazyChatMarkdown source={displayText} streaming={streaming} className={markdownClassName} />
      ) : streaming ? (
        <span className={styles.cursor} />
      ) : null}
      <LazyMessageKlineChart charts={stockCharts} liveRefresh={stockLiveRefresh} />
      <MessageImageGallery images={images} />
      <MessageAudioPlayer items={audio} />
      <MessageVideoPlayer items={video} />
      <MessageHtmlPreview items={htmlItems} />
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
  const htmlItems = extractMessageHtml(content)
  const stockCharts = extractStockCharts(content)
  const parts: string[] = []
  if (stockCharts.length) parts.push(`${stockCharts.length} 只K线`)
  if (images.length) parts.push(`${images.length} 张图`)
  if (audio.length) parts.push(`${audio.length} 段音频`)
  if (video.length) parts.push(`${video.length} 个视频`)
  if (htmlItems.length) parts.push(`${htmlItems.length} 个网页`)
  return parts.length ? ` · ${parts.join(' · ')}` : ''
}

export type { MessageImageRef }
