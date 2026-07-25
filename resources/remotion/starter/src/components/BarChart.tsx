/**
 * 数据可视化组件
 * 柱状图动画，常用于数据展示、对比分析
 */

import React from 'react'
import { useCurrentFrame, interpolate, Easing } from 'remotion'
import { DEFAULT_THEME } from '../theme/colors'
import { FONT_SIZES, FONT_WEIGHTS, SPACING } from '../theme/typography'

export interface BarChartData {
  label: string
  value: number
  color?: string
}

interface BarChartProps {
  data: BarChartData[]
  title?: string
  /** 起始帧 */
  startFrame?: number
  /** 动画总时长 */
  duration?: number
  /** 每个柱子的错落延迟 */
  stagger?: number
  /** 图表高度 */
  chartHeight?: number
  /** 柱子宽度比例 */
  barWidthRatio?: number
  /** 是否显示数值 */
  showValues?: boolean
  /** 背景色 */
  backgroundColor?: string
  /** 文字颜色 */
  textColor?: string
}

/**
 * 柱状图动画组件
 * 柱子从底部增长到目标高度，带错落效果
 */
export const BarChart: React.FC<BarChartProps> = ({
  data,
  title,
  startFrame = 0,
  duration = 60,
  stagger = 8,
  chartHeight = 400,
  barWidthRatio = 0.6,
  showValues = true,
  backgroundColor = 'transparent',
  textColor = DEFAULT_THEME.text
}) => {
  const frame = useCurrentFrame()
  const maxValue = Math.max(...data.map((d) => d.value))
  const barCount = data.length

  return (
    <div
      style={{
        width: '100%',
        padding: SPACING.xl,
        backgroundColor,
        borderRadius: 16
      }}
    >
      {title && (
        <h3
          style={{
            fontSize: FONT_SIZES.h3,
            fontWeight: FONT_WEIGHTS.semibold,
            color: textColor,
            marginBottom: SPACING.lg,
            marginTop: 0
          }}
        >
          {title}
        </h3>
      )}

      <div
        style={{
          height: chartHeight,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-around',
          gap: SPACING.md,
          paddingBottom: SPACING.lg
        }}
      >
        {data.map((item, index) => {
          const barStart = startFrame + index * stagger
          const barDuration = duration - index * stagger
          const progress = interpolate(frame, [barStart, barStart + barDuration], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.out(Easing.cubic)
          })

          const barHeight = (item.value / maxValue) * chartHeight * 0.85
          const currentHeight = barHeight * progress

          return (
            <div
              key={index}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                height: '100%'
              }}
            >
              {showValues && (
                <div
                  style={{
                    fontSize: FONT_SIZES.bodySm,
                    fontWeight: FONT_WEIGHTS.semibold,
                    color: textColor,
                    marginBottom: SPACING.xs,
                    opacity: progress
                  }}
                >
                  {Math.round(item.value * progress)}
                </div>
              )}
              <div
                style={{
                  width: `${barWidthRatio * 100}%`,
                  height: currentHeight,
                  background: item.color || DEFAULT_THEME.primary,
                  borderRadius: '8px 8px 0 0',
                  minHeight: 2
                }}
              />
              <div
                style={{
                  fontSize: FONT_SIZES.caption,
                  color: DEFAULT_THEME.textSecondary,
                  marginTop: SPACING.sm,
                  textAlign: 'center',
                  opacity: Math.min(1, progress * 2)
                }}
              >
                {item.label}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
