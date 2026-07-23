import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'

/**
 * 默认占位 Composition。
 * Agent 应根据用户需求改写本文件，或新增组件并在 Root.tsx 注册。
 */
export const MyComposition: React.FC = () => {
  const frame = useCurrentFrame()

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0f172a',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <h1
        style={{
          color: '#f8fafc',
          fontSize: 72,
          fontFamily: 'sans-serif',
          opacity: interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' })
        }}
      >
        Hello Remotion
      </h1>
    </AbsoluteFill>
  )
}
