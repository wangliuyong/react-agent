import * as echarts from 'echarts/core'
import { CandlestickChart, BarChart, LineChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  LegendComponent,
  MarkPointComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type {
  AshareKlineRefreshRequest,
  StockChartPayload,
  StockKlineBar,
  StockKlineRange,
  StockLiveQuote
} from '@shared/stock-chart'
import { STOCK_RANGE_LABELS } from '@shared/stock-chart'
import { queryAshareKlineRefresh } from '../../api'
import styles from './MessageKlineChart.module.css'

echarts.use([
  CandlestickChart,
  BarChart,
  LineChart,
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  LegendComponent,
  MarkPointComponent,
  CanvasRenderer
])

/** 当天分时：5 秒一轮完整 K 线刷新 */
const LIVE_KLINE_MS = 5_000

interface MessageKlineChartProps {
  charts: StockChartPayload[]
  liveRefresh?: boolean
}

function queryBarsForRange(chart: StockChartPayload, range: StockKlineRange): StockKlineBar[] {
  if (chart.rangeBars?.[range]?.length) return chart.rangeBars[range]!
  if (chart.range === range) return chart.bars
  return chart.bars
}

function queryAvailableRanges(chart: StockChartPayload): StockKlineRange[] {
  const ranges: StockKlineRange[] = []
  const candidates: StockKlineRange[] = ['today', 'week', 'month']
  for (const r of candidates) {
    if (r === 'custom' && !chart.startDate && !chart.rangeBars?.custom) continue
    const bars = queryBarsForRange(chart, r)
    if (bars.length > 0) ranges.push(r)
  }
  return ranges.length ? ranges : [chart.range ?? 'today']
}

/** 优先当天实时图：有 today 数据或开启 live 时默认今天 */
function queryDefaultRange(chart: StockChartPayload, liveRefresh: boolean): StockKlineRange {
  const ranges = queryAvailableRanges(chart)
  if (liveRefresh && ranges.includes('today')) return 'today'
  if (ranges.includes(chart.range)) return chart.range
  return ranges[0] ?? 'today'
}

/** 用最新行情修补最后一根 K 线，实现秒级价格跳动 */
function queryPatchBarsWithQuote(bars: StockKlineBar[], quote?: StockLiveQuote): StockKlineBar[] {
  if (!quote || bars.length === 0) return bars
  const next = bars.slice()
  const last = { ...next[next.length - 1] }
  last.close = quote.price
  last.high = Math.max(last.high, quote.price, quote.high || last.high)
  last.low = Math.min(last.low, quote.price, quote.low || last.low)
  next[next.length - 1] = last
  return next
}

function querySignalTag(signal?: string): { color: string; label: string } {
  if (signal === 'buy') return { color: 'success', label: '买入' }
  if (signal === 'sell') return { color: 'error', label: '卖出' }
  return { color: 'default', label: '观望' }
}

function queryTrendTag(trend?: string): { color: string; label: string } {
  if (trend === 'bullish') return { color: 'red', label: '偏多' }
  if (trend === 'bearish') return { color: 'green', label: '偏空' }
  return { color: 'blue', label: '震荡' }
}

function queryFormatClock(ts?: number): string {
  if (!ts) return ''
  try {
    return new Date(ts).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  } catch {
    return ''
  }
}

/**
 * 聊天内 A 股 K 线：默认当天实时预览、周期切换、买卖标记、综合分析。
 */
export function MessageKlineChart({
  charts,
  liveRefresh = false
}: MessageKlineChartProps): React.ReactElement | null {
  const [activeSymbol, setActiveSymbol] = useState(charts[0]?.symbol ?? '')
  const [activeRange, setActiveRange] = useState<StockKlineRange>(() =>
    charts[0] ? queryDefaultRange(charts[0], liveRefresh) : 'today'
  )
  const [chartData, setChartData] = useState<StockChartPayload[]>(charts)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefreshAt, setLastRefreshAt] = useState<number | null>(null)
  /** 手动刷新后重置轮询计时，避免刚点刷新又立刻被静默轮询覆盖 */
  const [pollEpoch, setPollEpoch] = useState(0)
  const chartRef = useRef<HTMLDivElement | null>(null)
  const instanceRef = useRef<echarts.ECharts | null>(null)
  /** 供 postRefresh 读取最新图表上下文，避免 useCallback 随行情更新反复重建 */
  const chartContextRef = useRef<{
    activeChart?: StockChartPayload
    activeSymbol: string
    chartData: StockChartPayload[]
  }>({ activeSymbol: '', chartData: [] })

  const activeChart = chartData.find((c) => c.symbol === activeSymbol) ?? chartData[0]
  chartContextRef.current = { activeChart, activeSymbol, chartData }
  const availableRanges = activeChart ? queryAvailableRanges(activeChart) : []
  const rawBars = activeChart ? queryBarsForRange(activeChart, activeRange) : []
  // 当天模式下用最新价修补最后一根，保证预览实时跳动
  const displayBars =
    activeRange === 'today'
      ? queryPatchBarsWithQuote(rawBars, activeChart?.quote)
      : rawBars
  const analysis = activeChart?.analysis
  const isLiveMode = liveRefresh && activeRange === 'today'

  useEffect(() => {
    setChartData(charts)
    if (charts[0]) {
      setActiveSymbol(charts[0].symbol)
      setActiveRange(queryDefaultRange(charts[0], liveRefresh))
    }
  }, [charts, liveRefresh])

  useEffect(() => {
    if (!chartData.length) return
    if (!chartData.some((c) => c.symbol === activeSymbol)) {
      setActiveSymbol(chartData[0].symbol)
      setActiveRange(queryDefaultRange(chartData[0], liveRefresh))
    }
  }, [chartData, activeSymbol, liveRefresh])

  /** 拉取指定周期最新数据（含实时行情）；返回是否成功 */
  const postRefresh = useCallback(
    async (range: StockKlineRange, silent = false): Promise<boolean> => {
      const { activeChart: chart } = chartContextRef.current
      if (!chart) return false
      if (!silent) setRefreshing(true)
      try {
        const existingBars = queryBarsForRange(chart, range)
        const req: AshareKlineRefreshRequest = {
          symbol: chart.symbol,
          name: chart.name,
          range,
          existingBars,
          ...(range === 'custom'
            ? {
              startDate:
                chart.startDate != null ? String(chart.startDate) : undefined,
              endDate: chart.endDate != null ? String(chart.endDate) : undefined
            }
            : {})
        }
        const updated = await queryAshareKlineRefresh(req)
        if (!updated) return false
        setLastRefreshAt(Date.now())
        setChartData((prev) =>
          prev.map((c) =>
            c.symbol === updated.symbol
              ? {
                ...c,
                analysis: updated.analysis ?? c.analysis,
                quote: updated.quote ?? c.quote,
                rangeBars: { ...c.rangeBars, [range]: updated.bars },
                bars: range === c.range ? updated.bars : c.bars
              }
              : c
          )
        )
        return true
      } catch {
        return false
      } finally {
        if (!silent) setRefreshing(false)
      }
    },
    []
  )

  /** 用户点击刷新：立即重拉当前周期 K 线与实时行情 */
  const handleManualRefresh = useCallback(async (): Promise<void> => {
    const ok = await postRefresh(activeRange, false)
    if (ok) {
      setPollEpoch((n) => n + 1)
      message.success('已刷新实时数据')
    } else {
      message.warning('刷新失败，请稍后重试')
    }
  }, [activeRange, postRefresh])

  // 切换股票/周期：立即刷新
  useEffect(() => {
    if (!activeChart) return
    void postRefresh(activeRange, true)
  }, [activeChart?.symbol, activeRange, postRefresh])

  // 当天实时：定时轮询完整分时 K 线
  useEffect(() => {
    if (!isLiveMode || !activeChart) return

    const timer = window.setInterval(() => {
      void postRefresh('today', true)
    }, LIVE_KLINE_MS)

    return () => window.clearInterval(timer)
  }, [isLiveMode, activeChart?.symbol, pollEpoch, postRefresh])

  useEffect(() => {
    const el = chartRef.current
    if (!el || !activeChart || displayBars.length === 0) return

    if (!instanceRef.current) {
      instanceRef.current = echarts.init(el)
    }
    const chart = instanceRef.current

    const dates = displayBars.map((b) => b.date)
    const ohlc = displayBars.map((b) => [b.open, b.close, b.low, b.high])
    const volumes = displayBars.map((b) => b.volume)
    const closes = displayBars.map((b) => b.close)
    const ma5 = closes.map((_, i) => {
      if (i < 4) return null
      return closes.slice(i - 4, i + 1).reduce((a, b) => a + b, 0) / 5
    })
    const ma20 = closes.map((_, i) => {
      if (i < 19) return null
      return closes.slice(i - 19, i + 1).reduce((a, b) => a + b, 0) / 20
    })

    const buyPoints = (analysis?.tradeSignals ?? [])
      .filter((s) => s.type === 'buy')
      .map((s) => {
        if (!dates.includes(s.date)) return null
        return { name: '买', coord: [s.date, s.price] as [string, number], value: s.price }
      })
      .filter(Boolean)

    const sellPoints = (analysis?.tradeSignals ?? [])
      .filter((s) => s.type === 'sell')
      .map((s) => {
        if (!dates.includes(s.date)) return null
        return { name: '卖', coord: [s.date, s.price] as [string, number], value: s.price }
      })
      .filter(Boolean)

    chart.setOption(
      {
        animation: false,
        legend: { data: ['K线', 'MA5', 'MA20', '成交量'], top: 4 },
        tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
        grid: [
          { left: 52, right: 16, top: 32, height: '55%' },
          { left: 52, right: 16, top: '74%', height: '16%' }
        ],
        xAxis: [
          { type: 'category', data: dates, boundaryGap: true, axisLine: { onZero: false } },
          {
            type: 'category',
            gridIndex: 1,
            data: dates,
            boundaryGap: true,
            axisLabel: { show: false }
          }
        ],
        yAxis: [
          { scale: true, splitArea: { show: true } },
          { scale: true, gridIndex: 1, splitNumber: 2, axisLabel: { show: false } }
        ],
        dataZoom: [
          {
            type: 'inside',
            xAxisIndex: [0, 1],
            // 当天分时默认看全天，其它周期看后半段
            start: activeRange === 'today' ? 0 : 55,
            end: 100
          },
          {
            show: true,
            xAxisIndex: [0, 1],
            type: 'slider',
            bottom: 4,
            height: 18,
            start: activeRange === 'today' ? 0 : 55,
            end: 100
          }
        ],
        series: [
          {
            name: 'K线',
            type: 'candlestick',
            data: ohlc,
            markPoint: {
              data: [
                ...buyPoints.map((p) => ({
                  ...p!,
                  symbol: 'pin',
                  symbolSize: 40,
                  itemStyle: { color: '#ef5350' }
                })),
                ...sellPoints.map((p) => ({
                  ...p!,
                  symbol: 'pin',
                  symbolSize: 40,
                  itemStyle: { color: '#26a69a' }
                }))
              ]
            },
            itemStyle: {
              color: '#ef5350',
              color0: '#26a69a',
              borderColor: '#ef5350',
              borderColor0: '#26a69a'
            }
          },
          {
            name: 'MA5',
            type: 'line',
            data: ma5,
            smooth: true,
            showSymbol: false,
            lineStyle: { width: 1, color: '#f6c022' }
          },
          {
            name: 'MA20',
            type: 'line',
            data: ma20,
            smooth: true,
            showSymbol: false,
            lineStyle: { width: 1, color: '#7b6cff' }
          },
          {
            name: '成交量',
            type: 'bar',
            xAxisIndex: 1,
            yAxisIndex: 1,
            data: volumes,
            itemStyle: { color: 'rgba(84, 112, 198, 0.45)' }
          }
        ]
      },
      true
    )

    const onResize = (): void => chart.resize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [activeChart, displayBars, activeRange, analysis])

  useEffect(() => {
    return () => {
      instanceRef.current?.dispose()
      instanceRef.current = null
    }
  }, [])

  if (!chartData.length) return null

  const stockTabItems = chartData.map((c) => ({
    key: c.symbol,
    label: `${c.name} ${c.symbol}`
  }))

  const rangeTabItems = availableRanges.map((r) => ({
    key: r,
    label: STOCK_RANGE_LABELS[r]
  }))

  const signalTag = querySignalTag(analysis?.overallSignal)
  const trendTag = queryTrendTag(analysis?.trend)
  const prediction = analysis?.prediction
  const clock = queryFormatClock(lastRefreshAt ?? activeChart?.quote?.updatedAt)
  const quote = activeChart?.quote
  const rangeLabel = STOCK_RANGE_LABELS[activeRange]

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        {chartData.length > 1 ? (
          <Tabs
            className={styles.tabs}
            size="small"
            activeKey={activeSymbol}
            items={stockTabItems}
            onChange={(key) => {
              setActiveSymbol(key)
              const next = chartData.find((c) => c.symbol === key)
              if (next) setActiveRange(queryDefaultRange(next, liveRefresh))
            }}
          />
        ) : null}
        {rangeTabItems.length > 1 ? (
          <Tabs
            size="small"
            type="card"
            activeKey={activeRange}
            items={rangeTabItems}
            onChange={(key) => setActiveRange(key as StockKlineRange)}
          />
        ) : null}
        <div className={styles.liveActions}>
          {isLiveMode || lastRefreshAt ? (
            <Tag color="processing" className={styles.liveTag}>
              {refreshing ? '刷新中…' : isLiveMode ? '实时' : '已更新'}
              {clock ? ` · ${clock}` : ''}
            </Tag>
          ) : null}
          <Button
            size="small"
            type="link"
            loading={refreshing}
            onClick={() => void handleManualRefresh()}
          >
            刷新
          </Button>
        </div>
      </div>

      {activeChart ? (
        <div className={styles.chartMeta} aria-label="K线标题与现价">
          <span className={styles.chartMetaTitle}>
            {activeChart.name}（{activeChart.symbol}）{rangeLabel}
          </span>
          {quote != null ? (
            <span
              className={
                quote.changePct >= 0 ? styles.chartMetaQuoteUp : styles.chartMetaQuoteDown
              }
            >
              现价 {quote.price.toFixed(2)}（{quote.changePct >= 0 ? '+' : ''}
              {quote.changePct.toFixed(2)}%）
            </span>
          ) : null}
        </div>
      ) : null}

      <div ref={chartRef} className={styles.chart} role="img" aria-label="A股实时K线图" />

      {analysis ? (
        <Card size="small" className={styles.analysis} title="综合分析">
          <div className={styles.signalRow}>
            <Tag color={signalTag.color}>综合信号：{signalTag.label}</Tag>
            <Tag color={trendTag.color}>趋势：{trendTag.label}</Tag>
            {prediction ? (
              <Tag
                color={
                  prediction.direction === 'up'
                    ? 'red'
                    : prediction.direction === 'down'
                      ? 'green'
                      : 'default'
                }
              >
                预测：
                {prediction.direction === 'up'
                  ? '看涨'
                  : prediction.direction === 'down'
                    ? '看跌'
                    : '横盘'}
                （{prediction.confidence}%）
              </Tag>
            ) : null}
          </div>
          {prediction ? (
            <div className={styles.prediction}>
              {prediction.horizon}
              {prediction.targetPrice != null
                ? ` · 参考目标价 ${prediction.targetPrice} · 止损 ${prediction.stopLoss}`
                : ''}
              {prediction.changePctEstimate != null
                ? ` · 预估幅度 ${prediction.changePctEstimate >= 0 ? '+' : ''}${prediction.changePctEstimate}%`
                : ''}
            </div>
          ) : null}
          {analysis.tradeSignals.length > 0 ? (
            <List
              size="small"
              dataSource={analysis.tradeSignals.slice(-4)}
              renderItem={(item) => (
                <List.Item>
                  <Tag color={item.type === 'buy' ? 'red' : 'green'}>
                    {item.type === 'buy' ? '买入' : '卖出'}
                  </Tag>
                  {item.date} @ {item.price.toFixed(2)} — {item.reason}
                </List.Item>
              )}
            />
          ) : null}
          <div className={styles.disclaimer}>
            以上分析基于技术指标规则引擎生成，仅供流程演示，不构成投资建议。
          </div>
        </Card>
      ) : null}
    </div>
  )
}
