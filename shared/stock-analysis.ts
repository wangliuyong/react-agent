import type {
  StockAnalysisResult,
  StockChartPayload,
  StockIndicatorSnapshot,
  StockKlineBar,
  StockLiveQuote,
  StockPricePrediction,
  StockSignalType,
  StockTradeSignal
} from './stock-chart'

/** 简单移动平均 */
function querySma(values: number[], period: number): number[] {
  const out: number[] = []
  for (let i = 0; i < values.length; i++) {
    if (i + 1 < period) {
      out.push(NaN)
      continue
    }
    const slice = values.slice(i + 1 - period, i + 1)
    out.push(slice.reduce((a, b) => a + b, 0) / period)
  }
  return out
}

/** 指数移动平均 */
function queryEma(values: number[], period: number): number[] {
  const out: number[] = []
  const k = 2 / (period + 1)
  for (let i = 0; i < values.length; i++) {
    if (i === 0) {
      out.push(values[0])
      continue
    }
    out.push(values[i] * k + out[i - 1] * (1 - k))
  }
  return out
}

/** RSI(14) */
function queryRsi(closes: number[], period = 14): number[] {
  const out: number[] = new Array(closes.length).fill(NaN)
  if (closes.length <= period) return out

  let gain = 0
  let loss = 0
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1]
    if (diff >= 0) gain += diff
    else loss -= diff
  }
  let avgGain = gain / period
  let avgLoss = loss / period
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    const g = diff > 0 ? diff : 0
    const l = diff < 0 ? -diff : 0
    avgGain = (avgGain * (period - 1) + g) / period
    avgLoss = (avgLoss * (period - 1) + l) / period
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)
  }
  return out
}

/** MACD(12,26,9) */
function queryMacd(closes: number[]): {
  dif: number[]
  dea: number[]
  hist: number[]
} {
  const ema12 = queryEma(closes, 12)
  const ema26 = queryEma(closes, 26)
  const dif = ema12.map((v, i) => v - ema26[i])
  const dea = queryEma(dif, 9)
  const hist = dif.map((v, i) => v - dea[i])
  return { dif, dea, hist }
}

function queryLastValid(values: number[]): number | undefined {
  for (let i = values.length - 1; i >= 0; i--) {
    if (Number.isFinite(values[i])) return values[i]
  }
  return undefined
}

function queryDetectCross(
  fast: number[],
  slow: number[],
  index: number
): 'golden' | 'death' | null {
  if (index < 1) return null
  const prevFast = fast[index - 1]
  const prevSlow = slow[index - 1]
  const curFast = fast[index]
  const curSlow = slow[index]
  if (![prevFast, prevSlow, curFast, curSlow].every(Number.isFinite)) return null
  if (prevFast <= prevSlow && curFast > curSlow) return 'golden'
  if (prevFast >= prevSlow && curFast < curSlow) return 'death'
  return null
}

