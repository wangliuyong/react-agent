/**
 * 设计系统 - 排版
 * 字体层级、字号、行高、字重规范
 */

/** 字体栈 */
export const FONT_FAMILIES = {
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  mono: '"SF Mono", Monaco, Inconsolata, "Roboto Mono", monospace',
  display: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
}

/** 字号层级（1920×1080 基准） */
export const FONT_SIZES = {
  /** 超大标题，主视觉 */
  hero: 96,
  /** 一级标题 */
  h1: 72,
  /** 二级标题 */
  h2: 56,
  /** 三级标题 */
  h3: 42,
  /** 正文大号 */
  bodyLg: 32,
  /** 正文标准 */
  body: 24,
  /** 正文小号 */
  bodySm: 20,
  /** 说明文字 */
  caption: 16,
  /** 小字标签 */
  tiny: 14
}

/** 字重 */
export const FONT_WEIGHTS = {
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800
}

/** 行高 */
export const LINE_HEIGHTS = {
  tight: 1.1,
  normal: 1.4,
  relaxed: 1.6
}

/** 字间距 */
export const LETTER_SPACING = {
  tight: '-0.02em',
  normal: '0',
  wide: '0.05em',
  wider: '0.1em'
}

/** 预设文字样式 */
export const TEXT_STYLES = {
  heroTitle: {
    fontSize: FONT_SIZES.hero,
    fontWeight: FONT_WEIGHTS.bold,
    lineHeight: LINE_HEIGHTS.tight,
    letterSpacing: LETTER_SPACING.tight,
    fontFamily: FONT_FAMILIES.display
  },
  sectionTitle: {
    fontSize: FONT_SIZES.h2,
    fontWeight: FONT_WEIGHTS.semibold,
    lineHeight: LINE_HEIGHTS.tight,
    fontFamily: FONT_FAMILIES.display
  },
  bodyLarge: {
    fontSize: FONT_SIZES.bodyLg,
    fontWeight: FONT_WEIGHTS.regular,
    lineHeight: LINE_HEIGHTS.relaxed,
    fontFamily: FONT_FAMILIES.sans
  },
  body: {
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.regular,
    lineHeight: LINE_HEIGHTS.normal,
    fontFamily: FONT_FAMILIES.sans
  },
  caption: {
    fontSize: FONT_SIZES.caption,
    fontWeight: FONT_WEIGHTS.regular,
    lineHeight: LINE_HEIGHTS.normal,
    fontFamily: FONT_FAMILIES.sans
  }
} as const

/** 间距系统（8px 基准） */
export const SPACING = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 40,
  xl: 64,
  xxl: 96
}
