import { queryHttpJson } from './http-client'
import type {
  StockChartPayload,
  StockKlineBar,
  StockKlinePeriod,
  StockKlineRange,
  StockLiveQuote
} from '../../../shared/stock-chart'

/** 东方财富 K 线周期参数 */
const PERIOD_KLT: Record<string, number> = {
  intraday: 5,
  daily: 101,
  weekly: 102,
  monthly: 103
}

const RANGE_LABEL: Record<StockKlineRange, string> = {
  today: '当天',
  week: '本周',
  month: '本月',
  custom: '自定义'
}

interface EastMoneyKlineResponse {
  data?: {
    code?: string
    name?: string
    klines?: string[]
  }
}

interface EastMoneyQuoteResponse {
  data?: Record<string, number>
}

/** 上海时区 YYYYMMDD */
export function queryShanghaiYmd(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date)
  const y = parts.find((p) => p.type === 'year')?.value ?? '1970'
  const m = parts.find((p) => p.type === 'month')?.value ?? '01'
  const d = parts.find((p) => p.type === 'day')?.value ?? '01'
  return `${y}${m}${d}`
}

/** YYYY-MM-DD → YYYYMMDD */
export function queryNormalizeYmdInput(raw: string): string {
  const s = raw.trim().replace(/-/g, '')
  if (!/^\d{8}$/.test(s)) {
    throw new Error(`无效日期：${raw}，请使用 YYYY-MM-DD`)
  }
  return s
}

/** 本周一（上海时区） */
export function queryShanghaiWeekStartYmd(date = new Date()): string {
  const shDate = new Date(
    date.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' })
  )
  const day = shDate.getDay()
  const diff = day === 0 ? 6 : day - 1
  shDate.setDate(shDate.getDate() - diff)
  return queryShanghaiYmd(shDate)
}

/** 本月 1 日（上海时区） */
export function queryShanghaiMonthStartYmd(date = new Date()): string {
  const shDate = new Date(
    date.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' })
  )
  shDate.setDate(1)
  return queryShanghaiYmd(shDate)
}

export interface AshareRangeParams {
  range: StockKlineRange
  startDate?: string
  endDate?: string
}

/** 根据 range 解析东方财富 beg/end 与 klt */
export function queryResolveRangeParams(params: AshareRangeParams): {
  beg: string
  end: string
  klt: number
  period: StockKlinePeriod
} {
  const today = queryShanghaiYmd()
  switch (params.range) {
    case 'today':
      return { beg: today, end: today, klt: PERIOD_KLT.intraday, period: 'intraday' }
    case 'week':
      return {
        beg: queryShanghaiWeekStartYmd(),
        end: today,
        klt: PERIOD_KLT.daily,
        period: 'daily'
      }
    case 'month':
      return {
        beg: queryShanghaiMonthStartYmd(),
        end: today,
        klt: PERIOD_KLT.daily,
        period: 'daily'
      }
    case 'custom': {
      const beg = params.startDate
        ? queryNormalizeYmdInput(params.startDate)
        : queryShanghaiMonthStartYmd()
      const end = params.endDate ? queryNormalizeYmdInput(params.endDate) : today
      return { beg, end, klt: PERIOD_KLT.daily, period: 'daily' }
    }
    default:
      return { beg: queryShanghaiMonthStartYmd(), end: today, klt: PERIOD_KLT.daily, period: 'daily' }
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
 * 东方财富 push2 行情字段（f43/f44/f45/f46/f169）统一以「分」为单位，需 /100 转为元。
 * 为什么：低价股（如 10.87）原始值 1087，若用 >10000 判断会漏除，导致实时价显示错误。
 */
export function queryNormalizeQuotePrice(raw: number): number {
  if (!Number.isFinite(raw) || raw === 0) return 0
  return raw / 100
}

/** 拉取实时行情 */
export async function queryAshareLiveQuote(symbol: string): Promise<StockLiveQuote> {
  const { code, secid } = queryNormalizeAshareSymbol(symbol)
  const url =
    `https://push2.eastmoney.com/api/qt/stock/get?secid=${encodeURIComponent(secid)}` +
    '&fields=f43,f44,f45,f46,f47,f48,f57,f58,f60,f169,f170'

  const data = await queryHttpJson<EastMoneyQuoteResponse>(url, {
    headers: { Referer: 'https://quote.eastmoney.com/' },
    timeoutMs: 10_000,
    retries: 1
  })

  const d = data.data ?? {}
  const price = queryNormalizeQuotePrice(Number(d.f43 ?? 0))
  const open = queryNormalizeQuotePrice(Number(d.f46 ?? 0))
  const high = queryNormalizeQuotePrice(Number(d.f44 ?? 0))
  const low = queryNormalizeQuotePrice(Number(d.f45 ?? 0))
  const changeAmount = queryNormalizeQuotePrice(Number(d.f169 ?? 0))
  const changePct = Number(d.f170 ?? 0) / 100

  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`${code} 实时行情不可用`)
  }

  return {
    price,
    changePct,
    changeAmount,
    high,
    low,
    open,
    updatedAt: Date.now()
  }
}

