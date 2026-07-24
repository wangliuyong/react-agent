import type { ChatMessage } from '@shared/types'
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

/** A 股实时分析工具名：其 K 线图在消息列表中提升到正式内容区展示 */
export const ASHARE_REALTIME_ANALYSIS_TOOL = 'query_ashare_realtime_analysis'

/**
 * 从本轮工具结果中汇总应外置展示的 K 线（默认仅 query_ashare_realtime_analysis）。
 * 同一 symbol 后出现的结果覆盖先前的，与工具返回顺序一致。
 */
export function queryHoistedStockChartsFromTools(
  tools: Pick<ChatMessage, 'content' | 'toolName'>[]
): { charts: StockChartPayload[]; liveRefresh: boolean } {
  const bySymbol = new Map<string, StockChartPayload>()
  let liveRefresh = false

  for (const tool of tools) {
    if (tool.toolName !== ASHARE_REALTIME_ANALYSIS_TOOL) continue
    if (queryStockLiveRefresh(tool.content)) liveRefresh = true
    for (const chart of extractStockCharts(tool.content)) {
      bySymbol.set(chart.symbol, chart)
    }
  }

  return { charts: [...bySymbol.values()], liveRefresh }
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
