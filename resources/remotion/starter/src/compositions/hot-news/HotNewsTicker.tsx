import React from 'react'
import { useCurrentFrame, useVideoConfig } from 'remotion'
import type { HotNewsItem } from './types'

const TICKER_FONT =
  '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", system-ui, sans-serif'

/**
 * 底部滚动字幕带。
 * 为什么用手算 translateX：热点新闻场景需要连续滚动，比逐帧切换更有「联播」感。
 */
export const HotNewsTicker: React.FC<{
  items: HotNewsItem[]
  accentColor: string
  compact?: boolean
}> = ({ items, accentColor, compact = false }) => {
  const frame = useCurrentFrame()
  const { fps, width } = useVideoConfig()

  const label = items.map((item) => `【${item.tag}】${item.title}`).join('　　　')
  const pxPerSecond = compact ? 140 : 180
  const offset = (frame / fps) * pxPerSecond
  const barHeight = compact ? 56 : 72

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: barHeight,
        display: 'flex',
        alignItems: 'center',
        borderTop: `2px solid color-mix(in srgb, ${accentColor} 65%, transparent)`,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.82) 100%)',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          flexShrink: 0,
          padding: `0 ${compact ? 16 : 24}px`,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          fontFamily: TICKER_FONT,
          fontSize: compact ? 18 : 22,
          fontWeight: 800,
          letterSpacing: '0.12em',
          color: '#fff',
          background: accentColor,
          textTransform: 'uppercase'
        }}
      >
        LIVE
      </div>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            whiteSpace: 'nowrap',
            fontFamily: TICKER_FONT,
            fontSize: compact ? 20 : 26,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.92)',
            transform: `translateX(${width - offset}px)`
          }}
        >
          {label}　　　{label}
        </div>
      </div>
    </div>
  )
}
