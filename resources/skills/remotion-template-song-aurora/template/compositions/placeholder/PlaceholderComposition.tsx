import React from 'react'
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion'

/** 占位 Composition：完整动效由 Agent 按技能说明扩展 */
export const PlaceholderComposition: React.FC<{ title?: string }> = ({ title = 'Remotion 模版' }) => {
  const frame = useCurrentFrame()
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' })
  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(160deg, #0f172a, #1e293b)',
        justifyContent: 'center',
        alignItems: 'center',
        opacity
      }}
    >
      <h1 style={{ color: '#f8fafc', fontSize: 64, fontFamily: 'system-ui' }}>{title}</h1>
    </AbsoluteFill>
  )
}
