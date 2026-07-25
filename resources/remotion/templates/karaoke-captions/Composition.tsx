/**
 * 卡拉OK字幕短片模板（横版 16:9）。
 * apply 后覆盖为 ActiveTemplate；依赖 starter 组件 Subtitles / theme。
 */
import React from 'react'
import { AbsoluteFill } from 'remotion'
import { AnimatedText } from './components/AnimatedText'
import { KaraokeSubtitles, Subtitles, type Caption } from './components/Subtitles'
import { useFadeIn } from './lib/animations'
import {
  DARK_TECH,
  GRADIENTS,
  LIGHT_MINIMAL,
  PREMIUM_GOLD,
  type ColorTheme
} from './theme/colors'
import { FONT_SIZES, FONT_WEIGHTS, SPACING } from './theme/typography'

export interface KaraokeCaptionsProps {
  headline?: string
  theme?: 'DARK_TECH' | 'PREMIUM_GOLD' | 'LIGHT_MINIMAL'
  accentColor?: string
  captions?: Caption[]
  karaoke?: boolean
  fontSize?: number
}

const THEMES: Record<string, ColorTheme> = {
  DARK_TECH,
  PREMIUM_GOLD,
  LIGHT_MINIMAL
}

const BACKGROUNDS: Record<string, string> = {
  DARK_TECH: GRADIENTS.deepOcean,
  PREMIUM_GOLD: GRADIENTS.midnight,
  LIGHT_MINIMAL: GRADIENTS.aurora
}

const DEFAULT_CAPTIONS: Caption[] = [
  { text: '欢迎来到灵犀 AI', startMs: 0, endMs: 2500 },
  { text: '用代码驱动每一个像素', startMs: 2500, endMs: 5000 },
  { text: '精确控制每一帧动画', startMs: 5000, endMs: 7500 },
  { text: '让创意无限延伸', startMs: 7500, endMs: 10000 }
]

const KaraokeCaptionsComposition: React.FC<KaraokeCaptionsProps> = ({
  headline = '今日 AI 热点速览',
  theme = 'DARK_TECH',
  accentColor,
  captions = DEFAULT_CAPTIONS,
  karaoke = true,
  fontSize = 56
}) => {
  const palette = THEMES[theme] ?? DARK_TECH
  const accent = accentColor || palette.primary
  const bgOpacity = useFadeIn(0, 20)

  return (
    <AbsoluteFill
      style={{
        background: BACKGROUNDS[theme] ?? GRADIENTS.deepOcean,
        opacity: bgOpacity
      }}
    >
      <AbsoluteFill
        style={{
          justifyContent: 'flex-start',
          alignItems: 'center',
          paddingTop: SPACING.xxl
        }}
      >
        <AnimatedText
          text={headline}
          startFrame={10}
          duration={40}
          style={{
            fontSize: FONT_SIZES.h2,
            fontWeight: FONT_WEIGHTS.bold,
            color: palette.text,
            display: 'block',
            borderBottom: `3px solid ${accent}`,
            paddingBottom: SPACING.sm
          }}
        />
      </AbsoluteFill>

      {karaoke ? (
        <KaraokeSubtitles
          captions={captions}
          fontSize={fontSize}
          highlightColor={accent}
          bottomOffset={140}
        />
      ) : (
        <Subtitles
          captions={captions}
          fontSize={fontSize}
          textColor={palette.text}
          bottomOffset={140}
        />
      )}
    </AbsoluteFill>
  )
}

export default KaraokeCaptionsComposition
