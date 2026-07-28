import React from 'react'
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion'

/** 新闻演播室背景：深色底 + 斜向光带 + 轻微颗粒感 */
export const HotNewsBackground: React.FC<{ accentColor: string }> = ({ accentColor }) => {
  const frame = useCurrentFrame()
  const sweep = interpolate(frame % 180, [0, 180], [0, 1])

  return (
    <AbsoluteFill
      style={{
        background: `
          radial-gradient(120% 80% at 10% 0%, color-mix(in srgb, ${accentColor} 28%, transparent) 0%, transparent 55%),
          radial-gradient(90% 70% at 100% 100%, rgba(30, 58, 95, 0.55) 0%, transparent 50%),
          linear-gradient(165deg, #0b0d12 0%, #12151c 42%, #0a0c10 100%)
        `
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.07,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)',
          backgroundSize: '3px 3px'
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          left: `${-30 + sweep * 60}%`,
          width: '45%',
          height: '140%',
          transform: 'rotate(12deg)',
          background: `linear-gradient(90deg, transparent, color-mix(in srgb, ${accentColor} 18%, white), transparent)`,
          opacity: 0.12,
          filter: 'blur(40px)'
        }}
      />
    </AbsoluteFill>
  )
}
