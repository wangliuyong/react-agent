import {
  queryDecodeWorkflowCtxMessage,
  stripMediaPathsFromDisplayText,
  extractMessageMedia
} from './message-media'
import { extractMessageHtml, stripOrphanedPathLabels, stripEmptyCodeFences } from './message-html'
import {
  queryExtractStockCharts,
  queryExtractStockChartEnvelope,
  stripStockChartBlock,
  type StockChartPayload
} from '@shared/stock-chart'

export type { StockChartPayload }

/**
 * 从聊天消息正文提取 K 线载荷（先解码 workflow_ctx，再解析 @@stock_chart@@）。
 */
export function extractStockCharts(content: string): StockChartPayload[] {
  const decoded = queryDecodeWorkflowCtxMessage(content)
  return queryExtractStockCharts(decoded)
}

/** 是否开启聊天内实时刷新 */
export function queryStockLiveRefresh(content: string): boolean {
  const decoded = queryDecodeWorkflowCtxMessage(content)
  const envelope = queryExtractStockChartEnvelope(decoded)
  return envelope?.liveRefresh === true
}

/** 展示用正文：去掉 workflow 前缀、媒体/HTML 路径与 K 线 JSON 块 */
export function queryDisplayContentWithCharts(
  content: string,
  imagePaths: { src: string; kind: string }[] = []
): string {
  const { audio, video } = extractMessageMedia(content)
  const htmlRefs = extractMessageHtml(content)
  let text = stripMediaPathsFromDisplayText(content, audio, video)

  for (const ref of htmlRefs) {
    text = text.split(ref.src).join('').trim()
  }

  text = stripStockChartBlock(text)

  for (const img of imagePaths) {
    if (img.kind === 'local') {
      text = text.split(img.src).join('').trim()
    }
  }
  text = text.replace(/!\[[^\]]*]\([^)]+\)/g, '').trim()
  text = text
    .replace(/(?:文件位置|本地|图片|视频|音频|旁白|成片|HTML|网页|页面|本地路径|保存路径)?路径[：:]\s*/g, '')
    .trim()
  return stripEmptyCodeFences(stripOrphanedPathLabels(text))
}
