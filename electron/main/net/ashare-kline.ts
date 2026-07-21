import { queryHttp, queryHttpJson } from './http-client'
import type {
  AshareKlineRefreshRequest,
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

/**
 * 东财 push2 被对端直接掐连接时，短时内反复试只会刷满日志并拖慢 5s 轮询。
 * 熔断后直连新浪，到期后再探测一次东财是否恢复。
 */
const EASTMONEY_CIRCUIT_MS = 5 * 60_000
let eastmoneyCircuitUntil = 0

function queryEastMoneyCircuitOpen(): boolean {
  return Date.now() < eastmoneyCircuitUntil
}

function postOpenEastMoneyCircuit(kind: 'quote' | 'kline', err: unknown): void {
  const wasOpen = queryEastMoneyCircuitOpen()
  eastmoneyCircuitUntil = Date.now() + EASTMONEY_CIRCUIT_MS
  if (wasOpen) return
  const msg = err instanceof Error ? err.message : String(err)
  console.warn(
    `[ashare-kline] eastmoney ${kind} unavailable (${msg}), use sina for ${EASTMONEY_CIRCUIT_MS / 60_000}m`
  )
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

interface SinaKlineRow {
  day: string
  open: string
  high: string
  low: string
  close: string
  volume: string
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

/** YYYY-MM-DD / YYYYMMDD / 数字日期 → YYYYMMDD */
export function queryNormalizeYmdInput(raw: string | number): string {
  const s = String(raw ?? '')
    .trim()
    .replace(/-/g, '')
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

/** 转为新浪行情 list 代码（sh600519 / sz000001 / bj430047） */
export function querySinaListSymbol(code: string): string {
  if (code.startsWith('6')) return `sh${code}`
  if (code.startsWith('4') || code.startsWith('8')) return `bj${code}`
  return `sz${code}`
}

/**
 * 解析新浪 hq.sinajs.cn 返回体：var hq_str_sh600519="名称,今开,昨收,现价,最高,最低,..."
 * 为什么：新浪为纯文本，字段位置固定，便于单测与降级复用。
 */
export function queryParseSinaQuoteText(text: string): {
  name: string
  open: number
  prevClose: number
  price: number
  high: number
  low: number
} | null {
  const match = text.match(/="([^"]*)"/)
  if (!match?.[1]) return null
  const parts = match[1].split(',')
  if (parts.length < 6) return null
  const open = Number(parts[1])
  const prevClose = Number(parts[2])
  const price = Number(parts[3])
  const high = Number(parts[4])
  const low = Number(parts[5])
  if (![open, prevClose, price, high, low].every(Number.isFinite)) return null
  return { name: parts[0], open, prevClose, price, high, low }
}

/**
 * 将新浪行情响应体按 GB18030 解码。
 * 为什么：hq.sinajs.cn 声明 charset=GB18030；若用 res.text()（默认 UTF-8）则中文股票名会乱码。
 */
export function queryDecodeSinaText(input: ArrayBuffer | Uint8Array): string {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input)
  return new TextDecoder('gb18030').decode(bytes)
}

/** 读取新浪行情 Response 并按 GB18030 解码为文本 */
async function queryReadSinaResponseText(res: Response): Promise<string> {
  return queryDecodeSinaText(await res.arrayBuffer())
}

/** 东方财富 push2 实时行情 */
async function queryEastMoneyLiveQuote(symbol: string): Promise<StockLiveQuote> {
  const { code, secid } = queryNormalizeAshareSymbol(symbol)
  const url =
    `https://push2.eastmoney.com/api/qt/stock/get?secid=${encodeURIComponent(secid)}` +
    '&fields=f43,f44,f45,f46,f47,f48,f57,f58,f60,f169,f170'

  const data = await queryHttpJson<EastMoneyQuoteResponse>(url, {
    headers: { Referer: 'https://quote.eastmoney.com/' },
    timeoutMs: 8_000,
    // 对端直接掐连接时重试无意义，尽快降级新浪
    retries: 0
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

/** 新浪 hq.sinajs.cn 实时行情（东财 push2 被重置连接时的备用源） */
async function querySinaLiveQuote(symbol: string): Promise<StockLiveQuote> {
  const { code } = queryNormalizeAshareSymbol(symbol)
  const listCode = querySinaListSymbol(code)
  const url = `https://hq.sinajs.cn/list=${listCode}`

  const res = await queryHttp(url, {
    headers: { Referer: 'https://finance.sina.com.cn/' },
    timeoutMs: 10_000,
    retries: 1
  })
  const parsed = queryParseSinaQuoteText(await queryReadSinaResponseText(res))
  if (!parsed || !Number.isFinite(parsed.price) || parsed.price <= 0) {
    throw new Error(`${code} 新浪实时行情不可用`)
  }

  const changeAmount = parsed.price - parsed.prevClose
  const changePct =
    parsed.prevClose > 0 ? (changeAmount / parsed.prevClose) * 100 : 0

  return {
    price: parsed.price,
    changePct,
    changeAmount,
    high: parsed.high,
    low: parsed.low,
    open: parsed.open,
    updatedAt: Date.now()
  }
}

/** 拉取实时行情：优先东财，失败降级新浪（东财熔断期间直连新浪） */
export async function queryAshareLiveQuote(symbol: string): Promise<StockLiveQuote> {
  if (queryEastMoneyCircuitOpen()) {
    return querySinaLiveQuote(symbol)
  }
  try {
    return await queryEastMoneyLiveQuote(symbol)
  } catch (emErr) {
    postOpenEastMoneyCircuit('quote', emErr)
    return querySinaLiveQuote(symbol)
  }
}

/** 拉取东方财富 K 线原始 bars */
async function queryFetchEastMoneyBars(
  secid: string,
  beg: string,
  end: string,
  klt: number,
  lmt: number
): Promise<{ bars: StockKlineBar[]; name: string }> {
  const url =
    'https://push2his.eastmoney.com/api/qt/stock/kline/get' +
    `?secid=${encodeURIComponent(secid)}` +
    '&fields1=f1,f2,f3,f4,f5,f6' +
    '&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61' +
    `&klt=${klt}&fqt=1&beg=${beg}&end=${end}` +
    `&lmt=${lmt}`

  const data = await queryHttpJson<EastMoneyKlineResponse>(url, {
    headers: { Referer: 'https://quote.eastmoney.com/' },
    timeoutMs: 8_000,
    retries: 0
  })

  const bars = (data.data?.klines ?? [])
    .map(queryParseKlineRow)
    .filter((b): b is StockKlineBar => b != null)

  return { bars, name: String(data.data?.name ?? '') }
}

/** 新浪 K 线 scale：5=5 分钟，240=日 K */
function querySinaKlineScale(klt: number): number {
  return klt === PERIOD_KLT.intraday ? 5 : 240
}

/** 按 beg/end 过滤新浪 K 线（日 K 用 YYYYMMDD，分时用当天 YYYY-MM-DD 前缀） */
function queryFilterSinaBars(
  bars: StockKlineBar[],
  beg: string,
  end: string,
  intraday: boolean
): StockKlineBar[] {
  if (intraday) {
    const dayPrefix = `${beg.slice(0, 4)}-${beg.slice(4, 6)}-${beg.slice(6, 8)}`
    return bars.filter((b) => b.date.startsWith(dayPrefix))
  }
  return bars.filter((b) => {
    const ymd = b.date.replace(/-/g, '').slice(0, 8)
    return ymd >= beg && ymd <= end
  })
}

/** 新浪 K 线（东财 push2his 不可用时的备用源） */
async function queryFetchSinaBars(
  code: string,
  beg: string,
  end: string,
  klt: number,
  lmt: number
): Promise<{ bars: StockKlineBar[]; name: string }> {
  const listCode = querySinaListSymbol(code)
  const scale = querySinaKlineScale(klt)
  const datalen = Math.min(1023, Math.max(30, lmt))
  const url =
    'https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData' +
    `?symbol=${encodeURIComponent(listCode)}&scale=${scale}&ma=no&datalen=${datalen}`

  const rows = await queryHttpJson<SinaKlineRow[]>(url, {
    headers: { Referer: 'https://finance.sina.com.cn/' },
    timeoutMs: 15_000,
    retries: 1
  })

  const intraday = scale === 5
  const bars = (Array.isArray(rows) ? rows : [])
    .map((row) => {
      const bar: StockKlineBar = {
        date: row.day,
        open: Number(row.open),
        high: Number(row.high),
        low: Number(row.low),
        close: Number(row.close),
        volume: Number(row.volume)
      }
      if ([bar.open, bar.high, bar.low, bar.close].some((n) => !Number.isFinite(n))) {
        return null
      }
      return bar
    })
    .filter((b): b is StockKlineBar => b != null)

  const filtered = queryFilterSinaBars(bars, beg, end, intraday)

  let name = code
  try {
    const quoteRes = await queryHttp(
      `https://hq.sinajs.cn/list=${encodeURIComponent(listCode)}`,
      {
        headers: { Referer: 'https://finance.sina.com.cn/' },
        timeoutMs: 8_000,
        retries: 0
      }
    )
    const parsed = queryParseSinaQuoteText(await queryReadSinaResponseText(quoteRes))
    if (parsed?.name) name = parsed.name
  } catch {
    // 名称获取失败不阻断 K 线
  }

  return { bars: filtered, name }
}

/** 拉取 K 线：优先东财，失败降级新浪（东财熔断期间直连新浪） */
async function queryFetchAshareBars(
  code: string,
  secid: string,
  beg: string,
  end: string,
  klt: number,
  lmt: number
): Promise<{ bars: StockKlineBar[]; name: string }> {
  if (queryEastMoneyCircuitOpen()) {
    return queryFetchSinaBars(code, beg, end, klt, lmt)
  }
  try {
    return await queryFetchEastMoneyBars(secid, beg, end, klt, lmt)
  } catch (emErr) {
    postOpenEastMoneyCircuit('kline', emErr)
    return queryFetchSinaBars(code, beg, end, klt, lmt)
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

  let { bars, name } = await queryFetchAshareBars(code, secid, beg, end, klt, lmt)

  // 当天 5 分钟线偶发为空（收盘后/接口抖动），降级为当日日 K
  if (bars.length === 0 && rangeParams.range === 'today') {
    const fallback = await queryFetchAshareBars(code, secid, beg, end, PERIOD_KLT.daily, lmt)
    bars = fallback.bars
    name = fallback.name || name
  }

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
    name: name || code,
    range: rangeParams.range,
    period,
    bars,
    startDate: beg,
    endDate: end,
    quote
  }
}

/** 解析聊天内刷新请求的时间范围参数 */
export function queryResolveRefreshRangeParams(
  req: AshareKlineRefreshRequest
): AshareRangeParams {
  const range = req.range ?? 'today'
  if (range !== 'custom') {
    return { range }
  }
  return {
    range,
    startDate: req.startDate != null ? String(req.startDate) : undefined,
    endDate: req.endDate != null ? String(req.endDate) : undefined
  }
}

/**
 * 聊天内 K 线刷新：优先全量拉取；失败时用已有 K 线 + 实时行情降级。
 */
export async function queryAshareKlineRefreshChart(
  req: AshareKlineRefreshRequest,
  options?: {
    queryAnalyze?: (chart: StockChartPayload) => StockChartPayload['analysis']
    queryApplyQuote?: (
      chart: StockChartPayload,
      quote: StockLiveQuote
    ) => StockChartPayload
  }
): Promise<StockChartPayload | null> {
  const symbol = String(req?.symbol ?? '').trim()
  if (!symbol) return null

  const rangeParams = queryResolveRefreshRangeParams(req)
  const existingBars = Array.isArray(req.existingBars)
    ? req.existingBars.filter((b) => b && typeof b.date === 'string')
    : []

  try {
    const chart = await queryAshareKlineByRange(symbol, rangeParams)
    if (options?.queryAnalyze) {
      try {
        chart.analysis = options.queryAnalyze(chart)
      } catch (err) {
        console.warn('[ashare-kline-refresh] analysis failed:', err)
      }
    }
    return chart
  } catch (err) {
    console.warn('[ashare-kline-refresh] kline fetch failed:', err)
    if (existingBars.length === 0) return null

    try {
      const { code } = queryNormalizeAshareSymbol(symbol)
      const quote = await queryAshareLiveQuote(symbol)
      let chart: StockChartPayload = {
        symbol: code,
        name: String(req.name || code),
        range: rangeParams.range,
        bars: existingBars,
        startDate:
          rangeParams.startDate != null ? queryNormalizeYmdInput(rangeParams.startDate) : undefined,
        endDate:
          rangeParams.endDate != null ? queryNormalizeYmdInput(rangeParams.endDate) : undefined,
        quote
      }
      if (options?.queryApplyQuote) {
        chart = options.queryApplyQuote(chart, quote)
      }
      if (options?.queryAnalyze) {
        try {
          chart.analysis = options.queryAnalyze(chart)
        } catch (analysisErr) {
          console.warn('[ashare-kline-refresh] fallback analysis failed:', analysisErr)
        }
      }
      return chart
    } catch (fallbackErr) {
      console.warn('[ashare-kline-refresh] quote fallback failed, keep existing bars:', fallbackErr)
      const { code } = queryNormalizeAshareSymbol(symbol)
      let chart: StockChartPayload = {
        symbol: code,
        name: String(req.name || code),
        range: rangeParams.range,
        bars: existingBars,
        startDate:
          rangeParams.startDate != null ? queryNormalizeYmdInput(rangeParams.startDate) : undefined,
        endDate:
          rangeParams.endDate != null ? queryNormalizeYmdInput(rangeParams.endDate) : undefined
      }
      if (options?.queryAnalyze) {
        try {
          chart.analysis = options.queryAnalyze(chart)
        } catch (analysisErr) {
          console.warn('[ashare-kline-refresh] bars-only analysis failed:', analysisErr)
        }
      }
      return chart
    }
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
