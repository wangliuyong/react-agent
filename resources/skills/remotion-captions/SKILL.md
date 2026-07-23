---
name: remotion-captions
description: >-
  Remotion 字幕与 Caption 处理。需要卡拉 OK、SRT 导入或字幕动画时加载本技能。
---

# Remotion 字幕（Captions）

> 改编自 Remotion 官方 `remotion-captions` 技能。

## Caption 数据结构

```ts
import type { Caption } from '@remotion/captions'

type Caption = {
  text: string
  startMs: number
  endMs: number
  timestampMs: number | null
  confidence: number | null
}
```

## 在 Composition 中展示字幕

1. 准备 `Caption[]` 数组（可手写、从 TTS 时间轴生成、或从 SRT 解析）
2. 根据 `useCurrentFrame()` 与 `fps` 计算当前毫秒：`frame / fps * 1000`
3. 筛选 `startMs <= now < endMs` 的条目渲染

```tsx
import { useCurrentFrame, useVideoConfig, AbsoluteFill } from 'remotion'
import type { Caption } from '@remotion/captions'

const CAPTIONS: Caption[] = [
  { text: '欢迎来到灵犀', startMs: 0, endMs: 2000, timestampMs: null, confidence: null },
  { text: '这是第二句旁白', startMs: 2000, endMs: 4500, timestampMs: null, confidence: null }
]

export const SubtitledVideo: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const nowMs = (frame / fps) * 1000
  const active = CAPTIONS.find((c) => nowMs >= c.startMs && nowMs < c.endMs)

  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 120 }}>
      {active ? (
        <div style={{
          background: 'rgba(0,0,0,0.65)',
          color: '#fff',
          fontSize: 48,
          padding: '16px 32px',
          borderRadius: 12
        }}>
          {active.text}
        </div>
      ) : null}
    </AbsoluteFill>
  )
}
```

## 与灵犀工具配合

| 步骤 | 工具/技能 |
|------|-----------|
| 初始化工程 | `remotion_init_project` |
| 编写带字幕 Composition | `write_file` + 本技能 |
| 可选旁白音频 | `generate_scene_assets` 的 TTS 或外部 mp3 放 public/ |
| 渲染 | `remotion_render` |

## 高级能力（官方）

- `@remotion/captions` 组件库
- SRT 导入、逐字高亮（卡拉 OK）
- 语音转写生成 Caption

详见 https://www.remotion.dev/docs/captions
