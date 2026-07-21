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
import { queryAnalyzeStockChart } from '@shared/stock-analysis'
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

interface MessageKlineChartProps {
  charts: StockChartPayload[]
  /** 兼容旧字段；不再触发自动轮询，仅影响默认展示周期 */
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
  /**
   * 按「当前展示周期」的 K 线本地重算买卖信号。
   * 原因：消息里的 analysis 只对应工具拉取时的主周期；关掉自动刷新后，
   * 若仍直接用 payload.analysis，切周期或首次展示会出现买卖点缺失，
   * 只有点「刷新」走 IPC 重算后才出来。
   */
  const analysis = useMemo(() => {
    if (!activeChart || displayBars.length === 0) return activeChart?.analysis
    try {
      return queryAnalyzeStockChart({
        ...activeChart,
        range: activeRange,
        bars: displayBars
      })
    } catch {
      return activeChart.analysis
    }
  }, [activeChart, activeRange, displayBars])

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

  /**
   * 手动刷新：走 query_ashare_realtime_analysis 同源 IPC，
   * 重新拉取多周期 K 线 + 综合分析（非轻量行情修补）。
   */
  const postRefresh = useCallback(
    async (range: StockKlineRange, silent = false): Promise<boolean> => {
      const { activeChart: chart } = chartContextRef.current
      if (!chart) return false
      if (!silent) setRefreshing(true)
      try {
        const req: AshareKlineRefreshRequest = {
          symbol: chart.symbol,
          name: chart.name,
          range,
          ...(range === 'custom'
            ? {
                startDate:
                  chart.startDate != null ? String(chart.startDate) : undefined,
                endDate: chart.endDate != null ? String(chart.endDate) : undefined
              }
            : {})
        }
        // IPC 内部调用 queryAshareRealtimeAnalysisCharts（与工具同逻辑）
        const updated = await queryAshareKlineRefresh(req)
        if (!updated) return false
        setLastRefreshAt(Date.now())
        // 整表替换：含 rangeBars / analysis / quote，与工具首次返回结构一致
        setChartData((prev) =>
          prev.map((c) => (c.symbol === updated.symbol ? updated : c))
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

  /** 用户点击刷新：用 realtime analysis 工具链路重拉当前股票 */
  const handleManualRefresh = useCallback(async (): Promise<void> => {
    const ok = await postRefresh(activeRange, false)
    if (ok) {
      message.success('已重新拉取实时分析')
    } else {
      message.warning('刷新失败，请稍后重试')
    }
  }, [activeRange, postRefresh])

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
        legend: { data: ['K线', '5日均线', '20日均线', '成交量'], top: 4 },
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'cross' },
          // candlestick 默认展示 open/close/lowest/highest，映射为 A 股常用中文
          formatter: (params: unknown) => {
            const items = Array.isArray(params) ? params : [params]
            if (!items.length) return ''
            const axisValue = String(
              (items[0] as { axisValueLabel?: string; axisValue?: string }).axisValueLabel ??
                (items[0] as { axisValue?: string }).axisValue ??
                ''
            )
            const lines: string[] = [axisValue]
            for (const raw of items) {
              const item = raw as {
                seriesName?: string
                marker?: string
                value?: number | number[] | null
                data?: number | number[] | null
              }
              const marker = item.marker ?? ''
              const name = item.seriesName ?? ''
              const value = item.value ?? item.data
              if (name === 'K线' && Array.isArray(value) && value.length >= 4) {
                // ECharts candlestick 数据顺序：[open, close, lowest, highest]
                const [open, close, lowest, highest] = value as number[]
                lines.push(`${marker}${name}`)
                lines.push(`开盘：${Number(open).toFixed(2)}`)
                lines.push(`收盘：${Number(close).toFixed(2)}`)
                lines.push(`最低：${Number(lowest).toFixed(2)}`)
                lines.push(`最高：${Number(highest).toFixed(2)}`)
                continue
              }
              if (typeof value === 'number' && Number.isFinite(value)) {
                const text =
                  name === '成交量'
                    ? value.toLocaleString('zh-CN')
                    : value.toFixed(2)
                lines.push(`${marker}${name}：${text}`)
              }
            }
            return lines.join('<br/>')
          }
        },
        // 主图与成交量分栏；底部预留标签 + dataZoom 滑条，避免 xlabel 压住成交量
        grid: [
          { left: 52, right: 16, top: 32, height: '52%' },
          { left: 52, right: 16, top: '66%', bottom: 52 }
        ],
        xAxis: [
          {
            type: 'category',
            data: dates,
            boundaryGap: true,
            axisLine: {
              onZero: false, lineStyle: {
                color: '#1890ff', // 自定义轴线颜色，支持十六进制/rgb/rgba
                width: 1,
                type: 'dashed'
              }
            },
            // 标签只画在下方成交量轴，避免夹在两图之间挡住成交量
            axisLabel: { show: false },
            axisTick: { show: false }
          },
          {
            type: 'category',
            gridIndex: 1,
            data: dates,
            boundaryGap: true,
            axisLine: {
              onZero: false, lineStyle: {
                color: '#1890ff', // 自定义轴线颜色，支持十六进制/rgb/rgba
                width: 1,
                type: 'dashed'
              }
            },
            axisLabel: {
              color: '#8c8c8c',
              fontSize: 11,
              hideOverlap: true,
              // 当天分时日期很长，只展示 HH:mm，减少拥挤与旋转需求
              formatter: (value: string) => {
                if (activeRange === 'today' && value.includes(' ')) {
                  const time = value.split(' ')[1] ?? value
                  return time.slice(0, 5)
                }
                return value
              }
            }
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
            name: '5日均线',
            type: 'line',
            data: ma5,
            smooth: true,
            showSymbol: false,
            lineStyle: { width: 1, color: '#f6c022' }
          },
          {
            name: '20日均线',
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
          {lastRefreshAt ? (
            <Tag color="processing" className={styles.liveTag}>
              {refreshing ? '刷新中…' : '已更新'}
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
