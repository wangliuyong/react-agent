import React from 'react'
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig
} from 'remotion'
import { useSlideUp } from '../../lib/animations'
import { HotNewsBackground } from './HotNewsBackground'
import { HotNewsTicker } from './HotNewsTicker'
import type { HotNewsProps } from './types'

const DISPLAY_FONT =
  '"Songti SC", "Noto Serif CJK SC", "Source Han Serif SC", Georgia, "Times New Roman", serif'
const UI_FONT = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", system-ui, sans-serif'

/** 顶栏：品牌、日期、直播标识 */
const HotNewsTopBar: React.FC<{
  brandName: string
  dateLabel: string
  accentColor: string
  compact?: boolean
}> = ({ brandName, dateLabel, accentColor, compact }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const reveal = spring({ frame, fps, config: { damping: 18, stiffness: 120 }, from: 0, to: 1 })
  const pulse = 0.55 + Math.sin((frame / fps) * Math.PI * 2) * 0.45

  return (
    <div
      style={{
        position: 'absolute',
        top: compact ? 48 : 64,
        left: compact ? 32 : 72,
        right: compact ? 32 : 72,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        opacity: reveal,
        transform: `translateY(${(1 - reveal) * -24}px)`
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 12 : 20 }}>
        <div
          style={{
            padding: compact ? '6px 14px' : '8px 18px',
            borderRadius: 4,
            background: accentColor,
            color: '#fff',
            fontFamily: UI_FONT,
            fontSize: compact ? 20 : 26,
            fontWeight: 800,
            letterSpacing: '0.08em'
          }}
        >
          热点
        </div>
        <span
          style={{
            fontFamily: UI_FONT,
            fontSize: compact ? 22 : 28,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.95)'
          }}
        >
          {brandName}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: '#ff3b30',
            boxShadow: `0 0 ${8 + pulse * 10}px rgba(255, 59, 48, 0.85)`,
            opacity: pulse
          }}
        />
        <span
          style={{
            fontFamily: UI_FONT,
            fontSize: compact ? 18 : 22,
            color: 'rgba(255,255,255,0.72)',
            letterSpacing: '0.04em'
          }}
        >
          {dateLabel}
        </span>
      </div>
    </div>
  )
}

/** 主标题区 */
const HotNewsHero: React.FC<{
  headline: string
  summary: string
  accentColor: string
  compact?: boolean
}> = ({ headline, summary, accentColor, compact }) => {
  const frame = useCurrentFrame()
  const titleAnim = useSlideUp(8, 36, compact ? 28 : 36)
  const summaryOpacity = interpolate(frame, [28, 52], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  })

  return (
    <div
      style={{
        position: 'absolute',
        left: compact ? 32 : 72,
        right: compact ? 32 : 72,
        top: compact ? '28%' : '32%',
        maxWidth: compact ? '100%' : '78%'
      }}
    >
      <div
        style={{
          width: compact ? 56 : 96,
          height: 4,
          background: accentColor,
          marginBottom: compact ? 16 : 28,
          opacity: titleAnim.opacity,
          transform: `scaleX(${titleAnim.opacity})`,
          transformOrigin: 'left center'
        }}
      />
      <h1
        style={{
          margin: 0,
          fontFamily: DISPLAY_FONT,
          fontSize: compact ? 52 : 76,
          fontWeight: 700,
          lineHeight: 1.12,
          color: '#fafafa',
          opacity: titleAnim.opacity,
          transform: `translateY(${titleAnim.translateY}px)`,
          textShadow: '0 8px 32px rgba(0,0,0,0.45)'
        }}
      >
        {headline}
      </h1>
      <p
        style={{
          margin: compact ? '20px 0 0' : '28px 0 0',
          fontFamily: UI_FONT,
          fontSize: compact ? 22 : 30,
          lineHeight: 1.55,
          color: 'rgba(255,255,255,0.78)',
          opacity: summaryOpacity,
          maxWidth: compact ? '100%' : '92%'
        }}
      >
        {summary}
      </p>
    </div>
  )
}

