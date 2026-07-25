/**
 * 常用动画工具函数
 * 封装淡入、滑入、缩放、错落、呼吸等高频动效
 */

import { interpolate, useCurrentFrame, useVideoConfig, spring, Easing } from 'remotion'
import { EASE_APPLE, EASE_DECELERATE, SPRING_PRESETS, type SpringPresetName } from './easings'

/**
 * 淡入动画
 * @param startFrame 起始帧
 * @param duration 持续帧数
 * @param easing 缓动曲线
 */
export function useFadeIn(
  startFrame: number = 0,
  duration: number = 30,
  easing: (x: number) => number = EASE_APPLE
): number {
  const frame = useCurrentFrame()
  return interpolate(frame, [startFrame, startFrame + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing
  })
}

/**
 * 淡出动画
 */
export function useFadeOut(
  endFrame: number,
  duration: number = 30,
  easing: (x: number) => number = EASE_APPLE
): number {
  const frame = useCurrentFrame()
  return interpolate(frame, [endFrame - duration, endFrame], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing
  })
}

/**
 * 从下方滑入 + 淡入
 */
export function useSlideUp(
  startFrame: number = 0,
  duration: number = 40,
  distance: number = 40,
  easing: (x: number) => number = EASE_DECELERATE
): { opacity: number; translateY: number } {
  const frame = useCurrentFrame()
  const progress = interpolate(frame, [startFrame, startFrame + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing
  })
  return {
    opacity: progress,
    translateY: distance * (1 - progress)
  }
}

/**
 * 从上方滑入 + 淡入
 */
export function useSlideDown(
  startFrame: number = 0,
  duration: number = 40,
  distance: number = 40,
  easing: (x: number) => number = EASE_DECELERATE
): { opacity: number; translateY: number } {
  const frame = useCurrentFrame()
  const progress = interpolate(frame, [startFrame, startFrame + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing
  })
  return {
    opacity: progress,
    translateY: -distance * (1 - progress)
  }
}

/**
 * 缩放入场（从小到大）
 */
export function useScaleIn(
  startFrame: number = 0,
  duration: number = 40,
  fromScale: number = 0.8,
  easing: (x: number) => number = EASE_DECELERATE
): { opacity: number; scale: number } {
  const frame = useCurrentFrame()
  const progress = interpolate(frame, [startFrame, startFrame + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing
  })
  return {
    opacity: progress,
    scale: fromScale + (1 - fromScale) * progress
  }
}

/**
 * 错落动画索引计算
 * 用于多个元素依次入场的延迟计算
 * @param index 元素索引
 * @param baseDelay 基础延迟帧数
 * @param staggerPerItem 每个元素的错落帧数
 */
export function staggerDelay(index: number, baseDelay: number = 0, staggerPerItem: number = 6): number {
  return baseDelay + index * staggerPerItem
}

/**
 * 呼吸动画（持续缩放脉动）
 * @param intensity 脉动强度（0-1），默认 0.03 即 ±3%
 * @param speed 速度，每秒周期数
 * @param phase 相位偏移
 */
export function useBreathing(
  intensity: number = 0.03,
  speed: number = 0.5,
  phase: number = 0
): number {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const t = (frame / fps) * speed * Math.PI * 2 + phase
  return 1 + Math.sin(t) * intensity
}

/**
 * 弹性入场动画（使用 spring 物理引擎）
 * @param startFrame 起始帧
 * @param preset 弹簧预设
 */
export function useSpringIn(
  startFrame: number = 0,
  preset: SpringPresetName = 'standard'
): number {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const config = SPRING_PRESETS[preset]

  if (frame < startFrame) return 0

  return spring({
    frame: frame - startFrame,
    fps,
    config,
    from: 0,
    to: 1
  })
}

/**
 * 逐字出现打字机效果进度
 * @param text 完整文本
 * @param startFrame 起始帧
 * @param framesPerChar 每字帧数
 */
export function useTypewriter(
  text: string,
  startFrame: number = 0,
  framesPerChar: number = 3
): string {
  const frame = useCurrentFrame()
  const chars = Math.max(0, Math.floor((frame - startFrame) / framesPerChar))
  return text.slice(0, Math.min(chars, text.length))
}

/**
 * 进度条/填充动画
 * @param startFrame 起始帧
 * @param duration 持续帧数
 * @param easing 缓动
 */
export function useProgress(
  startFrame: number,
  duration: number,
  easing: (x: number) => number = Easing.inOut(Easing.ease)
): number {
  const frame = useCurrentFrame()
  return interpolate(frame, [startFrame, startFrame + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing
  })
}
