import type { ComponentType } from 'react'
import { Composition } from 'remotion'
import { MyComposition } from './Composition'
import { HotNewsComposition } from './compositions/hot-news'
import {
  HOT_NEWS_VERTICAL_DEFAULT_PROPS,
  HOT_NEWS_WIDE_DEFAULT_PROPS
} from './compositions/hot-news/default-props'

/** Remotion Composition 要求宽松 props；运行时由 defaultProps 注入 */
const HotNewsForComposition = HotNewsComposition as unknown as ComponentType<
  Record<string, unknown>
>

/** 热点新闻横版：20s @ 30fps */
const HOT_NEWS_WIDE_DURATION = 600
/** 热点新闻竖版：15s @ 30fps */
const HOT_NEWS_VERTICAL_DURATION = 450

/**
 * Remotion 根入口：在此注册所有 Composition。
 * 每个 Composition 的 id 将用于 remotion_render 的 compositionId 参数。
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Main"
        component={MyComposition}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* 热点新闻 — 横版 16:9（列表 compositionId: HotNews / NewsTickerWide） */}
      <Composition
        id="HotNews"
        component={HotNewsForComposition}
        durationInFrames={HOT_NEWS_WIDE_DURATION}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={HOT_NEWS_WIDE_DEFAULT_PROPS as unknown as Record<string, unknown>}
      />
      <Composition
        id="NewsTickerWide"
        component={HotNewsForComposition}
        durationInFrames={HOT_NEWS_WIDE_DURATION}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={HOT_NEWS_WIDE_DEFAULT_PROPS as unknown as Record<string, unknown>}
      />

      {/* 热点新闻 — 竖版 9:16 */}
      <Composition
        id="HotNewsVertical"
        component={HotNewsForComposition}
        durationInFrames={HOT_NEWS_VERTICAL_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={HOT_NEWS_VERTICAL_DEFAULT_PROPS as unknown as Record<string, unknown>}
      />
      <Composition
        id="NewsFlashVertical"
        component={HotNewsForComposition}
        durationInFrames={HOT_NEWS_VERTICAL_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={HOT_NEWS_VERTICAL_DEFAULT_PROPS as unknown as Record<string, unknown>}
      />
    </>
  )
}
