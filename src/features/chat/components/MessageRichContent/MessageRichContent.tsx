import { LazyChatMarkdown } from '../LazyChatMarkdown'
import { MessageImageGallery } from '../MessageImageGallery'
import { MessageAudioPlayer } from '../MessageAudioPlayer'
import { MessageVideoPlayer } from '../MessageVideoPlayer'
import { MessageHtmlPreview } from '../MessageHtmlPreview'
import { ArtifactLinks } from '../ArtifactLinks'
import {
  extractMessageImages,
  queryInlinedImageSrcs,
  type MessageImageRef
} from '../../utils/message-images'
import { extractMessageMedia } from '../../utils/message-media'
import { extractMessageHtml } from '../../utils/message-html'
import { queryArtifactPaths } from '../../utils/artifact-paths'
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
  /**
   * 会话内先前出现的本地图路径：仅用于「配图预览」表按「图N」预判填入，
   * 不强制进入底部画廊（避免把整段历史配图都摊开）。
   */
  previewContextPaths?: string[]
  streaming?: boolean
  markdownClassName?: string
  showDoneAlert?: boolean
  /** 为 false 时不渲染 K 线（由消息列表在正式内容区外置展示） */
  showStockCharts?: boolean
}

/**
 * 消息富媒体展示：Markdown（含表格内联图预览）+ 画廊 + 音视频/HTML + 产物链接。
 */
export function MessageRichContent({
  content,
  attachmentPaths,
  previewContextPaths,
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

  // 上下文路径并入嵌入 refs，供「图N」表格预判；画廊仍只用正文/附件图
  const contextRefs: MessageImageRef[] = []
  const seen = new Set(images.map((i) => i.src))
  for (const p of previewContextPaths ?? []) {
    if (!p || seen.has(p)) continue
    seen.add(p)
    contextRefs.push({
      key: p,
      kind: 'local',
      src: p,
      label: p.replace(/\\/g, '/').split('/').pop() || p
    })
  }
  const embedRefs = contextRefs.length ? [...images, ...contextRefs] : images
  const displayText = queryDisplayContentWithCharts(content, embedRefs)
  // 远程内联图不进画廊；本地图始终进底部画廊，保证预览 +「打开文件位置」
  const inlinedSrcs = queryInlinedImageSrcs(displayText)
  const galleryImages = images.filter(
    (img) => img.kind === 'local' || !inlinedSrcs.has(img.src)
  )

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
      <MessageImageGallery images={galleryImages} />
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

/**
 * 工具结果是否含本地落盘文件（图/音视频/HTML/产物路径）。
 * 用于工具折叠面板：有本地文件时默认展开，便于预览与打开目录。
 */
export function queryToolResultHasLocalFiles(
  content: string,
  attachmentPaths?: string[]
): boolean {
  if (extractMessageImages(content, attachmentPaths).some((img) => img.kind === 'local')) {
    return true
  }
  const { audio, video } = extractMessageMedia(content)
  if (audio.length > 0 || video.length > 0) return true
  if (extractMessageHtml(content).length > 0) return true
  return queryArtifactPaths(content).length > 0
}

export type { MessageImageRef }
