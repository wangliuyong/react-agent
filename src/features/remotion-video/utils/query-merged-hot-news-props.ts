import type { HotNewsProps } from '../types/hot-news-props'

export interface HotNewsDisplayOverrides {
  hotTopicName?: string
  /** 每行一条滚动快讯 */
  tickerLinesText?: string
}

/**
 * 将抽屉里用户手填的「热点名称 / 滚动快讯」合并进 Agent 或默认 props。
 * 为什么：名称与快讯常需微调，不必每次重新跑 Agent。
 */
export function queryMergedHotNewsProps(
  base: HotNewsProps,
  overrides: HotNewsDisplayOverrides
): HotNewsProps {
  const name = overrides.hotTopicName?.trim()
  const lines = overrides.tickerLinesText
    ?.split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  return {
    ...base,
    ...(name ? { hotTopicName: name.slice(0, 8) } : {}),
    ...(lines && lines.length > 0 ? { tickerLines: lines.slice(0, 12) } : {})
  }
}
