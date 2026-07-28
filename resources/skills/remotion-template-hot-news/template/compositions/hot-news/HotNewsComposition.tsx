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

/** 解析当前画面应展示的来源文案（单条 source 优先） */
function queryDisplayDataSource(
  dataSource: string | undefined,
  itemSource?: string
): string {
  const fromItem = itemSource?.trim()
  if (fromItem) return fromItem
  const fromGlobal = dataSource?.trim()
  if (fromGlobal) return fromGlobal
  return '未标注'
}

/** 顶栏：品牌、日期 + 强制可见的「来源」角标（电视台右上角信息块） */
const HotNewsTopBar: React.FC<{
  brandName: string
  dateLabel: string
  /** 画面必显的数据来源 */
  dataSource: string
  accentColor: string
  compact?: boolean
}> = ({ brandName, dateLabel, dataSource, accentColor, compact }) => {
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
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
        opacity: reveal,
        transform: `translateY(${(1 - reveal) * -24}px)`,
        zIndex: 5
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
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: compact ? 8 : 10
        }}
      >
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
        {/* 右上角来源条：不被主文案/中部条带遮挡 */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            maxWidth: compact ? 280 : 420,
            borderLeft: `3px solid ${accentColor}`,
            paddingLeft: compact ? 10 : 12,
            background:
              'linear-gradient(90deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.28) 70%, transparent 100%)'
          }}
        >
          <span
            style={{
              flexShrink: 0,
              fontFamily: UI_FONT,
              fontSize: compact ? 13 : 15,
              fontWeight: 700,
              letterSpacing: '0.14em',
              color: accentColor,
              marginRight: compact ? 8 : 10
            }}
          >
            来源
          </span>
          <span
            style={{
              fontFamily: UI_FONT,
              fontSize: compact ? 15 : 18,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.92)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {dataSource}
          </span>
        </div>
      </div>
    </div>
  )
}

/**
 * 主标题区：按 items 定时轮播，展示 title + detail（详细播报）。
 * 节奏由 secondsPerItem / items[].seconds 决定，与中部条带共用同一索引。
 * 数据来源改在顶栏与中部条带上方展示，避免被遮挡。
 */
const HotNewsHero: React.FC<{
  headline: string
  summary: string
  items: HotNewsProps['items']
  accentColor: string
  compact?: boolean
  mainDurationInFrames: number
  secondsPerItem?: number
}> = ({
  headline,
  summary,
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
        top: compact ? '168px' : '210px',
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
    </div>
  )
}

/** 分条快讯轮播（与主标题同步切换）；上方附带本条数据来源 chyron */
const HotNewsItemStrip: React.FC<{
  items: HotNewsProps['items']
  hotTopicName?: string
  dataSource: string
  accentColor: string
  compact?: boolean
  mainDurationInFrames: number
  secondsPerItem?: number
}> = ({
  items,
  hotTopicName,
  dataSource,
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
  const displaySource = queryDisplayDataSource(dataSource, item?.source)

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
        flexDirection: 'column',
        gap: compact ? 10 : 14,
        opacity: enter,
        transform: `translateX(${(1 - enter) * 40}px)`,
        zIndex: 4
      }}
    >
      {/* 中部条带上方：本条来源，轮播时与标题同步切换 */}
      <div
        style={{
          display: 'inline-flex',
          alignSelf: 'flex-start',
          alignItems: 'center',
          gap: compact ? 8 : 10,
          padding: compact ? '5px 12px' : '6px 14px',
          borderRadius: 4,
          background: 'rgba(0,0,0,0.55)',
          border: '1px solid rgba(255,255,255,0.14)',
          boxShadow: `inset 3px 0 0 ${accentColor}`
        }}
      >
        <span
          style={{
            fontFamily: UI_FONT,
            fontSize: compact ? 13 : 15,
            fontWeight: 700,
            letterSpacing: '0.12em',
            color: accentColor
          }}
        >
          数据来源
        </span>
        <span
          style={{
            width: 1,
            height: compact ? 12 : 14,
            background: 'rgba(255,255,255,0.28)'
          }}
        />
        <span
          style={{
            fontFamily: UI_FONT,
            fontSize: compact ? 15 : 18,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.92)'
          }}
        >
          {displaySource}
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          gap: compact ? 16 : 24
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
  /** 顶栏用全局来源；缺省时回退首条 source，保证画面必有标注 */
  const topBarSource = queryDisplayDataSource(dataSource, items[0]?.source)

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
          dataSource={topBarSource}
          accentColor={accentColor}
          compact={compact}
        />
        <HotNewsHero
          headline={headline}
          summary={summary}
          items={items}
          accentColor={accentColor}
          compact={compact}
          mainDurationInFrames={mainDurationInFrames}
          secondsPerItem={secondsPerItem}
        />
        <HotNewsItemStrip
          items={items}
          hotTopicName={topicLabel}
          dataSource={topBarSource}
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
