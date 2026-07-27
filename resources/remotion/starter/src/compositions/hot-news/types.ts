/** 热点新闻模板单条简讯 */
export interface HotNewsItem {
  /** 角标，如「科技」「财经」 */
  tag: string
  title: string
}

/**
 * 热点新闻 Remotion 模板入参。
 * 通过 defaultProps / inputProps 注入，便于 Agent 与 UI 预览共用同一契约。
 */
export interface HotNewsProps {
  brandName: string
  /** 顶栏日期或期数文案 */
  dateLabel: string
  /** 主标题（大字报式） */
  headline: string
  /** 副文案 / 导语 */
  summary: string
  items: HotNewsItem[]
  /** 主强调色，默认新闻红 */
  accentColor?: string
}
