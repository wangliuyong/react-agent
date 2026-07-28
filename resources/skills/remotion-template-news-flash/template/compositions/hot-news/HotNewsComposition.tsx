import React from 'react'
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig
} from 'remotion'
import { HotNewsBackground } from './HotNewsBackground'
import { HotNewsTicker } from './HotNewsTicker'
import { queryHotNewsCarouselSlot } from './query-hot-news-carousel'
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

/**
 * 主标题区：按 items 定时轮播，展示 title + detail（详细播报）+ 数据来源。
 * 节奏由 secondsPerItem / items[].seconds 决定，与中部条带共用同一索引。
 */
const HotNewsHero: React.FC<{
  headline: string
  summary: string
  /** 全局数据来源（必填）；单条 items[].source 可覆写 */
  dataSource: string
  items: HotNewsProps['items']
  accentColor: string
  compact?: boolean
  mainDurationInFrames: number
  secondsPerItem?: number
}> = ({
  headline,
  summary,
  dataSource,
  items,
  accentColor,
  compact,
  mainDurationInFrames,
  secondsPerItem
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const slides =
    items.length > 0
      ? items
      : [{ tag: '热点', title: headline, detail: summary }]
  const { index, localFrame } = queryHotNewsCarouselSlot({
    frame,
    fps,
    mainDurationInFrames,
    itemCount: slides.length,
    secondsPerItem,
    itemSeconds: slides.map((s) => s.seconds)
  })
  const current = slides[index] ?? slides[0]
  const displayHeadline = current?.title || headline
  /** 优先展示检索后的详情；缺省回退 summary / 标签提示 */
  const displayDetail =
    (current?.detail && current.detail.trim()) ||
    (slides.length === 1 ? summary : '') ||
    `${current?.tag || '热点'}｜正在播报`
  /** 单条 source 优先，否则用全局 dataSource */
  const displaySource =
    (current?.source && current.source.trim()) || dataSource.trim() || '未标注'

  const enter = spring({
    frame: localFrame,
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
        top: compact ? '160px' : '200px',
        maxWidth: compact ? '100%' : '78%'
      }}
    >
      <div
        style={{
          width: compact ? 56 : 96,
          height: 4,
          background: accentColor,
          marginBottom: compact ? 16 : 28,
          opacity: enter,
          transform: `scaleX(${enter})`,
          transformOrigin: 'left center'
        }}
      />
      <h1
        style={{
          margin: 0,
          fontFamily: DISPLAY_FONT,
          fontSize: compact ? 44 : 68,
          fontWeight: 700,
          lineHeight: 1.15,
          color: '#fafafa',
          opacity: enter,
          transform: `translateY(${(1 - enter) * 28}px)`,
          textShadow: '0 8px 32px rgba(0,0,0,0.45)'
        }}
      >
        {displayHeadline}
      </h1>
      <p
        style={{
          margin: compact ? '16px 0 0' : '22px 0 0',
          fontFamily: UI_FONT,
          fontSize: compact ? 18 : 26,
          lineHeight: 1.55,
          color: 'rgba(255,255,255,0.82)',
          opacity: enter,
          maxWidth: compact ? '100%' : '92%',
          display: '-webkit-box',
          WebkitLineClamp: compact ? 5 : 4,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}
      >
        {displayDetail}
      </p>
      {/* 新闻成片强制可见的数据来源标注 */}
      <div
        style={{
          marginTop: compact ? 14 : 18,
          display: 'flex',
          alignItems: 'center',
          gap: compact ? 8 : 10,
          opacity: enter,
          transform: `translateY(${(1 - enter) * 12}px)`
        }}
      >
        <span
          style={{
            flexShrink: 0,
            padding: compact ? '3px 8px' : '4px 10px',
            borderRadius: 3,
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.18)',
            fontFamily: UI_FONT,
            fontSize: compact ? 13 : 16,
            fontWeight: 600,
            letterSpacing: '0.06em',
            color: 'rgba(255,255,255,0.72)'
          }}
        >
          数据来源
        </span>
        <span
          style={{
            fontFamily: UI_FONT,
            fontSize: compact ? 15 : 18,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.68)',
            letterSpacing: '0.02em'
          }}
        >
          {displaySource}
        </span>
      </div>
    </div>
  )
}

/** 分条快讯轮播（与主标题同步切换） */
const HotNewsItemStrip: React.FC<{
  items: HotNewsProps['items']
  hotTopicName?: string
  accentColor: string
  compact?: boolean
  mainDurationInFrames: number
  secondsPerItem?: number
}> = ({
  items,
  hotTopicName,
  accentColor,
  compact,
  mainDurationInFrames,
  secondsPerItem
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const { index, localFrame } = queryHotNewsCarouselSlot({
    frame,
    fps,
    mainDurationInFrames,
    itemCount: items.length,
    secondsPerItem,
    itemSeconds: items.map((item) => item.seconds)
  })
  const item = items[index] ?? items[0]
  /** 角标优先用当前条目 tag，保证切换时标签与标题一起变 */
  const topicLabel = (item?.tag || hotTopicName?.trim() || '热点').slice(0, 8)

  const enter = spring({
    frame: localFrame,
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
        {topicLabel}
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
        {item?.title ?? ''}
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
 * 时间轴：片头 → 主标题与分条同步轮播（全程底部滚动字幕）。
 */
export const HotNewsComposition: React.FC<HotNewsProps> = (props) => {
  const {
    brandName,
    dateLabel,
    headline,
    summary,
    dataSource,
    items,
    hotTopicName,
    tickerLines,
    secondsPerItem,
    accentColor = '#e63946'
  } = props

  const { width, height, durationInFrames, fps } = useVideoConfig()
  const compact = height > width

  /** 片头约占 12%，与主段略重叠；主段占满剩余时长 */
  const stingDurationInFrames = Math.min(
    90,
    Math.max(45, Math.round(durationInFrames * 0.12))
  )
  const mainFrom = Math.max(0, Math.round(stingDurationInFrames * 0.85))
  const mainDurationInFrames = Math.max(fps * 3, durationInFrames - mainFrom)

  const topicLabel =
    hotTopicName?.trim() || items[0]?.tag?.trim() || '热点'
  const scrollLines =
    tickerLines?.filter((line) => line.trim()).length
      ? tickerLines.filter((line) => line.trim())
      : items.map((item) => item.title).filter(Boolean)

  return (
    <AbsoluteFill style={{ fontFamily: UI_FONT }}>
      <HotNewsBackground accentColor={accentColor} />

      <Sequence from={0} durationInFrames={stingDurationInFrames}>
        <HotNewsSting accentColor={accentColor} />
      </Sequence>

      <Sequence from={mainFrom} durationInFrames={mainDurationInFrames}>
        <HotNewsTopBar
          brandName={brandName}
          dateLabel={dateLabel}
          accentColor={accentColor}
          compact={compact}
        />
        <HotNewsHero
          headline={headline}
          summary={summary}
          dataSource={dataSource}
          items={items}
          accentColor={accentColor}
          compact={compact}
          mainDurationInFrames={mainDurationInFrames}
          secondsPerItem={secondsPerItem}
        />
        <HotNewsItemStrip
          items={items}
          hotTopicName={topicLabel}
          accentColor={accentColor}
          compact={compact}
          mainDurationInFrames={mainDurationInFrames}
          secondsPerItem={secondsPerItem}
        />
      </Sequence>

      <HotNewsTicker
        tickerLines={scrollLines}
        accentColor={accentColor}
        compact={compact}
      />
    </AbsoluteFill>
  )
}
