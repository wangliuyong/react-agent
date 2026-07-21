import { queryHttpJson } from './http-client'
import type { StockKlineBar, StockKlinePeriod, StockChartPayload } from '../../../shared/stock-chart'

/** 东方财富 K 线周期参数 */
const PERIOD_KLT: Record<StockKlinePeriod, number> = {
  daily: 101,
  weekly: 102,
  monthly: 103
}

const PERIOD_LABEL: Record<StockKlinePeriod, string> = {
  daily: '日K',
  weekly: '周K',
  monthly: '月K'
}

interface EastMoneyKlineResponse {
  data?: {
    code?: string
    name?: string
    klines?: string[]
  }
}

/** 将用户输入规范为 6 位 A 股代码，并推导东方财富 secid（1=沪 0=深/北） */
export function queryNormalizeAshareSymbol(raw: string): { code: string; secid: string } {
  let code = String(raw ?? '')
    .trim()
    .toUpperCase()
    .replace(/^(SH|SZ|BJ)\.?/i, '')
    .replace(/\.(SH|SZ|BJ)$/i, '')

  if (!/^\d{6}$/.test(code)) {
    throw new Error(`无效 A 股代码：${raw}`)
  }

  // 上交所：6 开头；深交所/北交所：其余常见代码段
  const market = code.startsWith('6') ? '1' : '0'
  return { code, secid: `${market}.${code}` }
}

/** 解析逗号/空格分隔的股票代码，或数组形式 */
export function queryParseAshareSymbols(input: unknown): string[] {
  if (Array.isArray(input)) {
    return input.flatMap((item) => queryParseAshareSymbols(item))
  }
  if (typeof input === 'string') {
    return input
      .split(/[,，\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return []
}

export function queryParseKlineRow(row: string): StockKlineBar | null {
  const parts = row.split(',')
  if (parts.length < 6) return null
  const [date, open, close, high, low, volume] = parts
  const bar: StockKlineBar = {
    date: date.trim(),
    open: Number(open),
    close: Number(close),
    high: Number(high),
    low: Number(low),
    volume: Number(volume)
  }
  if ([bar.open, bar.close, bar.high, bar.low].some((n) => !Number.isFinite(n))) {
    return null
  }
  return bar
}

/**
 * 从东方财富公开接口拉取单只股票 K 线。
 * 为什么用 push2his：免 Key、Electron 主进程可直接请求，适合工作流确定性拉数。
 */
export async function queryAshareKline(
  symbol: string,
  period: StockKlinePeriod = 'daily',
  count = 120
): Promise<StockChartPayload> {
  const { code, secid } = queryNormalizeAshareSymbol(symbol)
  const lmt = Math.min(500, Math.max(10, Math.floor(count) || 120))
  const klt = PERIOD_KLT[period] ?? PERIOD_KLT.daily

  const url =
    'https://push2his.eastmoney.com/api/qt/stock/kline/get' +
    `?secid=${encodeURIComponent(secid)}` +
    '&fields1=f1,f2,f3,f4,f5,f6' +
    '&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61' +
    `&klt=${klt}&fqt=1&beg=0&end=20500101` +
    `&lmt=${lmt}`

  const data = await queryHttpJson<EastMoneyKlineResponse>(url, {
    headers: { Referer: 'https://quote.eastmoney.com/' },
    timeoutMs: 15_000,
    retries: 1
  })

  const klines = data.data?.klines ?? []
  const bars = klines
    .map(queryParseKlineRow)
    .filter((b): b is StockKlineBar => b != null)

  if (bars.length === 0) {
    throw new Error(`${code} 未返回 K 线数据（可能停牌或代码错误）`)
  }

  return {
    symbol: code,
    name: String(data.data?.name || code),
    period,
    bars
  }
}

/** 批量拉取多只股票 K 线，单只失败不阻断其余 */
export async function queryAshareKlineBatch(
  symbols: string[],
  period: StockKlinePeriod = 'daily',
  count = 120
): Promise<{ charts: StockChartPayload[]; errors: string[] }> {
  const unique = Array.from(new Set(symbols.map((s) => s.trim()).filter(Boolean)))
  const charts: StockChartPayload[] = []
  const errors: string[] = []

  for (const symbol of unique) {
    try {
      charts.push(await queryAshareKline(symbol, period, count))
    } catch (e) {
      errors.push(`${symbol}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return { charts, errors }
}

export function queryFormatKlineSummary(charts: StockChartPayload[]): string {
  return charts
    .map((c) => {
      const last = c.bars[c.bars.length - 1]
      const periodLabel = PERIOD_LABEL[c.period] ?? c.period
      return (
        `- ${c.name}（${c.symbol}）${periodLabel}：共 ${c.bars.length} 根，` +
        `最新 ${last.date} 收 ${last.close.toFixed(2)}`
      )
    })
    .join('\n')
}
