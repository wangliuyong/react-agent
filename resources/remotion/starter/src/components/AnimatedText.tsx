/**
 * 动画文字组件
 * 支持逐字淡入、错落入场、打字机效果
 */

import React from 'react'
import { interpolate, useCurrentFrame, Easing } from 'remotion'
import { EASE_APPLE } from '../lib/easings'
import { staggerDelay } from '../lib/animations'

interface AnimatedTextProps {
  text: string
  /** 起始帧 */
  startFrame?: number
  /** 每个字的错落帧数 */
  stagger?: number
  /** 单字动画时长 */
  duration?: number
  /** 从下方滑入的距离 */
  distance?: number
  /** 缓动曲线 */
  easing?: (x: number) => number
  /** 文字样式 */
  style?: React.CSSProperties
  /** 字符类名 */
  charStyle?: React.CSSProperties
}

/**
 * 逐字错落入场动画
 * 每个字符从下方滑入并淡入，营造高级感
 */
export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  startFrame = 0,
  stagger = 4,
  duration = 24,
  distance = 20,
  easing = EASE_APPLE,
  style,
  charStyle
}) => {
  const frame = useCurrentFrame()
  const chars = text.split('')

  return (
    <span style={{ display: 'inline-block', ...style }}>
      {chars.map((char, i) => {
        const charStart = startFrame + staggerDelay(i, 0, stagger)
        const progress = interpolate(frame, [charStart, charStart + duration], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing
        })

        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              opacity: progress,
              transform: `translateY(${distance * (1 - progress)}px)`,
              whiteSpace: char === ' ' ? 'pre' : 'normal',
              ...charStyle
            }}
          >
            {char}
          </span>
        )
      })}
    </span>
  )
}

interface TypewriterTextProps {
  text: string
  startFrame?: number
  /** 每字帧数 */
  speed?: number
  /** 完成后是否显示光标 */
  cursor?: boolean
  style?: React.CSSProperties
}

/**
 * 打字机效果文字
 */
export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  startFrame = 0,
  speed = 3,
  cursor = true,
  style
}) => {
  const frame = useCurrentFrame()
  const visibleChars = Math.max(0, Math.floor((frame - startFrame) / speed))
  const displayText = text.slice(0, Math.min(visibleChars, text.length))
  const isComplete = visibleChars >= text.length

  return (
    <span style={style}>
      {displayText}
      {cursor && (
        <span
          style={{
            opacity: isComplete ? (Math.floor(frame / 15) % 2 === 0 ? 1 : 0) : 1,
            marginLeft: 2
          }}
        >
          |
        </span>
      )}
    </span>
  )
}
