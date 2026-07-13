/**
 * 豆包风格设计令牌 — 全应用主题色单一数据源。
 * 修改主题色时同步更新 global.css 中 :root 的 CSS 变量。
 */
export const DB_THEME = {
  /** 背景层级 */
  bg: '#f4f5f7',
  bgContent: '#ffffff',
  sidebar: '#ffffff',
  hover: '#f2f3f5',
  active: '#e8f0ff',
  bgSubtle: '#fafbfc',

  /** 边框 */
  border: '#e5e6eb',
  borderLight: '#f0f1f3',

  /** 文字 */
  text: '#1c1f23',
  textSecondary: '#86909c',
  textTertiary: '#b0b4bc',

  /** 品牌色 — 豆包蓝 */
  primary: '#0057ff',
  primaryHover: '#0046cc',
  primaryLight: '#3370ff',
  primarySoft: '#e8f0ff',
  primaryMuted: 'rgba(0, 87, 255, 0.08)',
  primaryGlow: 'rgba(0, 87, 255, 0.18)',

  /** 功能色 */
  success: '#00b578',
  warning: '#ff8800',
  warningBg: '#fff8e6',
  warningText: '#b45309',
  warningTextAlt: '#d48806',
  danger: '#f53f3f',

  /** 代码块 */
  codeBg: '#1c1f23',
  codeText: '#e5e6eb',

  /** 主色上的文字 */
  onPrimary: '#ffffff'
} as const

/** Ant Design ConfigProvider 主题配置 */
export const antdThemeConfig = {
  token: {
    colorPrimary: DB_THEME.primary,
    colorSuccess: DB_THEME.success,
    colorWarning: DB_THEME.warning,
    colorError: DB_THEME.danger,
    colorText: DB_THEME.text,
    colorTextSecondary: DB_THEME.textSecondary,
    colorBorder: DB_THEME.border,
    colorBgContainer: DB_THEME.bgContent,
    colorBgLayout: DB_THEME.bg,
    borderRadius: 12,
    borderRadiusLG: 16,
    borderRadiusSM: 8,
    fontFamily:
      '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", -apple-system, sans-serif',
    controlHeight: 36,
    boxShadow: '0 16px 48px rgba(0, 0, 0, 0.14), 0 6px 16px rgba(0, 0, 0, 0.08)',
    boxShadowSecondary: '0 8px 28px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)'
  },
  components: {
    Button: {
      primaryShadow: 'none',
      defaultBorderColor: DB_THEME.border,
      defaultHoverBorderColor: DB_THEME.primary,
      defaultHoverColor: DB_THEME.primary
    },
    Card: {
      borderRadiusLG: 16
    },
    Input: {
      activeBorderColor: DB_THEME.primary,
      hoverBorderColor: DB_THEME.primary
    },
    Segmented: {
      trackBg: DB_THEME.hover
    },
    Tag: {
      /** 使 color="blue" 与品牌主色一致 */
      colorInfo: DB_THEME.primary,
      colorInfoBg: DB_THEME.primarySoft,
      colorInfoBorder: 'rgba(0, 87, 255, 0.2)'
    }
  }
} as const
