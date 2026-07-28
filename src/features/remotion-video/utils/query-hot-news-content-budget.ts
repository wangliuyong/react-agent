/** Remotion 热点新闻模板帧率（与 starter Root 一致） */
export const HOT_NEWS_VIDEO_FPS = 30

/** 用户可设时长默认值（秒） */
export const DEFAULT_HOT_NEWS_DURATION_SEC = 20

export const HOT_NEWS_DURATION_MIN_SEC = 8
export const HOT_NEWS_DURATION_MAX_SEC = 120

/** 秒 → 帧数，供 Player 与 remotion_init_project 使用 */
export function queryHotNewsDurationInFrames(
  durationSec: number,
  fps: number = HOT_NEWS_VIDEO_FPS
): number {
  const clamped = Math.min(
    HOT_NEWS_DURATION_MAX_SEC,
    Math.max(HOT_NEWS_DURATION_MIN_SEC, durationSec)
  )
  return Math.round(clamped * fps)
}

/** Agent 按视频时长估算应生成的内容量与节奏建议 */
export interface HotNewsContentBudget {
  durationSec: number
  minItems: number
  maxItems: number
  minTickerLines: number
  maxTickerLines: number
  summaryMaxChars: number
  headlineMaxChars: number
  /** 单条详情正文建议字数下限 */
  detailMinChars: number
  /** 单条详情正文建议字数上限 */
  detailMaxChars: number
  /** 建议每条最短展示秒数 */
  minSecondsPerItem: number
  /** 建议每条最长展示秒数 */
  maxSecondsPerItem: number
}

/**
 * 根据成片时长推导文案体量与轮播节奏建议。
 * 为什么：时长越长，分条轮播与 LIVE 快讯需要更多条；详情越长，单条展示秒数宜越大。
 */
export function queryHotNewsContentBudget(durationSec: number): HotNewsContentBudget {
  const duration = Math.min(
    HOT_NEWS_DURATION_MAX_SEC,
    Math.max(HOT_NEWS_DURATION_MIN_SEC, durationSec)
  )

  if (duration <= 12) {
    return {
      durationSec: duration,
      minItems: 2,
      maxItems: 3,
      minTickerLines: 3,
      maxTickerLines: 4,
      summaryMaxChars: 80,
      headlineMaxChars: 28,
      detailMinChars: 40,
      detailMaxChars: 90,
      minSecondsPerItem: 3,
      maxSecondsPerItem: 5
    }
  }
  if (duration <= 20) {
    return {
      durationSec: duration,
      minItems: 3,
      maxItems: 5,
      minTickerLines: 4,
      maxTickerLines: 6,
      summaryMaxChars: 100,
      headlineMaxChars: 36,
      detailMinChars: 60,
      detailMaxChars: 120,
      minSecondsPerItem: 3,
      maxSecondsPerItem: 6
    }
  }
  if (duration <= 35) {
    return {
      durationSec: duration,
      minItems: 4,
      maxItems: 6,
      minTickerLines: 5,
      maxTickerLines: 8,
      summaryMaxChars: 120,
      headlineMaxChars: 40,
      detailMinChars: 70,
      detailMaxChars: 140,
      minSecondsPerItem: 4,
      maxSecondsPerItem: 8
    }
  }
  if (duration <= 60) {
    return {
      durationSec: duration,
      minItems: 5,
      maxItems: 8,
      minTickerLines: 6,
      maxTickerLines: 10,
      summaryMaxChars: 140,
      headlineMaxChars: 42,
      detailMinChars: 80,
      detailMaxChars: 160,
      minSecondsPerItem: 4,
      maxSecondsPerItem: 10
    }
  }
  return {
    durationSec: duration,
    minItems: 6,
    maxItems: 10,
    minTickerLines: 8,
    maxTickerLines: 14,
    summaryMaxChars: 160,
    headlineMaxChars: 48,
    detailMinChars: 90,
    detailMaxChars: 180,
    minSecondsPerItem: 5,
    maxSecondsPerItem: 12
  }
}
