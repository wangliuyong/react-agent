/**
 * 设计系统 - 配色
 * 提供多套预设调色板，保证视频视觉一致性与专业感
 */

/** 深色科技风（默认） */
export const DARK_TECH = {
  background: '#0f172a',
  backgroundSoft: '#1e293b',
  surface: '#334155',
  primary: '#3b82f6',
  primaryLight: '#60a5fa',
  accent: '#06b6d4',
  text: '#f8fafc',
  textSecondary: '#94a3b8',
  border: 'rgba(148, 163, 184, 0.2)',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444'
}

/** 浅色简约风 */
export const LIGHT_MINIMAL = {
  background: '#ffffff',
  backgroundSoft: '#f8fafc',
  surface: '#f1f5f9',
  primary: '#2563eb',
  primaryLight: '#3b82f6',
  accent: '#0891b2',
  text: '#0f172a',
  textSecondary: '#64748b',
  border: 'rgba(148, 163, 184, 0.3)',
  success: '#059669',
  warning: '#d97706',
  error: '#dc2626'
}

/** 高端黑金风 */
export const PREMIUM_GOLD = {
  background: '#0a0a0a',
  backgroundSoft: '#171717',
  surface: '#262626',
  primary: '#d4af37',
  primaryLight: '#f4d03f',
  accent: '#c0c0c0',
  text: '#fafafa',
  textSecondary: '#a3a3a3',
  border: 'rgba(212, 175, 55, 0.3)',
  success: '#22c55e',
  warning: '#eab308',
  error: '#ef4444'
}

/** 渐变背景预设 */
export const GRADIENTS = {
  deepOcean: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
  sunset: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  midnight: 'linear-gradient(180deg, #0c0c1d 0%, #1a1a3e 100%)',
  aurora: 'linear-gradient(135deg, #0f172a 0%, #134e4a 50%, #0f172a 100%)',
  warmDark: 'linear-gradient(135deg, #1c1917 0%, #292524 50%, #1c1917 100%)'
}

/** 默认配色 */
export const DEFAULT_THEME = DARK_TECH

export type ColorTheme = typeof DARK_TECH
export type GradientName = keyof typeof GRADIENTS
