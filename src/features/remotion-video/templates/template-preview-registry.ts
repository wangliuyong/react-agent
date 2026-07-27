import type { FC } from 'react'
import type { HotNewsProps } from '@remotion-starter/compositions/hot-news/types'
import {
  HOT_NEWS_VERTICAL_DEFAULT_PROPS,
  HOT_NEWS_WIDE_DEFAULT_PROPS
} from '@remotion-starter/compositions/hot-news/default-props'
import { HotNewsComposition } from '@remotion-starter/compositions/hot-news/HotNewsComposition'

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

/** 列表项是否支持内置 Player 预览 */
export function queryRemotionTemplatePreview(
  compositionId: string
): RemotionTemplatePlayerConfig | undefined {
  return TEMPLATE_BY_COMPOSITION_ID[compositionId]
}
