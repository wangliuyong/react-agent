/**
 * 字幕组件
 * 支持普通字幕、逐字高亮卡拉OK效果
 */

import React from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion'
import { EASE_APPLE } from '../lib/easings'

export interface Caption {
  text: string
  startMs: number
  endMs: number
}

interface SubtitlesProps {
  captions: Caption[]
  /** 距离底部距离 */
  bottomOffset?: number
  /** 字体大小 */
  fontSize?: number
  /** 文字颜色 */
  textColor?: string
  /** 背景色 */
  backgroundColor?: string
  /** 最大宽度比例 */
  maxWidthRatio?: number
  /** 淡入淡出帧数 */
  fadeFrames?: number
}

/**
 * 基础字幕组件
 * 自动根据当前时间显示对应字幕
 */
export const Subtitles: React.FC<SubtitlesProps> = ({
  captions,
  bottomOffset = 120,
  fontSize = 48,
  textColor = '#ffffff',
  backgroundColor = 'rgba(0, 0, 0, 0.7)',
  maxWidthRatio = 0.8,
  fadeFrames = 8
}) => {
  const frame = useCurrentFrame()
  const { fps, width } = useVideoConfig()
  const nowMs = (frame / fps) * 1000

  const active = captions.find((c) => nowMs >= c.startMs && nowMs < c.endMs)

  if (!active) return null

  // 计算淡入淡出
  const startFrame = (active.startMs / 1000) * fps
  const endFrame = (active.endMs / 1000) * fps

  const fadeInProgress = interpolate(frame, [startFrame, startFrame + fadeFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE_APPLE
  })

  const fadeOutProgress = interpolate(frame, [endFrame - fadeFrames, endFrame], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: EASE_APPLE
  })

  const opacity = Math.min(fadeInProgress, fadeOutProgress)

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: bottomOffset,
        pointerEvents: 'none'
      }}
    >
      <div
        style={{
          maxWidth: width * maxWidthRatio,
          padding: '16px 32px',
          backgroundColor,
          borderRadius: 12,
          opacity,
          transform: `translateY(${20 * (1 - opacity)}px)`
        }}
      >
        <span
          style={{
            fontSize,
            color: textColor,
            fontWeight: 500,
            lineHeight: 1.4,
            textAlign: 'center',
            display: 'block'
          }}
        >
          {active.text}
        </span>
      </div>
    </AbsoluteFill>
  )
}

interface KaraokeCaption extends Caption {
  /** 每个字的时间戳（毫秒），用于逐字高亮 */
  charTimings?: number[]
}

interface KaraokeSubtitlesProps extends SubtitlesProps {
  captions: KaraokeCaption[]
  /** 高亮颜色 */
  highlightColor?: string
}

/**
 * 卡拉OK字幕组件
 * 逐字高亮效果，适合歌词、旁白卡点
 */
export const KaraokeSubtitles: React.FC<KaraokeSubtitlesProps> = ({
  captions,
  bottomOffset = 120,
  fontSize = 56,
  textColor = 'rgba(255, 255, 255, 0.4)',
  highlightColor = '#ffffff',
  backgroundColor = 'transparent',
  maxWidthRatio = 0.9,
  fadeFrames = 10
}) => {
  const frame = useCurrentFrame()
  const { fps, width } = useVideoConfig()
  const nowMs = (frame / fps) * 1000

  const activeIndex = captions.findIndex((c) => nowMs >= c.startMs && nowMs < c.endMs)
  const active = captions[activeIndex]

  if (!active) return null

  const startFrame = (active.startMs / 1000) * fps
  const endFrame = (active.endMs / 1000) * fps

  const fadeInProgress = interpolate(frame, [startFrame, startFrame + fadeFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  })

  const fadeOutProgress = interpolate(frame, [endFrame - fadeFrames, endFrame], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  })

  const opacity = Math.min(fadeInProgress, fadeOutProgress)

  // 计算高亮进度
  const chars = active.text.split('')
  const totalDuration = active.endMs - active.startMs
  const elapsed = nowMs - active.startMs
  const progress = Math.min(1, Math.max(0, elapsed / totalDuration))
  const highlightedChars = Math.floor(chars.length * progress)

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: bottomOffset,
        pointerEvents: 'none'
      }}
    >
      <div
        style={{
          maxWidth: width * maxWidthRatio,
          padding: '12px 24px',
          backgroundColor,
          borderRadius: 8,
          opacity,
          position: 'relative'
        }}
      >
        {/* 底层灰色文字 */}
        <span
          style={{
            fontSize,
            color: textColor,
            fontWeight: 700,
            lineHeight: 1.3,
            textAlign: 'center',
            display: 'block',
            textShadow: '0 2px 8px rgba(0,0,0,0.5)'
          }}
        >
          {active.text}
        </span>
        {/* 上层高亮文字，用 clip 控制显示宽度 */}
        <span
          style={{
            position: 'absolute',
            top: 12,
            left: 24,
            right: 24,
            fontSize,
            color: highlightColor,
            fontWeight: 700,
            lineHeight: 1.3,
            textAlign: 'center',
            display: 'block',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            width: `${progress * 100}%`,
            textShadow: '0 0 20px rgba(255,255,255,0.5)'
          }}
        >
          {active.text}
        </span>
      </div>
    </AbsoluteFill>
  )
}
