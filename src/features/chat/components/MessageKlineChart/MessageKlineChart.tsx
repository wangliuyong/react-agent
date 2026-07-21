import * as echarts from 'echarts/core'
import { CandlestickChart, BarChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  LegendComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { StockChartPayload } from '@shared/stock-chart'
import styles from './MessageKlineChart.module.css'

echarts.use([
  CandlestickChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  LegendComponent,
  CanvasRenderer
])

const PERIOD_LABEL: Record<string, string> = {
  daily: '日K',
  weekly: '周K',
  monthly: '月K'
}

interface MessageKlineChartProps {
  charts: StockChartPayload[]
}

/**
 * 聊天内 A 股 K 线预览：ECharts 蜡烛图 + 成交量，多股 Tab 切换。
 */
export function MessageKlineChart({ charts }: MessageKlineChartProps): React.ReactElement | null {
  const [activeSymbol, setActiveSymbol] = useState(charts[0]?.symbol ?? '')
  const chartRef = useRef<HTMLDivElement | null>(null)
  const instanceRef = useRef<echarts.ECharts | null>(null)

  const activeChart = charts.find((c) => c.symbol === activeSymbol) ?? charts[0]

  useEffect(() => {
    if (!charts.length) return
    if (!charts.some((c) => c.symbol === activeSymbol)) {
      setActiveSymbol(charts[0].symbol)
    }
  }, [charts, activeSymbol])

  useEffect(() => {
    const el = chartRef.current
    if (!el || !activeChart?.bars.length) return

    if (!instanceRef.current) {
      instanceRef.current = echarts.init(el)
    }
    const chart = instanceRef.current

    const dates = activeChart.bars.map((b) => b.date)
    const ohlc = activeChart.bars.map((b) => [b.open, b.close, b.low, b.high])
    const volumes = activeChart.bars.map((b) => b.volume)
    const periodLabel = PERIOD_LABEL[activeChart.period] ?? activeChart.period

    chart.setOption(
      {
        animation: false,
        legend: { data: ['K线', '成交量'], top: 4 },
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'cross' }
        },
        grid: [
          { left: 48, right: 16, top: 36, height: '58%' },
          { left: 48, right: 16, top: '72%', height: '18%' }
        ],
        xAxis: [
          { type: 'category', data: dates, boundaryGap: true, axisLine: { onZero: false } },
          { type: 'category', gridIndex: 1, data: dates, boundaryGap: true, axisLabel: { show: false } }
        ],
        yAxis: [
          { scale: true, splitArea: { show: true } },
          { scale: true, gridIndex: 1, splitNumber: 2, axisLabel: { show: false } }
        ],
        dataZoom: [
          { type: 'inside', xAxisIndex: [0, 1], start: 60, end: 100 },
          { show: true, xAxisIndex: [0, 1], type: 'slider', bottom: 4, height: 18, start: 60, end: 100 }
        ],
        series: [
          {
            name: 'K线',
            type: 'candlestick',
            data: ohlc,
            itemStyle: {
              color: '#ef5350',
              color0: '#26a69a',
              borderColor: '#ef5350',
              borderColor0: '#26a69a'
            }
          },
          {
            name: '成交量',
            type: 'bar',
            xAxisIndex: 1,
            yAxisIndex: 1,
            data: volumes,
            itemStyle: { color: 'rgba(84, 112, 198, 0.45)' }
          }
        ],
        title: {
          text: `${activeChart.name}（${activeChart.symbol}）${periodLabel}`,
          left: 8,
          top: 0,
          textStyle: { fontSize: 13, fontWeight: 500 }
        }
      },
      true
    )

    const onResize = (): void => chart.resize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
    }
  }, [activeChart])

  useEffect(() => {
    return () => {
      instanceRef.current?.dispose()
      instanceRef.current = null
    }
  }, [])

  if (!charts.length) return null

  const tabItems = charts.map((c) => ({
    key: c.symbol,
    label: `${c.name} ${c.symbol}`
  }))

  return (
    <div className={styles.wrap}>
      {charts.length > 1 ? (
        <Tabs
          className={styles.tabs}
          size="small"
          activeKey={activeSymbol}
          items={tabItems}
          onChange={setActiveSymbol}
        />
      ) : null}
      <div ref={chartRef} className={styles.chart} role="img" aria-label="A股K线图" />
    </div>
  )
}