/** 从 K 线序列提取买卖信号点 */
export function queryExtractTradeSignals(
  bars: StockKlineBar[],
  ma5: number[],
  ma20: number[],
  rsi: number[],
  macdHist: number[]
): StockTradeSignal[] {
  const signals: StockTradeSignal[] = []
  const start = Math.max(20, bars.length - 30)

  for (let i = start; i < bars.length; i++) {
    const bar = bars[i]
    const cross = queryDetectCross(ma5, ma20, i)
    if (cross === 'golden') {
      signals.push({
        type: 'buy',
        date: bar.date,
        price: bar.close,
        reason: 'MA5 上穿 MA20（金叉）'
      })
    } else if (cross === 'death') {
      signals.push({
        type: 'sell',
        date: bar.date,
        price: bar.close,
        reason: 'MA5 下穿 MA20（死叉）'
      })
    }

    const rsiVal = rsi[i]
    const prevRsi = rsi[i - 1]
    if (Number.isFinite(rsiVal) && Number.isFinite(prevRsi)) {
      if (prevRsi < 30 && rsiVal >= 30) {
        signals.push({
          type: 'buy',
          date: bar.date,
          price: bar.close,
          reason: 'RSI 脱离超卖区（<30）'
        })
      } else if (prevRsi > 70 && rsiVal <= 70) {
        signals.push({
          type: 'sell',
          date: bar.date,
          price: bar.close,
          reason: 'RSI 脱离超买区（>70）'
        })
      }
    }

    const hist = macdHist[i]
    const prevHist = macdHist[i - 1]
    if (Number.isFinite(hist) && Number.isFinite(prevHist)) {
      if (prevHist <= 0 && hist > 0) {
        signals.push({
          type: 'buy',
          date: bar.date,
          price: bar.close,
          reason: 'MACD 柱由负转正'
        })
      } else if (prevHist >= 0 && hist < 0) {
        signals.push({
          type: 'sell',
          date: bar.date,
          price: bar.close,
          reason: 'MACD 柱由正转负'
        })
      }
    }
  }

  // 同类型同日期去重，保留最后一条
  const seen = new Set<string>()
  return signals
    .reverse()
    .filter((s) => {
      const key = `${s.type}:${s.date}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .reverse()
    .slice(-8)
}

/** 规则引擎预测短期涨跌（仅供参考，非投资建议） */
export function queryPredictPrice(
  bars: StockKlineBar[],
  indicators: StockIndicatorSnapshot,
  trend: StockAnalysisResult['trend']
): StockPricePrediction {
  const last = bars[bars.length - 1]
  let score = 0

  if (indicators.ma5 != null && indicators.ma20 != null) {
    score += indicators.ma5 > indicators.ma20 ? 1.5 : -1.5
  }
  if (indicators.rsi14 != null) {
    if (indicators.rsi14 < 35) score += 1
    else if (indicators.rsi14 > 65) score -= 1
    else if (indicators.rsi14 > 50) score += 0.3
    else score -= 0.3
  }
  if (indicators.macdHist != null) {
    score += indicators.macdHist > 0 ? 0.8 : -0.8
  }

  const recent = bars.slice(-5)
  const momentum =
    recent.length >= 2
      ? (recent[recent.length - 1].close - recent[0].open) / recent[0].open
      : 0
  score += momentum > 0.02 ? 0.5 : momentum < -0.02 ? -0.5 : 0

  if (trend === 'bullish') score += 0.5
  if (trend === 'bearish') score -= 0.5

  let direction: StockPricePrediction['direction'] = 'sideways'
  if (score >= 1.2) direction = 'up'
  else if (score <= -1.2) direction = 'down'

  const confidence = Math.min(85, Math.max(35, Math.round(50 + Math.abs(score) * 12)))
  const changePctEstimate =
    direction === 'up' ? 1.5 + confidence * 0.03 : direction === 'down' ? -(1.5 + confidence * 0.03) : 0

  const targetPrice =
    direction === 'up'
      ? last.close * (1 + changePctEstimate / 100)
      : direction === 'down'
        ? last.close * (1 + changePctEstimate / 100)
        : last.close

  const lows = bars.slice(-20).map((b) => b.low)
  const stopLoss = direction === 'up' ? Math.min(...lows) : Math.max(...bars.slice(-20).map((b) => b.high))

  return {
    direction,
    confidence,
    horizon: '短期 3～5 个交易日',
    targetPrice: Number(targetPrice.toFixed(2)),
    stopLoss: Number(stopLoss.toFixed(2)),
    changePctEstimate: Number(changePctEstimate.toFixed(2))
  }
}

/** 综合信号打分结果（正偏买、负偏卖，中间带观望） */
export interface StockSignalScore {
  score: number
  overallSignal: StockSignalType
  /** 简要得分理由，写入 summary 供 Agent 引用 */
  reason: string
}

/**
 * 近窗加权打分：近 3 条交易信号 + 趋势 + 预测 + MA 排列。
 * 阈值对称，|score| < 1.2 → hold，避免单条信号轻易翻转。
 */
export function queryScoreOverallSignal(
  tradeSignals: StockTradeSignal[],
  trend: StockAnalysisResult['trend'],
  prediction: StockPricePrediction,
  indicators: StockIndicatorSnapshot
): StockSignalScore {
  let score = 0
  const reasons: string[] = []

  const recent = tradeSignals.slice(-3)
  const weights = [0.5, 0.8, 1.2]
  recent.forEach((sig, i) => {
    const w = weights[weights.length - recent.length + i] ?? 0.5
    if (sig.type === 'buy') {
      score += w
      reasons.push(`近信号买入+${w}`)
    } else {
      score -= w
      reasons.push(`近信号卖出-${w}`)
    }
  })

  if (trend === 'bullish') {
    score += 1
    reasons.push('均线多头+1')
  } else if (trend === 'bearish') {
    score -= 1
    reasons.push('均线空头-1')
  }

  if (prediction.direction === 'up') {
    const w = prediction.confidence >= 55 ? 1.2 : 0.5
    score += w
    reasons.push(`预测看涨+${w}`)
  } else if (prediction.direction === 'down') {
    const w = prediction.confidence >= 55 ? 1.2 : 0.5
    score -= w
    reasons.push(`预测看跌-${w}`)
  }

  if (indicators.ma5 != null && indicators.ma20 != null) {
    if (indicators.ma5 > indicators.ma20) {
      score += 0.4
      reasons.push('MA5>MA20+0.4')
    } else if (indicators.ma5 < indicators.ma20) {
      score -= 0.4
      reasons.push('MA5<MA20-0.4')
    }
  }

  let overallSignal: StockSignalType = 'hold'
  if (score >= 1.2) overallSignal = 'buy'
  else if (score <= -1.2) overallSignal = 'sell'

  const reason =
    reasons.length > 0
      ? `得分 ${score.toFixed(1)} → ${overallSignal}（${reasons.slice(0, 4).join('；')}）`
      : `得分 ${score.toFixed(1)} → hold`

  return { score, overallSignal, reason }
}

function queryBuildSummary(
  chart: Pick<StockChartPayload, 'name' | 'symbol'>,
  trend: StockAnalysisResult['trend'],
  indicators: StockIndicatorSnapshot,
  prediction: StockPricePrediction,
  overallSignal: StockSignalType,
  tradeSignals: StockTradeSignal[],
  scoreReason?: string
): string {
  const trendLabel = { bullish: '偏多', bearish: '偏空', neutral: '震荡' }[trend]
  const signalLabel = { buy: '买入', sell: '卖出', hold: '观望' }[overallSignal]
  const dirLabel = { up: '看涨', down: '看跌', sideways: '横盘' }[prediction.direction]
  const lastSignal = tradeSignals[tradeSignals.length - 1]

  const lines = [
    `【${chart.name}（${chart.symbol}）】`,
    `- 趋势：${trendLabel}；综合信号：**${signalLabel}**`,
    scoreReason ? `- 打分：${scoreReason}` : '',
    `- 预测：${dirLabel}（置信度 ${prediction.confidence}%），${prediction.horizon}`,
    prediction.targetPrice != null
      ? `- 参考目标价 ${prediction.targetPrice}，止损参考 ${prediction.stopLoss}`
      : '',
    indicators.ma5 != null && indicators.ma20 != null
      ? `- 均线：MA5=${indicators.ma5.toFixed(2)}，MA20=${indicators.ma20.toFixed(2)}`
      : '',
    indicators.rsi14 != null ? `- RSI14=${indicators.rsi14.toFixed(1)}` : '',
    lastSignal ? `- 最近信号：${lastSignal.type === 'buy' ? '买入' : '卖出'} @ ${lastSignal.price}（${lastSignal.reason}）` : ''
  ]
  return lines.filter(Boolean).join('\n')
}

/**
 * 对 K 线序列做技术指标与买卖信号分析。
 * 说明：基于规则引擎，仅供流程演示，不构成投资建议。
 */
export function queryAnalyzeStockChart(chart: StockChartPayload): StockAnalysisResult {
  const bars = chart.bars
  const closes = bars.map((b) => b.close)
  const ma5 = querySma(closes, 5)
  const ma10 = querySma(closes, 10)
  const ma20 = querySma(closes, 20)
  const rsi = queryRsi(closes, 14)
  const { dif, dea, hist } = queryMacd(closes)

  const indicators: StockIndicatorSnapshot = {
    ma5: queryLastValid(ma5),
    ma10: queryLastValid(ma10),
    ma20: queryLastValid(ma20),
    rsi14: queryLastValid(rsi),
    macdDif: queryLastValid(dif),
    macdDea: queryLastValid(dea),
    macdHist: queryLastValid(hist)
  }

  let trend: StockAnalysisResult['trend'] = 'neutral'
  if (
    indicators.ma5 != null &&
    indicators.ma10 != null &&
    indicators.ma20 != null &&
    indicators.ma5 > indicators.ma10 &&
    indicators.ma10 > indicators.ma20
  ) {
    trend = 'bullish'
  } else if (
    indicators.ma5 != null &&
    indicators.ma10 != null &&
    indicators.ma20 != null &&
    indicators.ma5 < indicators.ma10 &&
    indicators.ma10 < indicators.ma20
  ) {
    trend = 'bearish'
  }

  const tradeSignals = queryExtractTradeSignals(bars, ma5, ma20, rsi, hist)
  const prediction = queryPredictPrice(bars, indicators, trend)
  const scored = queryScoreOverallSignal(tradeSignals, trend, prediction, indicators)
  const overallSignal = scored.overallSignal

  return {
    symbol: chart.symbol,
    name: chart.name,
    trend,
    overallSignal,
    prediction,
    indicators,
    tradeSignals,
    summary: queryBuildSummary(
      chart,
      trend,
      indicators,
      prediction,
      overallSignal,
      tradeSignals,
      scored.reason
    )
  }
}

/** 格式化多股分析摘要 */
export function queryFormatAnalysisReport(charts: StockChartPayload[]): string {
  return charts
    .map((c) => c.analysis?.summary ?? `${c.name}（${c.symbol}）暂无分析`)
    .join('\n\n')
}

/**
 * 从已分析的 charts 生成流程 context：按 overallSignal 分组，
 * 支持买卖观望多分支同时命中（stockHas* = '1'/'0'）。
 * stockSignal 取多数票，平票优先 hold。
 */
export function queryBuildRealtimeAnalysisContext(
  charts: StockChartPayload[]
): Record<string, string> {
  const buy: StockChartPayload[] = []
  const sell: StockChartPayload[] = []
  const hold: StockChartPayload[] = []

  for (const c of charts) {
    const sig = c.analysis?.overallSignal ?? 'hold'
    if (sig === 'buy') buy.push(c)
    else if (sig === 'sell') sell.push(c)
    else hold.push(c)
  }

  const fmt = (list: StockChartPayload[]): string =>
    list
      .map((c) => c.analysis?.summary ?? `${c.name}（${c.symbol}）暂无分析`)
      .join('\n\n')

  const buyN = buy.length
  const sellN = sell.length
  const holdN = hold.length
  let stockSignal: StockSignalType = 'hold'
  if (buyN > sellN && buyN > holdN) stockSignal = 'buy'
  else if (sellN > buyN && sellN > holdN) stockSignal = 'sell'
  // 平票或 hold 最多 → hold

  return {
    stockHasBuy: buyN > 0 ? '1' : '0',
    stockHasSell: sellN > 0 ? '1' : '0',
    stockHasHold: holdN > 0 ? '1' : '0',
    stockBuySymbols: buy.map((c) => c.symbol).join(','),
    stockSellSymbols: sell.map((c) => c.symbol).join(','),
    stockHoldSymbols: hold.map((c) => c.symbol).join(','),
    stockBuyReport: fmt(buy),
    stockSellReport: fmt(sell),
    stockHoldReport: fmt(hold),
    stockSignal,
    stockAnalysisReport: queryFormatAnalysisReport(charts)
  }
}

/** 从实时行情补充最新价 */
export function queryApplyLiveQuote(
  chart: StockChartPayload,
  quote: StockLiveQuote
): StockChartPayload {
  const bars = [...chart.bars]
  if (bars.length === 0) return { ...chart, quote }
  const last = bars[bars.length - 1]
  bars[bars.length - 1] = {
    ...last,
    close: quote.price,
    high: Math.max(last.high, quote.price),
    low: Math.min(last.low, quote.price)
  }
  return { ...chart, bars, quote }
}