/**
 * 按时间范围拉取 K 线（支持当天 5 分钟、本周/本月/自定义日 K）。
 */
export async function queryAshareKlineByRange(
  symbol: string,
  rangeParams: AshareRangeParams,
  count = 500
): Promise<StockChartPayload> {
  const { code, secid } = queryNormalizeAshareSymbol(symbol)
  const { beg, end, klt, period } = queryResolveRangeParams(rangeParams)
  const lmt = Math.min(1000, Math.max(30, Math.floor(count) || 500))

  const url =
    'https://push2his.eastmoney.com/api/qt/stock/kline/get' +
    `?secid=${encodeURIComponent(secid)}` +
    '&fields1=f1,f2,f3,f4,f5,f6' +
    '&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61' +
    `&klt=${klt}&fqt=1&beg=${beg}&end=${end}` +
    `&lmt=${lmt}`

  const data = await queryHttpJson<EastMoneyKlineResponse>(url, {
    headers: { Referer: 'https://quote.eastmoney.com/' },
    timeoutMs: 15_000,
    retries: 1
  })

  const bars = (data.data?.klines ?? [])
    .map(queryParseKlineRow)
    .filter((b): b is StockKlineBar => b != null)

  if (bars.length === 0) {
    throw new Error(`${code} 未返回 K 线（${RANGE_LABEL[rangeParams.range]}，可能停牌）`)
  }

  let quote: StockLiveQuote | undefined
  try {
    quote = await queryAshareLiveQuote(symbol)
  } catch {
    // 行情失败不阻断 K 线
  }

  return {
    symbol: code,
    name: String(data.data?.name || code),
    range: rangeParams.range,
    period,
    bars,
    startDate: beg,
    endDate: end,
    quote
  }
}

/** 兼容旧版：按 period + count 拉取 */
export async function queryAshareKline(
  symbol: string,
  period: StockKlinePeriod = 'daily',
  count = 120
): Promise<StockChartPayload> {
  const range: StockKlineRange =
    period === 'intraday' ? 'today' : period === 'weekly' ? 'week' : 'month'
  if (period === 'daily') {
    return queryAshareKlineByRange(symbol, { range: 'month' }, count)
  }
  return queryAshareKlineByRange(symbol, { range }, count)
}

/** 预加载今天/本周/本月三套 K 线，供聊天内切换 */
export async function queryAshareKlineMultiRange(
  symbol: string,
  primaryRange: StockKlineRange,
  custom?: { startDate?: string; endDate?: string }
): Promise<StockChartPayload> {
  const ranges: StockKlineRange[] =
    primaryRange === 'custom'
      ? ['today', 'week', 'month', 'custom']
      : ['today', 'week', 'month']

  const rangeBars: Partial<Record<StockKlineRange, StockKlineBar[]>> = {}
  let primary: StockChartPayload | null = null

  for (const range of ranges) {
    try {
      const chart = await queryAshareKlineByRange(symbol, {
        range,
        startDate: range === 'custom' ? custom?.startDate : undefined,
        endDate: range === 'custom' ? custom?.endDate : undefined
      })
      rangeBars[range] = chart.bars
      if (range === primaryRange) primary = chart
    } catch {
      // 单范围失败跳过
    }
  }

  if (!primary) {
    primary = await queryAshareKlineByRange(symbol, {
      range: primaryRange,
      startDate: custom?.startDate,
      endDate: custom?.endDate
    })
    rangeBars[primaryRange] = primary.bars
  }

  return {
    ...primary,
    rangeBars
  }
}

/** 批量拉取 */
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
      const rangeLabel = RANGE_LABEL[c.range] ?? c.range
      const quotePart =
        c.quote != null
          ? `，现价 ${c.quote.price.toFixed(2)}（${c.quote.changePct >= 0 ? '+' : ''}${c.quote.changePct.toFixed(2)}%）`
          : ''
      return (
        `- ${c.name}（${c.symbol}）${rangeLabel}：${c.bars.length} 根，` +
        `最新 ${last.date} 收 ${last.close.toFixed(2)}${quotePart}`
      )
    })
    .join('\n')
}
