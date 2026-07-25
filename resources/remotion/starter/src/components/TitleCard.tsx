/**
 * 标题卡片组件
 * 用于章节标题、开场标题等场景，自带入场动画
 */

import React from 'react'
import { AbsoluteFill } from 'remotion'
import { useSlideUp, useFadeIn } from '../lib/animations'
import { DEFAULT_THEME } from '../theme/colors'
import { FONT_SIZES, FONT_WEIGHTS, SPACING } from '../theme/typography'

interface TitleCardProps {
  title: string
  subtitle?: string
  /** 起始帧 */
  startFrame?: number
  /** 动画时长 */
  duration?: number
  /** 标题颜色 */
  titleColor?: string
  /** 副标题颜色 */
  subtitleColor?: string
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right'
  /** 是否显示装饰线 */
  showAccentLine?: boolean
  /** 装饰线颜色 */
  accentColor?: string
}

export const TitleCard: React.FC<TitleCardProps> = ({
  title,
  subtitle,
  startFrame = 0,
  duration = 40,
  titleColor = DEFAULT_THEME.text,
  subtitleColor = DEFAULT_THEME.textSecondary,
  align = 'center',
  showAccentLine = true,
  accentColor = DEFAULT_THEME.primary
}) => {
  const titleAnim = useSlideUp(startFrame, duration, 30)
  const subtitleAnim = useSlideUp(startFrame + 15, duration, 20)
  const lineAnim = useFadeIn(startFrame + 10, duration)

  const justifyContent = align === 'center' ? 'center' : align === 'left' ? 'flex-start' : 'flex-end'
  const alignItems = align === 'center' ? 'center' : align === 'left' ? 'flex-start' : 'flex-end'
  const textAlign = align

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems,
        padding: `0 ${SPACING.xxl}px`
      }}
    >
      <div style={{ textAlign, maxWidth: '80%' }}>
        {showAccentLine && (
          <div
            style={{
              width: 80,
              height: 4,
              backgroundColor: accentColor,
              opacity: lineAnim,
              marginBottom: SPACING.lg,
              borderRadius: 2,
              marginLeft: align === 'center' ? 'auto' : 0,
              marginRight: align === 'center' ? 'auto' : 0
            }}
          />
        )}
        <h1
          style={{
            fontSize: FONT_SIZES.hero,
            fontWeight: FONT_WEIGHTS.bold,
            color: titleColor,
            opacity: titleAnim.opacity,
            transform: `translateY(${titleAnim.translateY}px)`,
            margin: 0,
            lineHeight: 1.1,
            letterSpacing: '-0.02em'
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              fontSize: FONT_SIZES.bodyLg,
              color: subtitleColor,
              opacity: subtitleAnim.opacity,
              transform: `translateY(${subtitleAnim.translateY}px)`,
              marginTop: SPACING.md,
              marginBottom: 0,
              lineHeight: 1.5
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </AbsoluteFill>
  )
}
