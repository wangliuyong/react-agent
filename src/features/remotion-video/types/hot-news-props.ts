/** 热点新闻模板单条简讯（与技能 template 内 types 对齐） */
export interface HotNewsItem {
  tag: string
  title: string
  detail?: string
  seconds?: number
}

/**
 * 热点新闻 Remotion 模板入参。
 * 技能 template/compositions/hot-news/types.ts 为成片侧真源；此处供渲染进程 JSON 拼装。
 */
export interface HotNewsProps {
  brandName: string
  dateLabel: string
  headline: string
  summary: string
  hotTopicName?: string
  tickerLines?: string[]
  items: HotNewsItem[]
  secondsPerItem?: number
  accentColor?: string
}
