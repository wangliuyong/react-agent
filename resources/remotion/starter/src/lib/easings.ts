/**
 * 高级缓动曲线预设
 * 参考 Material Design、Apple HIG 及专业动效标准
 */

import { Easing } from 'remotion'

/** 标准缓动：元素进入/退出通用，自然顺滑 */
export const EASE_STANDARD = Easing.bezier(0.2, 0, 0, 1)

/** 减速缓动：元素入场（快速开始，缓慢结束） */
export const EASE_DECELERATE = Easing.bezier(0, 0, 0.2, 1)

/** 加速缓动：元素退场（缓慢开始，快速结束） */
export const EASE_ACCELERATE = Easing.bezier(0.4, 0, 1, 1)

/** 锐度缓动：强调性动效，有回弹感 */
export const EASE_EMPHASIZED = Easing.bezier(0.2, 0, 0, 1.5)

/** 苹果风格：顺滑且有质感 */
export const EASE_APPLE = Easing.bezier(0.16, 1, 0.3, 1)

/** 弹性入场：轻微过冲 */
export const EASE_BOUNCE_IN = Easing.bezier(0.34, 1.56, 0.64, 1)

/** 平滑正弦：最柔和的过渡 */
export const EASE_SINE = Easing.inOut(Easing.sin)

/**
 * Spring 物理参数预设
 * 用于 spring() 函数的 config 参数
 */
export const SPRING_PRESETS = {
  /** 轻柔：浮动、呼吸感 */
  gentle: { damping: 12, stiffness: 80, mass: 1 },
  /** 标准：通用入场 */
  standard: { damping: 16, stiffness: 120, mass: 1 },
  /** 干脆：按钮反馈、图标弹跳 */
  snappy: { damping: 20, stiffness: 200, mass: 1 },
  /** 厚重：大元素、镜头运动 */
  heavy: { damping: 26, stiffness: 40, mass: 1 },
  /** 弹性：强调效果 */
  bouncy: { damping: 10, stiffness: 180, mass: 1 }
} as const

export type SpringPresetName = keyof typeof SPRING_PRESETS
