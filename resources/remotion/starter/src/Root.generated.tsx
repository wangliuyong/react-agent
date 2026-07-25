/**
 * 由灵犀自动生成：画幅 / 时长 / defaultProps。
 * remotion_init_project / remotion_apply_template 会覆盖本文件。
 */
import React from 'react'
import { Composition } from 'remotion'
import { ActiveTemplate } from './ActiveTemplate'

export const GENERATED_COMPOSITION = {
  id: 'Main',
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 300
} as const

export const GENERATED_DEFAULT_PROPS = {} as const

/** 注册到 RemotionRoot 的主 Composition */
export const GeneratedMainComposition: React.FC = () => (
  <Composition
    id={GENERATED_COMPOSITION.id}
    component={ActiveTemplate}
    durationInFrames={GENERATED_COMPOSITION.durationInFrames}
    fps={GENERATED_COMPOSITION.fps}
    width={GENERATED_COMPOSITION.width}
    height={GENERATED_COMPOSITION.height}
    defaultProps={GENERATED_DEFAULT_PROPS as Record<string, unknown>}
  />
)
