/** 热点新闻模板单条简讯（含详情） */
export interface HotNewsItem {
  /** 角标，如「科技」「财经」 */
  tag: string
  /** 主标题（一句话） */
  title: string
  /**
   * 该条新闻的详细播报文案（2–4 句）。
   * 由 Agent 在拿到热点标题后检索/阅读相关报道再整理，禁止只重复标题。
   */
  detail?: string
  /**
   * 本条数据来源（可选；缺省用全局 dataSource）。
   * 轮播时优先展示本字段，须为真实媒体/机构/热榜名。
   */
  source?: string
  /** 本条单独展示秒数（可选；缺省用全局 secondsPerItem） */
  seconds?: number
}

/**
 * 热点新闻 Remotion 模板入参。
 * 通过 defaultProps / inputProps 注入，便于 Agent 与 UI 预览共用同一契约。
 */
export interface HotNewsProps {
  brandName: string
  /** 顶栏日期或期数文案 */
  dateLabel: string
  /** 主标题（大字报式；有 items 轮播时作兜底） */
  headline: string
  /** 副文案 / 导语（单条或兜底） */
  summary: string
  /**
   * 数据来源（必填，画面可见）。
   * 展示为「数据来源：…」；须为真实媒体名 / 官方机构 / 热榜平台。
   */
  dataSource: string
  /** 中部条带左侧红色角标，如「芯片」「财经」 */
  hotTopicName?: string
  /** 底部 LIVE 条滚动的快讯文案（每条一句） */
  tickerLines?: string[]
  items: HotNewsItem[]
  /**
   * Agent 根据用户输入与成片时长决定的「每条默认展示秒数」。
   * 模板轮播优先使用该值；未提供时按主段时长均分。
   */
  secondsPerItem?: number
  /** 主强调色，默认新闻红 */
  accentColor?: string
}
