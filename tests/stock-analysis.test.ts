import { describe, expect, it } from 'vitest'
import type { StockChartPayload } from '../shared/stock-chart'
import {
  queryAnalyzeStockChart,
  queryBuildRealtimeAnalysisContext,
  queryScoreOverallSignal
} from '../shared/stock-analysis'

function queryMockBars(count: number, startPrice = 100): StockChartPayload['bars'] {
  const bars: StockChartPayload['bars'] = []
  let price = startPrice
  for (let i = 0; i < count; i++) {
    const open = price
    const change = (i % 7 === 0 ? 2 : i % 5 === 0 ? -1.5 : 0.3) * (i % 2 === 0 ? 1 : -1)
    const close = open + change
    const high = Math.max(open, close) + 0.5
    const low = Math.min(open, close) - 0.5
    bars.push({
      date: `2026-06-${String(i + 1).padStart(2, '0')}`,
      open,
      close,
      high,
      low,
      volume: 10000 + i * 100
    })
    price = close
  }
  return bars
}

describe('stock-analysis', () => {
  it('生成综合分析含信号与预测', () => {
    const chart: StockChartPayload = {
      symbol: '600519',
      name: '贵州茅台',
      range: 'month',
      bars: queryMockBars(40, 1680)
    }
    const result = queryAnalyzeStockChart(chart)
    expect(result.symbol).toBe('600519')
    expect(['buy', 'sell', 'hold']).toContain(result.overallSignal)
    expect(['up', 'down', 'sideways']).toContain(result.prediction.direction)
    expect(result.prediction.confidence).toBeGreaterThan(0)
    expect(result.summary).toContain('600519')
    expect(result.summary).toContain('打分')
  })

  it('买卖信号日期必须落在当前 K 线序列内（可供图表 markPoint 对齐）', () => {
    const bars = queryMockBars(40, 100)
    const result = queryAnalyzeStockChart({
      symbol: '600900',
      name: '长江电力',
      range: 'month',
      bars
    })
    const dateSet = new Set(bars.map((b) => b.date))
    for (const signal of result.tradeSignals) {
      expect(dateSet.has(signal.date)).toBe(true)
    }
  })

  it('近窗加权：中间带分数为 hold', () => {
    const scored = queryScoreOverallSignal(
      [],
      'neutral',
      {
        direction: 'sideways',
        confidence: 40,
        horizon: '短期',
        targetPrice: 10,
        stopLoss: 9,
        changePctEstimate: 0
      },
      { ma5: 10, ma10: 10, ma20: 10, rsi14: 50, macdDif: 0, macdDea: 0, macdHist: 0 }
    )
    expect(scored.overallSignal).toBe('hold')
    expect(Math.abs(scored.score)).toBeLessThan(1.2)
  })

  it('近窗加权：多头信号与看涨预测倾向买入', () => {
    const scored = queryScoreOverallSignal(
      [
        { type: 'buy', date: '2026-06-01', price: 10, reason: '金叉' },
        { type: 'buy', date: '2026-06-02', price: 11, reason: 'RSI' },
        { type: 'buy', date: '2026-06-03', price: 12, reason: 'MACD' }
      ],
      'bullish',
      {
        direction: 'up',
        confidence: 70,
        horizon: '短期',
        targetPrice: 13,
        stopLoss: 9,
        changePctEstimate: 2
      },
      { ma5: 12, ma10: 11, ma20: 10, rsi14: 55, macdDif: 1, macdDea: 0.5, macdHist: 0.5 }
    )
    expect(scored.overallSignal).toBe('buy')
    expect(scored.score).toBeGreaterThanOrEqual(1.2)
  })

  it('多股 context 按信号分组，买卖可同时为 1', () => {
    const charts: StockChartPayload[] = [
      {
        symbol: '600519',
        name: '贵州茅台',
        range: 'today',
        bars: [],
        analysis: {
          symbol: '600519',
          name: '贵州茅台',
          trend: 'bullish',
          overallSignal: 'buy',
          prediction: {
            direction: 'up',
            confidence: 60,
            horizon: '短',
            targetPrice: 1,
            stopLoss: 1,
            changePctEstimate: 1
          },
          indicators: {},
          tradeSignals: [],
          summary: '茅台买入摘要'
        }
      },
      {
        symbol: '000001',
        name: '平安银行',
        range: 'today',
        bars: [],
        analysis: {
          symbol: '000001',
          name: '平安银行',
          trend: 'bearish',
          overallSignal: 'sell',
          prediction: {
            direction: 'down',
            confidence: 60,
            horizon: '短',
            targetPrice: 1,
            stopLoss: 1,
            changePctEstimate: -1
          },
          indicators: {},
          tradeSignals: [],
          summary: '平安卖出摘要'
        }
      }
    ]
    const ctx = queryBuildRealtimeAnalysisContext(charts)
    expect(ctx.stockHasBuy).toBe('1')
    expect(ctx.stockHasSell).toBe('1')
    expect(ctx.stockHasHold).toBe('0')
    expect(ctx.stockBuySymbols).toBe('600519')
    expect(ctx.stockSellSymbols).toBe('000001')
    expect(ctx.stockBuyReport).toContain('茅台买入摘要')
    expect(ctx.stockSellReport).toContain('平安卖出摘要')
    // 买卖各 1 平票 → hold
    expect(ctx.stockSignal).toBe('hold')
  })
})
