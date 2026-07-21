/** K 线单根数据（OHLC + 成交量） */
export interface StockKlineBar {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

/** K 线时间范围：当天（分时/5分钟）、本周、本月、自定义日期 */
export type StockKlineRange = 'today' | 'week' | 'month' | 'custom'

/** 兼容旧版周期字段 */
export type StockKlinePeriod = 'daily' | 'weekly' | 'monthly' | 'intraday'

/** 买卖信号类型 */
export type StockSignalType = 'buy' | 'sell' | 'hold'

/** 图表上的买卖点标记 */
export interface StockTradeSignal {
  type: 'buy' | 'sell'
  date: string
  price: number
  reason: string
}

/** 涨跌预测结果（规则引擎，非投资建议） */
export interface StockPricePrediction {
  direction: 'up' | 'down' | 'sideways'
  confidence: number
  horizon: string
  targetPrice?: number
  stopLoss?: number
  changePctEstimate?: number
}

/** 技术指标快照 */
export interface StockIndicatorSnapshot {
  ma5?: number
  ma10?: number
  ma20?: number
  rsi14?: number
  macdDif?: number
  macdDea?: number
  macdHist?: number
}

/** 单只股票综合分析 */
export interface StockAnalysisResult {
  symbol: string
  name: string
  trend: 'bullish' | 'bearish' | 'neutral'
  overallSignal: StockSignalType
  prediction: StockPricePrediction
  indicators: StockIndicatorSnapshot
  tradeSignals: StockTradeSignal[]
  summary: string
}

/** 实时行情快照 */
export interface StockLiveQuote {
  price: number
  changePct: number
  changeAmount: number
  high: number
  low: number
  open: number
  updatedAt: number
}

/** 单只股票 K 线载荷，供工具返回与聊天预览共用 */
export interface StockChartPayload {
  symbol: string
  name: string
  /** 当前展示范围 */
  range: StockKlineRange
  /** 兼容旧字段 */
  period?: StockKlinePeriod
  bars: StockKlineBar[]
  startDate?: string
  endDate?: string
  /** 预加载多范围数据，供聊天内切换今天/本周/本月 */
  rangeBars?: Partial<Record<StockKlineRange, StockKlineBar[]>>
  analysis?: StockAnalysisResult
  quote?: StockLiveQuote
}

/** 工具消息内嵌 K 线 JSON 块前缀 */
export const STOCK_CHART_PREFIX = '@@stock_chart@@'

export interface StockChartEnvelope {
  charts: StockChartPayload[]
  /** 是否开启聊天内实时刷新（当天分时） */
  liveRefresh?: boolean
}

export const STOCK_RANGE_LABELS: Record<StockKlineRange, string> = {
  today: '当天',
  week: '本周',
  month: '本月',
  custom: '自定义'
}

/** 构建嵌入消息的 K 线块 */
export function queryBuildStockChartBlock(
  charts: StockChartPayload[],
  options?: { liveRefresh?: boolean }
): string {
  const payload: StockChartEnvelope = {
    charts,
    liveRefresh: options?.liveRefresh
  }
  return `${STOCK_CHART_PREFIX}${JSON.stringify(payload)}`
}

/** 从已解码的正文中提取完整 K 线信封 */
export function queryExtractStockChartEnvelope(content: string): StockChartEnvelope | null {
  const idx = content.indexOf(STOCK_CHART_PREFIX)
  if (idx < 0) return null
  const jsonText = content.slice(idx + STOCK_CHART_PREFIX.length).trim()
  try {
    const parsed = JSON.parse(jsonText) as StockChartEnvelope
    if (!Array.isArray(parsed.charts)) return null
    return parsed
  } catch {
    return null
  }
}

/** 从已解码的正文中提取 K 线载荷 */
export function queryExtractStockCharts(content: string): StockChartPayload[] {
  const envelope = queryExtractStockChartEnvelope(content)
  if (!envelope) return []
  return envelope.charts.filter(
    (c) =>
      c &&
      typeof c.symbol === 'string' &&
      Array.isArray(c.bars) &&
      c.bars.length > 0
  )
}

/** 是否应开启实时刷新 */
export function queryStockChartLiveRefresh(content: string): boolean {
  const envelope = queryExtractStockChartEnvelope(content)
  return envelope?.liveRefresh === true
}

/** 聊天内手动刷新请求（IPC 走 query_ashare_realtime_analysis 同源拉数） */
export interface AshareKlineRefreshRequest {
  symbol: string
  range: StockKlineRange
  startDate?: string
  endDate?: string
  /** 股票名称（兼容旧字段） */
  name?: string
  /** @deprecated 刷新已改为完整重拉，不再使用已有 K 线降级 */
  existingBars?: StockKlineBar[]
}

/** 展示用：去掉 K 线嵌入块 */
export function stripStockChartBlock(content: string): string {
  const idx = content.indexOf(STOCK_CHART_PREFIX)
  if (idx < 0) return content
  return content.slice(0, idx).trimEnd()
}
