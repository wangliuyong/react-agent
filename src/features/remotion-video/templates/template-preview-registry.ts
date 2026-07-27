import type { FC } from 'react'
import type { HotNewsProps } from '@remotion-starter/compositions/hot-news/types'
import {
  HOT_NEWS_VERTICAL_DEFAULT_PROPS,
  HOT_NEWS_WIDE_DEFAULT_PROPS
} from '@remotion-starter/compositions/hot-news/default-props'
import { HotNewsComposition } from '@remotion-starter/compositions/hot-news/HotNewsComposition'
import {
  DEFAULT_HOT_NEWS_DURATION_SEC,
  queryHotNewsDurationInFrames
} from '../utils/query-hot-news-content-budget'

/** 可在应用内 Player 预览的 Composition 配置 */
export interface RemotionTemplatePlayerConfig {
  compositionId: string
  label: string
  component: FC<HotNewsProps>
  durationInFrames: number
  fps: number
  width: number
  height: number
  defaultProps: HotNewsProps
}

/** 热点新闻模板可选画幅 */
export type RemotionVideoAspectRatio = '16:9' | '9:16'

export const REMOTION_VIDEO_ASPECT_RATIO_OPTIONS: {
  value: RemotionVideoAspectRatio
  label: string
}[] = [
  { value: '16:9', label: '横版 16:9' },
  { value: '9:16', label: '竖版 9:16' }
]

const HOT_NEWS_WIDE: RemotionTemplatePlayerConfig = {
  compositionId: 'HotNews',
  label: '热点新闻 · 横版',
  component: HotNewsComposition,
  durationInFrames: 600,
  fps: 30,
  width: 1920,
  height: 1080,
  defaultProps: HOT_NEWS_WIDE_DEFAULT_PROPS
}

const HOT_NEWS_VERTICAL: RemotionTemplatePlayerConfig = {
  compositionId: 'HotNewsVertical',
  label: '热点新闻 · 竖版',
  component: HotNewsComposition,
  durationInFrames: 450,
  fps: 30,
  width: 1080,
  height: 1920,
  defaultProps: HOT_NEWS_VERTICAL_DEFAULT_PROPS
}

/** compositionId → 预览配置（与 starter Root.tsx 注册 id 对齐） */
const TEMPLATE_BY_COMPOSITION_ID: Record<string, RemotionTemplatePlayerConfig> = {
  HotNews: HOT_NEWS_WIDE,
  NewsTickerWide: HOT_NEWS_WIDE,
  HotNewsVertical: HOT_NEWS_VERTICAL,
  NewsFlashVertical: HOT_NEWS_VERTICAL
}

/** 按画幅 + 时长获取预览 / 导出配置 */
export function queryHotNewsPlayerConfigByAspect(
  ratio: RemotionVideoAspectRatio,
  durationSec: number = DEFAULT_HOT_NEWS_DURATION_SEC
): RemotionTemplatePlayerConfig {
  const base = ratio === '9:16' ? HOT_NEWS_VERTICAL : HOT_NEWS_WIDE
  return {
    ...base,
    durationInFrames: queryHotNewsDurationInFrames(durationSec, base.fps)
  }
}

/** 列表卡片 compositionId → 默认画幅 */
export function queryAspectRatioFromCompositionId(
  compositionId: string
): RemotionVideoAspectRatio {
  if (compositionId === 'HotNewsVertical' || compositionId === 'NewsFlashVertical') {
    return '9:16'
  }
  return '16:9'
}

/** 列表项是否支持内置 Player 预览 */
export function queryRemotionTemplatePreview(
  compositionId: string
): RemotionTemplatePlayerConfig | undefined {
  return TEMPLATE_BY_COMPOSITION_ID[compositionId]
}
