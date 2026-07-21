import type { StockChartPayload, StockKlinePeriod, StockKlineRange } from '../../../../shared/stock-chart'
import { queryBuildStockChartBlock } from '../../../../shared/stock-chart'
import {
  queryAshareKlineBatch,
  queryAshareKlineByRange,
  queryAshareKlineMultiRange,
  queryFormatKlineSummary,
  queryParseAshareSymbols
} from '../../net/ashare-kline'
import { queryAnalyzeStockChart, queryFormatAnalysisReport } from '../../net/stock-analysis'
import { queryEncodeWorkflowCtxResult } from './hot-topics'
import type { AgentTool } from './types'

const VALID_PERIODS = new Set<StockKlinePeriod>(['daily', 'weekly', 'monthly'])
const VALID_RANGES = new Set<StockKlineRange>(['today', 'week', 'month', 'custom'])

function queryParsePeriod(raw: unknown): StockKlinePeriod {
  const period = String(raw ?? 'daily').trim() as StockKlinePeriod
  return VALID_PERIODS.has(period) ? period : 'daily'
}

function queryParseRange(raw: unknown): StockKlineRange {
  const range = String(raw ?? 'today').trim() as StockKlineRange
  return VALID_RANGES.has(range) ? range : 'today'
}

async function queryBuildChartsWithAnalysis(
  symbols: string[],
  range: StockKlineRange,
  options: {
    startDate?: string
    endDate?: string
    preloadRanges?: boolean
    count?: number
  }
): Promise<{ charts: StockChartPayload[]; errors: string[] }> {
  const charts: StockChartPayload[] = []
  const errors: string[] = []

  for (const symbol of symbols) {
    try {
      let chart: StockChartPayload
      if (options.preloadRanges) {
        chart = await queryAshareKlineMultiRange(symbol, range, {
          startDate: options.startDate,
          endDate: options.endDate
        })
      } else {
        chart = await queryAshareKlineByRange(
          symbol,
          { range, startDate: options.startDate, endDate: options.endDate },
          options.count ?? 500
        )
      }
      chart.analysis = queryAnalyzeStockChart(chart)
      charts.push(chart)
    } catch (e) {
      errors.push(`${symbol}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return { charts, errors }
}

/**
 * 获取 A 股 K 线并在聊天中预览（基础版，兼容旧流程）。
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
          { type: 'array', items: { type: 'string' }, description: '股票代码数组' }
        ],
        description: '一只或多只 A 股代码'
      },
      period: {
        type: 'string',
        enum: ['daily', 'weekly', 'monthly'],
        description: 'K 线周期，默认 daily'
      },
      count: { type: 'number', description: 'K 线条数，默认 120，最大 500' }
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
    if (errors.length) summaryLines.push('', `部分失败：${errors.join('；')}`)

    const chartBlock = queryBuildStockChartBlock(charts)
    return queryEncodeWorkflowCtxResult(`${summaryLines.join('\n')}\n${chartBlock}`, {
      stockKlineOk: '1',
      stockSymbols: charts.map((c) => c.symbol).join(','),
      stockKlineSummary: summaryLines.join('\n'),
      stockChartJson: JSON.stringify({ charts }),
      stockKlineErrors: errors.join('；')
    })
  }
}

/**
 * 获取 A 股实时 K 线 + 综合分析 + 买卖信号 + 涨跌预测，并在聊天中交互预览。
 * range：today（当天5分钟）/ week（本周日K）/ month（本月日K）/ custom（自定义日期）。
 */
export const queryAshareRealtimeAnalysisTool: AgentTool = {
  name: 'query_ashare_realtime_analysis',
  description:
    '获取 A 股实时 K 线、技术指标综合分析、买入/卖出信号与短期涨跌预测，并在聊天界面可交互预览。' +
    'symbols：股票代码，多个英文逗号分隔；' +
    'range：today（当天）/ week（本周）/ month（本月）/ custom（自定义，需 startDate/endDate）；' +
    'preloadRanges=true 时预加载今天/本周/本月三套数据供聊天内切换；' +
    '输出 stockSignal（buy/sell/hold）供流程条件分支。',
  permission: 'safe',
  parameters: {
    type: 'object',
    properties: {
      symbols: {
        oneOf: [
          { type: 'string', description: '如 600519,000001' },
          { type: 'array', items: { type: 'string' } }
        ]
      },
      range: {
        type: 'string',
        enum: ['today', 'week', 'month', 'custom'],
        description: '时间范围，默认 today（当天实时分时）'
      },
      startDate: {
        type: 'string',
        description: '自定义起始日期 YYYY-MM-DD（range=custom 时必填）'
      },
      endDate: {
        type: 'string',
        description: '自定义结束日期 YYYY-MM-DD（range=custom 时必填）'
      },
      preloadRanges: {
        type: 'boolean',
        description: '是否预加载今天/本周/本月数据供聊天切换，默认 true'
      },
      count: { type: 'number', description: 'K 线最大条数，默认 500' }
    },
    required: ['symbols']
  },
  async execute(args) {
    const symbols = queryParseAshareSymbols(args.symbols)
    const range = queryParseRange(args.range)
    const startDate = args.startDate ? String(args.startDate) : undefined
    const endDate = args.endDate ? String(args.endDate) : undefined
    const preloadRanges = args.preloadRanges !== false
    const count = Math.min(1000, Math.max(30, Number(args.count ?? 500) || 500))

    if (symbols.length === 0) {
      return queryEncodeWorkflowCtxResult('请提供至少一个 A 股股票代码（英文逗号分隔）。', {
        stockAnalysisOk: '0',
        stockSignal: 'hold',
        stockSymbols: ''
      })
    }

    if (range === 'custom' && (!startDate || !endDate)) {
      return queryEncodeWorkflowCtxResult(
        'range=custom 时请同时提供 startDate 与 endDate（YYYY-MM-DD）。',
        { stockAnalysisOk: '0', stockSignal: 'hold', stockSymbols: symbols.join(',') }
      )
    }

    const { charts, errors } = await queryBuildChartsWithAnalysis(symbols, range, {
      startDate,
      endDate,
      preloadRanges,
      count
    })

    if (charts.length === 0) {
      const errText = errors.length ? errors.join('；') : '全部股票拉取失败'
      return queryEncodeWorkflowCtxResult(`实时 K 线分析失败：${errText}`, {
        stockAnalysisOk: '0',
        stockSignal: 'hold',
        stockSymbols: symbols.join(',')
      })
    }

    const analysisReport = queryFormatAnalysisReport(charts)
    const summaryLines = [
      `已分析 ${charts.length} 只股票（范围：${range}）：`,
      queryFormatKlineSummary(charts),
      '',
      '--- 综合分析 ---',
      analysisReport
    ]
    if (errors.length) summaryLines.push('', `部分失败：${errors.join('；')}`)

    const primarySignal = charts[0].analysis?.overallSignal ?? 'hold'
    const signalSummary = charts
      .map(
        (c) =>
          `${c.name}（${c.symbol}）：${c.analysis?.overallSignal === 'buy' ? '买入' : c.analysis?.overallSignal === 'sell' ? '卖出' : '观望'}`
      )
      .join('；')

    // 不开启聊天内自动轮询，仅保留手动刷新
    const liveRefresh = false
    const chartBlock = queryBuildStockChartBlock(charts, { liveRefresh })
    const message = `${summaryLines.join('\n')}\n${chartBlock}`

    return queryEncodeWorkflowCtxResult(message, {
      stockAnalysisOk: '1',
      stockSymbols: charts.map((c) => c.symbol).join(','),
      stockKlineSummary: summaryLines.join('\n'),
      stockAnalysisReport: analysisReport,
      stockSignal: primarySignal,
      stockSignalSummary: signalSummary,
      stockChartJson: JSON.stringify({ charts, liveRefresh }),
      stockRange: range,
      stockKlineErrors: errors.join('；')
    })
  }
}
