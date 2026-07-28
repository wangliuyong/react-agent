/**
 * 画幅 / 时长工具：不再挂载写死的 Remotion Composition。
 * 真实画面由技能 template/ 经 remotion_apply_template_skill 拼装后 Studio 预览。
 */
import {
  DEFAULT_HOT_NEWS_DURATION_SEC,
  queryHotNewsDurationInFrames
} from '../utils/query-hot-news-content-budget'
import type { RemotionVideoPreviewKind } from '@shared/remotion-video-template'

/** 热点新闻模板可选画幅 */
export type RemotionVideoAspectRatio = '16:9' | '9:16'

export const REMOTION_VIDEO_ASPECT_RATIO_OPTIONS: {
  value: RemotionVideoAspectRatio
  label: string
}[] = [
  { value: '16:9', label: '横版 16:9' },
  { value: '9:16', label: '竖版 9:16' }
]

/** 预览 / 导出用的画幅与时长配置（无 React 组件） */
export interface RemotionTemplatePlayerConfig {
  compositionId: string
  label: string
  durationInFrames: number
  fps: number
  width: number
  height: number
}

const HOT_NEWS_WIDE: RemotionTemplatePlayerConfig = {
  compositionId: 'HotNews',
  label: '热点新闻 · 横版',
  durationInFrames: 600,
  fps: 30,
  width: 1920,
  height: 1080
}

const HOT_NEWS_VERTICAL: RemotionTemplatePlayerConfig = {
  compositionId: 'HotNewsVertical',
  label: '热点新闻 · 竖版',
  durationInFrames: 450,
  fps: 30,
  width: 1080,
  height: 1920
}

/** 按画幅 + 时长获取导出配置 */
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

/** compositionId / previewKind → 默认画幅 */
export function queryAspectRatioFromCompositionId(
  compositionId: string,
  previewKind?: RemotionVideoPreviewKind
): RemotionVideoAspectRatio {
  if (previewKind === 'hot-news-vertical') return '9:16'
  if (previewKind === 'hot-news-wide') return '16:9'
  if (compositionId === 'HotNewsVertical' || compositionId === 'NewsFlashVertical') {
    return '9:16'
  }
  return '16:9'
}

/** 是否为热点类可拼装模版（有 template 代码的新闻 skill） */
export function queryIsHotNewsTemplateSkill(skillId: string): boolean {
  return (
    skillId === 'remotion-template-hot-news' ||
    skillId === 'remotion-template-news-ticker' ||
    skillId === 'remotion-template-news-flash'
  )
}
