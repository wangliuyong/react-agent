---
name: remotion-sfx
description: >-
  Remotion 官方音效库 @remotion/sfx 按需使用指南。视频需要转场嗖声、UI 点击、提示音、
  梗音效时加载本技能；勿在无关任务中预装或引用整库。
---

# Remotion 官方音效（按需）

> 对应 npm 包 [`@remotion/sfx`](https://www.remotion.dev/docs/sfx)，峰值约 -3dB，一般可免署名。

## 何时加载

- 用户明确要求音效、转场声、点击反馈、提示叮声等
- 片头转场、字幕卡点、UI 演示类 Remotion 视频
- **不需要音效时不要加载本技能**，Composition 中也不要 import 音效

## 两种用法（二选一，均按需 import）

### 方式 A：Starter 内置目录（推荐，零配置）

工程内已有 `src/lib/remotion-sfx.ts`，只 import 用到的条目：

```tsx
import { Audio, Sequence } from 'remotion'
import { REMOTION_SFX } from './lib/remotion-sfx'

export const MyVideo = () => (
  <>
    <Sequence from={0} durationInFrames={20}>
      <Audio src={REMOTION_SFX.whoosh.url} volume={0.8} />
    </Sequence>
    <Sequence from={30} durationInFrames={15}>
      <Audio src={REMOTION_SFX.ding.url} volume={0.6} />
    </Sequence>
  </>
)
```

- 音频走 `remotion.media` CDN，**无需**调用 `remotion_enable_sfx`
- 选音时参考 `REMOTION_SFX.*.label` 中文说明

### 方式 B：与官方文档一致的包导入

与 [官方文档](https://www.remotion.dev/docs/audio/sfx) 相同写法时，须先启用解析：

```
remotion_enable_sfx()
```

然后在 Composition 中按需命名导入：

```tsx
import { whoosh, whip } from '@remotion/sfx'
import { Audio, Sequence } from 'remotion'

<Sequence from={0} durationInFrames={24}>
  <Audio src={whip} />
</Sequence>
```

## 常用音效速查

| 导出名 / id | 场景 |
|-------------|------|
| `whoosh` | 转场、划走 |
| `whip` | 硬切、快切 |
| `ding` | 完成、提示 |
| `mouseClick` / `uiSwitch` | UI 演示 |
| `pageTurn` | 翻页、章节 |
| `shutterModern` | 拍照、定格 |
| `recordScratch` | 突然停止 |
| `vineBoom` | 梗、重强调 |

完整列表见 `src/lib/remotion-sfx.ts` 或官方文档。

## 时间轴与音量

- 用 `<Sequence from={帧} durationInFrames={…}>` 对齐画面，避免音效与动效错位
- 多轨叠加时降低 `volume`（如 0.3–0.8），防止削波
- 与 BGM 并存时，音效轨音量通常低于背景音乐

## 灵犀工具

| 工具 | 用途 |
|------|------|
| `remotion_enable_sfx` | 仅在使用 `from '@remotion/sfx'` 时需要 |
| `remotion_studio` | 预览音效与画面是否对齐 |
| `remotion_render` | 导出成片（渲染时会沿用已启用的 alias） |

## 注意

- 不要下载整包音效到 `public/`，按需引用 URL 或单条 import 即可
- 自定义音频仍放 `public/`，用 `staticFile('foo.mp3')`
- 与 `remotion-markup` 中的 `<Audio>` / `<Sequence>` 规则一致