/** 分条快讯轮播 */
const HotNewsItemStrip: React.FC<{
  items: HotNewsProps['items']
  accentColor: string
  compact?: boolean
}> = ({ items, accentColor, compact }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const slotFrames = Math.floor(fps * 3.2)
  const index = Math.min(items.length - 1, Math.floor(frame / slotFrames))
  const local = frame - index * slotFrames
  const item = items[index] ?? items[0]

  const enter = spring({
    frame: local,
    fps,
    config: { damping: 16, stiffness: 140 },
    from: 0,
    to: 1
  })

  return (
    <div
      style={{
        position: 'absolute',
        left: compact ? 32 : 72,
        right: compact ? 32 : 72,
        bottom: compact ? 120 : 140,
        display: 'flex',
        alignItems: 'stretch',
        gap: compact ? 16 : 24,
        opacity: enter,
        transform: `translateX(${(1 - enter) * 40}px)`
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: compact ? 88 : 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: UI_FONT,
          fontSize: compact ? 22 : 28,
          fontWeight: 800,
          color: '#fff',
          background: `linear-gradient(160deg, ${accentColor} 0%, color-mix(in srgb, ${accentColor} 70%, #000) 100%)`,
          borderRadius: 8,
          letterSpacing: '0.06em'
        }}
      >
        {item.tag}
      </div>
      <div
        style={{
          flex: 1,
          padding: compact ? '16px 20px' : '20px 28px',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(8px)',
          fontFamily: UI_FONT,
          fontSize: compact ? 24 : 32,
          fontWeight: 600,
          lineHeight: 1.35,
          color: 'rgba(255,255,255,0.94)'
        }}
      >
        {item.title}
      </div>
    </div>
  )
}

/** 片头闪屏 */
const HotNewsSting: React.FC<{ accentColor: string }> = ({ accentColor }) => {
  const frame = useCurrentFrame()
  const scale = interpolate(frame, [0, 18, 36], [1.15, 1, 0.98], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  })
  const opacity = interpolate(frame, [0, 8, 50, 70], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  })

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        opacity,
        background: `radial-gradient(circle at center, color-mix(in srgb, ${accentColor} 35%, #000) 0%, #050608 70%)`
      }}
    >
      <div style={{ transform: `scale(${scale})`, textAlign: 'center' }}>
        <div
          style={{
            fontFamily: UI_FONT,
            fontSize: 28,
            letterSpacing: '0.35em',
            color: 'rgba(255,255,255,0.65)',
            marginBottom: 16
          }}
        >
          BREAKING
        </div>
        <div
          style={{
            fontFamily: DISPLAY_FONT,
            fontSize: 88,
            fontWeight: 700,
            color: '#fff',
            textShadow: `0 0 48px color-mix(in srgb, ${accentColor} 50%, transparent)`
          }}
        >
          热点新闻
        </div>
      </div>
    </AbsoluteFill>
  )
}

/**
 * 热点新闻 Remotion 模板（横竖屏自适应）。
 * 时间轴：片头 → 主标题 → 分条轮播（全程底部滚动字幕）。
 */
export const HotNewsComposition: React.FC<HotNewsProps> = (props) => {
  const {
    brandName,
    dateLabel,
    headline,
    summary,
    items,
    accentColor = '#e63946'
  } = props

  const { width, height } = useVideoConfig()
  const compact = height > width

  return (
    <AbsoluteFill style={{ fontFamily: UI_FONT }}>
      <HotNewsBackground accentColor={accentColor} />

      <Sequence from={0} durationInFrames={75}>
        <HotNewsSting accentColor={accentColor} />
      </Sequence>

      <Sequence from={60} durationInFrames={540}>
        <HotNewsTopBar
          brandName={brandName}
          dateLabel={dateLabel}
          accentColor={accentColor}
          compact={compact}
        />
        <HotNewsHero
          headline={headline}
          summary={summary}
          accentColor={accentColor}
          compact={compact}
        />
        <HotNewsItemStrip items={items} accentColor={accentColor} compact={compact} />
      </Sequence>

      <HotNewsTicker items={items} accentColor={accentColor} compact={compact} />
    </AbsoluteFill>
  )
}
