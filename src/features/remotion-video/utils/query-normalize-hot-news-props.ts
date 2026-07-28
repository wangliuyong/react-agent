import type { HotNewsItem, HotNewsProps } from '../types/hot-news-props'
import type { HotNewsContentBudget } from './query-hot-news-content-budget'

/** 与 Remotion 轮播工具保持一致的秒数钳制（3–15） */
function queryClampHotNewsItemSeconds(seconds: number): number {
  if (!Number.isFinite(seconds)) return 3
  return Math.min(15, Math.max(3, seconds))
}

/**
 * 将 Agent 原始 JSON 规范化为 HotNewsProps。
 * 校验条数、截断字数，并解析 secondsPerItem / items[].detail / items[].seconds。
 */
export function queryNormalizeHotNewsProps(
  raw: Record<string, unknown>,
  budget: HotNewsContentBudget
): HotNewsProps | null {
  const brandName = String(raw.brandName ?? '').trim()
  const dateLabel = String(raw.dateLabel ?? '').trim()
  const headline = String(raw.headline ?? '').trim()
  const summary = String(raw.summary ?? '').trim()
  /** 数据来源必填：剔除常见占位后再校验 */
  const dataSourceRaw = String(raw.dataSource ?? '').trim()
  const dataSourcePlaceholder = /^(未知|暂无|无|n\/?a|null|undefined|-|—|－－)$/i
  const dataSource =
    dataSourceRaw && !dataSourcePlaceholder.test(dataSourceRaw)
      ? dataSourceRaw.slice(0, 48)
      : ''
  const itemsRaw = raw.items
  if (!brandName || !headline || !summary || !dataSource || !Array.isArray(itemsRaw)) return null

  const items = itemsRaw
    .map((row) => queryNormalizeHotNewsItem(row, budget))
    .filter((x): x is HotNewsItem => Boolean(x))
  if (items.length < 1) return null

  const accentColor = raw.accentColor != null ? String(raw.accentColor).trim() : undefined
  const hotTopicName =
    raw.hotTopicName != null ? String(raw.hotTopicName).trim().slice(0, 8) : undefined
  const tickerRaw = raw.tickerLines
  let tickerLines = Array.isArray(tickerRaw)
    ? tickerRaw
        .map((line) => String(line ?? '').trim())
        .filter(Boolean)
        .slice(0, budget.maxTickerLines)
    : undefined
  /** 用户未手填快讯时，Agent 应生成 tickerLines；仍缺失则用 items 标题兜底 */
  if (!tickerLines?.length) {
    tickerLines = items.map((item) => item.title).filter(Boolean).slice(0, budget.maxTickerLines)
  }

  const secondsRaw = Number(raw.secondsPerItem)
  const secondsPerItem = Number.isFinite(secondsRaw)
    ? queryClampHotNewsItemSeconds(
        Math.min(budget.maxSecondsPerItem, Math.max(budget.minSecondsPerItem, secondsRaw))
      )
    : queryClampHotNewsItemSeconds(
        Math.min(
          budget.maxSecondsPerItem,
          Math.max(budget.minSecondsPerItem, budget.durationSec / Math.max(1, items.length))
        )
      )

  return {
    brandName,
    dateLabel: dateLabel || new Date().toLocaleDateString('zh-CN'),
    headline: headline.slice(0, budget.headlineMaxChars),
    summary: summary.slice(0, budget.summaryMaxChars),
    dataSource,
    items: items.slice(0, budget.maxItems),
    secondsPerItem,
    ...(hotTopicName ? { hotTopicName } : {}),
    tickerLines,
    ...(accentColor ? { accentColor } : {})
  }
}

/** 规范化单条：必须有 tag/title；detail 尽量保留，过短时用 title 兜底提示 */
function queryNormalizeHotNewsItem(
  row: unknown,
  budget: HotNewsContentBudget
): HotNewsItem | null {
  if (!row || typeof row !== 'object') return null
  const rec = row as {
    tag?: string
    title?: string
    detail?: string
    source?: string
    seconds?: number
  }
  const tag = String(rec.tag ?? '').trim()
  const title = String(rec.title ?? '').trim()
  if (!tag || !title) return null

  let detail = String(rec.detail ?? '').trim()
  if (detail) {
    detail = detail.slice(0, budget.detailMaxChars)
  }

  const sourceRaw = String(rec.source ?? '').trim()
  const sourcePlaceholder = /^(未知|暂无|无|n\/?a|null|undefined|-|—|－－)$/i
  const source =
    sourceRaw && !sourcePlaceholder.test(sourceRaw) ? sourceRaw.slice(0, 48) : undefined

  const secondsNum = Number(rec.seconds)
  const seconds = Number.isFinite(secondsNum)
    ? queryClampHotNewsItemSeconds(
        Math.min(budget.maxSecondsPerItem, Math.max(budget.minSecondsPerItem, secondsNum))
      )
    : undefined

  return {
    tag,
    title,
    ...(detail ? { detail } : {}),
    ...(source ? { source } : {}),
    ...(seconds != null ? { seconds } : {})
  }
}
