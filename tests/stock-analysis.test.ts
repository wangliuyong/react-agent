import { describe, expect, it } from 'vitest'
import type { StockChartPayload } from '../shared/stock-chart'
import { queryAnalyzeStockChart } from '../shared/stock-analysis'

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
})
