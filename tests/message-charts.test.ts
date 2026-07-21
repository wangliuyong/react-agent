import { describe, expect, it } from 'vitest'
import {
  queryBuildStockChartBlock,
  queryExtractStockCharts,
  stripStockChartBlock,
  type StockChartPayload
} from '../shared/stock-chart'
import {
  extractStockCharts,
  queryDisplayContentWithCharts
} from '../src/features/chat/utils/message-charts'

const sampleChart: StockChartPayload = {
  symbol: '600519',
  name: '贵州茅台',
  period: 'daily',
  bars: [
    { date: '2026-07-18', open: 1680, high: 1702, low: 1675, close: 1698, volume: 123456 }
  ]
}

describe('stock-chart shared', () => {
  it('构建并解析 @@stock_chart@@ 块', () => {
    const block = queryBuildStockChartBlock([sampleChart])
    expect(block.startsWith('@@stock_chart@@')).toBe(true)
    const charts = queryExtractStockCharts(`摘要\n${block}`)
    expect(charts).toHaveLength(1)
    expect(charts[0].symbol).toBe('600519')
  })

  it('strip 后隐藏 JSON 块', () => {
    const block = queryBuildStockChartBlock([sampleChart])
    expect(stripStockChartBlock(`已获取\n${block}`)).toBe('已获取')
  })
})

describe('message-charts', () => {
  it('从 workflow_ctx 包装消息中提取 K 线', () => {
    const block = queryBuildStockChartBlock([sampleChart])
    const inner = `已获取 1 只股票\n${block}`
    const wrapped = `@@workflow_ctx@@${JSON.stringify({ message: inner, patch: {} })}`
    const charts = extractStockCharts(wrapped)
    expect(charts[0].name).toBe('贵州茅台')
  })

  it('展示正文不含 stock_chart JSON', () => {
    const block = queryBuildStockChartBlock([sampleChart])
    const text = `K 线已就绪\n${block}`
    expect(queryDisplayContentWithCharts(text)).toBe('K 线已就绪')
  })
})
