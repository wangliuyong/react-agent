import type { StockKlinePeriod } from '../../../../shared/stock-chart'
import { queryBuildStockChartBlock } from '../../../../shared/stock-chart'
import {
  queryAshareKlineBatch,
  queryFormatKlineSummary,
  queryParseAshareSymbols
} from '../../net/ashare-kline'
import { queryEncodeWorkflowCtxResult } from './hot-topics'
import type { AgentTool } from './types'

const VALID_PERIODS = new Set<StockKlinePeriod>(['daily', 'weekly', 'monthly'])

function queryParsePeriod(raw: unknown): StockKlinePeriod {
  const period = String(raw ?? 'daily').trim() as StockKlinePeriod
  return VALID_PERIODS.has(period) ? period : 'daily'
}

/**
 * 获取 A 股 K 线并在聊天中预览。
 * symbols 支持英文逗号分隔字符串或数组，例如 "600519,000001"。
 */
export const queryAshareKlineTool: AgentTool = {
  name: 'query_ashare_kline',
  description:
    '获取 A 股股票 K 线数据，并在聊天界面展示可交互 K 线图。' +
    'symbols 为股票代码，多个用英文逗号分隔，如 600519,000001；' +
    'period 可选 daily（日K）/ weekly（周K）/ monthly（月K）；count 为 K 线条数，默认 120。',
  permission: 'safe',
  parameters: {
    type: 'object',
    properties: {
      symbols: {
        oneOf: [
          { type: 'string', description: '股票代码，英文逗号分隔，如 600519,000001' },
          {
            type: 'array',
            items: { type: 'string' },
            description: '股票代码数组'
          }
        ],
        description: '一只或多只 A 股代码'
      },
      period: {
        type: 'string',
        enum: ['daily', 'weekly', 'monthly'],
        description: 'K 线周期，默认 daily'
      },
      count: {
        type: 'number',
        description: 'K 线条数，默认 120，最大 500'
      }
    },
    required: ['symbols']
  },
  async execute(args) {
    const symbols = queryParseAshareSymbols(args.symbols)
    const period = queryParsePeriod(args.period)
    const count = Math.min(500, Math.max(10, Number(args.count ?? 120) || 120))

    if (symbols.length === 0) {
      return queryEncodeWorkflowCtxResult('请提供至少一个 A 股股票代码（英文逗号分隔）。', {
        stockKlineOk: '0',
        stockSymbols: '',
        stockKlineSummary: ''
      })
    }

    const { charts, errors } = await queryAshareKlineBatch(symbols, period, count)

    if (charts.length === 0) {
      const errText = errors.length ? errors.join('；') : '全部股票拉取失败'
      return queryEncodeWorkflowCtxResult(`获取 K 线失败：${errText}`, {
        stockKlineOk: '0',
        stockSymbols: symbols.join(','),
        stockKlineSummary: ''
      })
    }

    const summaryLines = [
      `已获取 ${charts.length} 只股票 K 线：`,
      queryFormatKlineSummary(charts)
    ]
    if (errors.length) {
      summaryLines.push('', `部分失败：${errors.join('；')}`)
    }

    const chartBlock = queryBuildStockChartBlock(charts)
    const message = `${summaryLines.join('\n')}\n${chartBlock}`
    const chartJson = JSON.stringify({ charts })

    return queryEncodeWorkflowCtxResult(message, {
      stockKlineOk: '1',
      stockSymbols: charts.map((c) => c.symbol).join(','),
      stockKlineSummary: summaryLines.join('\n'),
      stockChartJson: chartJson,
      stockKlineErrors: errors.join('；')
    })
  }
}
