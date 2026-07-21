import { describe, expect, it } from 'vitest'
import type { StockChartPayload } from '../shared/stock-chart'
import { queryAnalyzeStockChart } from '../electron/main/net/stock-analysis'

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
})
