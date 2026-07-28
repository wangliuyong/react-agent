import React from 'react'
import { useCurrentFrame, useVideoConfig } from 'remotion'

const TICKER_FONT =
  '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", system-ui, sans-serif'

const TICKER_GAP = '　　　　'

/**
 * 底部 LIVE 滚动快讯带。
 * 文案来自 tickerLines；无则回退 items 标题。双份拼接实现无缝循环。
 */
export const HotNewsTicker: React.FC<{
  tickerLines: string[]
  accentColor: string
  compact?: boolean
}> = ({ tickerLines, accentColor, compact = false }) => {
  const frame = useCurrentFrame()
  const { fps, width } = useVideoConfig()

  const scrollText = tickerLines.filter(Boolean).join(TICKER_GAP)
  const pxPerSecond = compact ? 120 : 160
  const cycleWidth = Math.max(scrollText.length * (compact ? 14 : 18), width)
  const offset = ((frame / fps) * pxPerSecond) % cycleWidth
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
        borderTop: `2px solid color-mix(in srgb, ${accentColor} 70%, transparent)`,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.88) 100%)',
        overflow: 'hidden',
        boxShadow: '0 -8px 24px rgba(0,0,0,0.35)'
      }}
    >
      <div
        style={{
          flexShrink: 0,
          minWidth: compact ? 72 : 88,
          padding: `0 ${compact ? 14 : 20}px`,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: TICKER_FONT,
          fontSize: compact ? 16 : 20,
          fontWeight: 800,
          letterSpacing: '0.14em',
          color: '#fff',
          background: `linear-gradient(180deg, ${accentColor} 0%, color-mix(in srgb, ${accentColor} 75%, #000) 100%)`,
          boxShadow: `4px 0 16px color-mix(in srgb, ${accentColor} 40%, transparent)`
        }}
      >
        LIVE
      </div>
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
          height: '100%',
          maskImage: 'linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            whiteSpace: 'nowrap',
            fontFamily: TICKER_FONT,
            fontSize: compact ? 20 : 26,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.94)',
            transform: `translate(${-offset}px, -50%)`,
            paddingLeft: 16
          }}
        >
          {scrollText}
          {TICKER_GAP}
          {scrollText}
        </div>
      </div>
    </div>
  )
}
