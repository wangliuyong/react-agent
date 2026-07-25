/**
 * 黑金品牌片头模板（竖版 9:16）。
 * apply 后覆盖为 ActiveTemplate；依赖会话工程内 starter 的 theme / components / lib。
 */
import React from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'
import { TitleCard } from './components/TitleCard'
import { useBreathing, useFadeIn } from './lib/animations'
import {
  DARK_TECH,
  GRADIENTS,
  LIGHT_MINIMAL,
  PREMIUM_GOLD,
  type ColorTheme
} from './theme/colors'
import { FONT_WEIGHTS, SPACING } from './theme/typography'

export interface BrandIntroProps {
  title?: string
  subtitle?: string
  theme?: 'DARK_TECH' | 'PREMIUM_GOLD' | 'LIGHT_MINIMAL'
  accentColor?: string
  titleSize?: number
  animationSpeed?: number
}

const THEMES: Record<string, ColorTheme> = {
  DARK_TECH,
  PREMIUM_GOLD,
  LIGHT_MINIMAL
}

const BACKGROUNDS: Record<string, string> = {
  DARK_TECH: GRADIENTS.deepOcean,
  PREMIUM_GOLD: GRADIENTS.midnight,
  LIGHT_MINIMAL: GRADIENTS.warmDark
}

const BrandIntroComposition: React.FC<BrandIntroProps> = ({
  title = '月社',
  subtitle = '用代码驱动每一个像素',
  theme = 'PREMIUM_GOLD',
  accentColor,
  titleSize = 88,
  animationSpeed = 1
}) => {
  const frame = useCurrentFrame()
  const speed = Math.max(0.5, Math.min(2, animationSpeed))
  const palette = THEMES[theme] ?? PREMIUM_GOLD
  const accent = accentColor || palette.primary
  const bgOpacity = useFadeIn(0, Math.round(24 / speed))
  const grain = interpolate(frame, [0, 30], [0, 0.04], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  })
  const breathe = useBreathing(0.015, 0.4)

  return (
    <AbsoluteFill
      style={{
        background: BACKGROUNDS[theme] ?? GRADIENTS.midnight,
        opacity: bgOpacity
      }}
    >
      <AbsoluteFill
        style={{
          opacity: grain,
          backgroundImage:
            'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.15) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(212,175,55,0.12) 0%, transparent 45%)',
          pointerEvents: 'none'
        }}
      />

      <AbsoluteFill style={{ transform: `scale(${breathe})` }}>
        <TitleCard
          title={title}
          subtitle={subtitle}
          startFrame={Math.round(8 / speed)}
          duration={Math.round(45 / speed)}
          titleColor={palette.text}
          subtitleColor={palette.textSecondary}
          accentColor={accent}
          align="center"
        />
      </AbsoluteFill>

      {/* titleSize 用于底部标注比例，主标题由 TitleCard 承担 */}
      <AbsoluteFill
        style={{
          justifyContent: 'flex-end',
          alignItems: 'center',
          paddingBottom: SPACING.xxl,
          opacity: interpolate(frame, [60, 90], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp'
          })
        }}
      >
        <span
          style={{
            fontSize: Math.max(14, Math.round(titleSize * 0.22)),
            fontWeight: FONT_WEIGHTS.medium,
            color: palette.textSecondary,
            letterSpacing: '0.2em',
            textTransform: 'uppercase'
          }}
        >
          Remotion Template
        </span>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

export default BrandIntroComposition
