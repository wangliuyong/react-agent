import { useEffect, useRef } from 'react'
import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { DB_THEME } from '@/styles/theme-tokens'
import styles from './WorkbenchCharts.module.css'

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  CanvasRenderer
])

export interface WorkbenchChartsProps {
  dayLabels: string[]
  activitySeries: number[]
  typeBreakdown: { name: string; value: number }[]
  topSessions: { title: string; tokens: number }[]
}

interface ChartHostProps {
  title: string
  subtitle?: string
  onMount: (el: HTMLDivElement) => () => void
  className?: string
}

/** 单个 ECharts 容器：负责 init/dispose 与 resize */
function ChartHost({ title, subtitle, onMount, className }: ChartHostProps): React.ReactElement {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    return onMount(el)
  }, [onMount])

  return (
    <article className={[styles.chartCard, className].filter(Boolean).join(' ')}>
      <header className={styles.chartHeader}>
        <h3 className={styles.chartTitle}>{title}</h3>
        {subtitle ? <p className={styles.chartSubtitle}>{subtitle}</p> : null}
      </header>
      <div ref={ref} className={styles.chartCanvas} role="img" aria-label={title} />
    </article>
  )
}

const axisStyle = {
  axisLine: { lineStyle: { color: DB_THEME.border } },
  axisLabel: { color: DB_THEME.textSecondary, fontSize: 11 },
  splitLine: { lineStyle: { color: DB_THEME.borderLight, type: 'dashed' as const } }
}

/**
 * 工作台统计图组：懒加载 echarts，减轻首屏体积。
 * 数据均来自本地会话聚合，无额外 IPC。
 */
export function WorkbenchCharts({
  dayLabels,
  activitySeries,
  typeBreakdown,
  topSessions
}: WorkbenchChartsProps): React.ReactElement {
  const activityMount = useCallback(
    (el: HTMLDivElement) => {
      const chart = echarts.init(el)
      chart.setOption({
        color: [DB_THEME.primary],
        grid: { left: 40, right: 16, top: 24, bottom: 28 },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: dayLabels, ...axisStyle },
        yAxis: { type: 'value', minInterval: 1, ...axisStyle },
        series: [
          {
            name: '活跃会话',
            type: 'line',
            smooth: true,
            symbol: 'circle',
            symbolSize: 6,
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(0, 87, 255, 0.28)' },
                { offset: 1, color: 'rgba(0, 87, 255, 0.02)' }
              ])
            },
            data: activitySeries
          }
        ]
      })
      const onResize = (): void => chart.resize()
      window.addEventListener('resize', onResize)
      return () => {
        window.removeEventListener('resize', onResize)
        chart.dispose()
      }
    },
    [activitySeries, dayLabels]
  )

  const typeMount = useCallback(
    (el: HTMLDivElement) => {
      const chart = echarts.init(el)
      chart.setOption({
        color: [DB_THEME.primary, DB_THEME.primaryLight, DB_THEME.success, DB_THEME.warning],
        tooltip: { trigger: 'item', formatter: '{b}：{c}（{d}%）' },
        legend: {
          bottom: 0,
          textStyle: { color: DB_THEME.textSecondary, fontSize: 11 }
        },
        series: [
          {
            type: 'pie',
            radius: ['42%', '68%'],
            center: ['50%', '44%'],
            itemStyle: { borderRadius: 6, borderColor: DB_THEME.bgContent, borderWidth: 2 },
            label: { show: false },
            data: typeBreakdown.length ? typeBreakdown : [{ name: '暂无数据', value: 1 }]
          }
        ]
      })
      const onResize = (): void => chart.resize()
      window.addEventListener('resize', onResize)
      return () => {
        window.removeEventListener('resize', onResize)
        chart.dispose()
      }
    },
    [typeBreakdown]
  )

  const tokenMount = useCallback(
    (el: HTMLDivElement) => {
      const chart = echarts.init(el)
      chart.setOption({
        color: [DB_THEME.primary],
        grid: { left: 12, right: 16, top: 16, bottom: 48, containLabel: true },
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        xAxis: {
          type: 'value',
          ...axisStyle
        },
        yAxis: {
          type: 'category',
          data: topSessions.map((s) => s.title),
          axisLabel: { color: DB_THEME.textSecondary, fontSize: 11, width: 88, overflow: 'truncate' },
          axisLine: { show: false },
          axisTick: { show: false }
        },
        series: [
          {
            name: 'Token',
            type: 'bar',
            barMaxWidth: 18,
            itemStyle: { borderRadius: [0, 6, 6, 0] },
            data: topSessions.map((s) => s.tokens)
          }
        ]
      })
      const onResize = (): void => chart.resize()
      window.addEventListener('resize', onResize)
      return () => {
        window.removeEventListener('resize', onResize)
        chart.dispose()
      }
    },
    [topSessions]
  )

  return (
    <div className={styles.grid}>
      <ChartHost
        title="近 7 日活跃"
        subtitle="按会话最后更新时间统计"
        onMount={activityMount}
      />
      <ChartHost title="会话类型" subtitle="对话 / 发布 / 定时 / 流程" onMount={typeMount} />
      {/* <ChartHost
        className={styles.wide}
        title="Token 消耗排行"
        subtitle="累计估算值，Top 8 会话"
        onMount={tokenMount}
      /> */}
    </div>
  )
}
