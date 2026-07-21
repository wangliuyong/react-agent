/** K 线单根数据（OHLC + 成交量） */
export interface StockKlineBar {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

/** 单只股票 K 线载荷，供工具返回与聊天预览共用 */
export interface StockChartPayload {
  symbol: string
  name: string
  period: StockKlinePeriod
  bars: StockKlineBar[]
}

export type StockKlinePeriod = 'daily' | 'weekly' | 'monthly'

/** 工具消息内嵌 K 线 JSON 块前缀，与 @@workflow_ctx@@ 类似 */
export const STOCK_CHART_PREFIX = '@@stock_chart@@'

export interface StockChartEnvelope {
  charts: StockChartPayload[]
}

/** 构建嵌入消息的 K 线块（不含换行，避免破坏 Markdown） */
export function queryBuildStockChartBlock(charts: StockChartPayload[]): string {
  const payload: StockChartEnvelope = { charts }
  return `${STOCK_CHART_PREFIX}${JSON.stringify(payload)}`
}

/** 从已解码的正文中提取 K 线载荷 */
export function queryExtractStockCharts(content: string): StockChartPayload[] {
  const idx = content.indexOf(STOCK_CHART_PREFIX)
  if (idx < 0) return []
  const jsonText = content.slice(idx + STOCK_CHART_PREFIX.length).trim()
  try {
    const parsed = JSON.parse(jsonText) as StockChartEnvelope
    if (!Array.isArray(parsed.charts)) return []
    return parsed.charts.filter(
      (c) =>
        c &&
        typeof c.symbol === 'string' &&
        Array.isArray(c.bars) &&
        c.bars.length > 0
    )
  } catch {
    return []
  }
}

/** 展示用：去掉 K 线嵌入块，避免 Markdown 露出原始 JSON */
export function stripStockChartBlock(content: string): string {
  const idx = content.indexOf(STOCK_CHART_PREFIX)
  if (idx < 0) return content
  return content.slice(0, idx).trimEnd()
}
