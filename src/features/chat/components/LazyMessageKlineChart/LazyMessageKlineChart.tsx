import { lazy, Suspense } from 'react'
import type { StockChartPayload } from '@shared/stock-chart'
import styles from './LazyMessageKlineChart.module.css'

const MessageKlineChart = lazy(() =>
  import('../MessageKlineChart/MessageKlineChart').then((m) => ({
    default: m.MessageKlineChart
  }))
)

interface LazyMessageKlineChartProps {
  charts: StockChartPayload[]
  liveRefresh?: boolean
}

/** K 线图懒加载：仅在消息含股票图表时拉取 echarts */
export function LazyMessageKlineChart(
  props: LazyMessageKlineChartProps
): React.ReactElement | null {
  if (!props.charts?.length && !props.liveRefresh) return null

  return (
    <Suspense fallback={<div className={styles.skeleton} aria-hidden />}>
      <MessageKlineChart {...props} />
    </Suspense>
  )
}
