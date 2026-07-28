---
name: 极光律动
description: >-
  Remotion 歌曲类模版：歌词逐行高亮 + 频谱条，适配 9:16 短视频分发。
  在「Remotion 视频生产」页选用本模版，或用户要做歌词/律动短视频时加载。
remotionVideoTemplate: true
category: song
compositionId: SongLyricVertical
accent: "#5b8def"
durationSec: 62
status: ready
---

# 极光律动（Remotion 模版）

## 适用场景

- 竖版歌词 MV / 律动卡点短视频
- 需要逐行高亮歌词与简易频谱动效

## 标准流程

1. `use_skill('react-agent-remotion')` 与 `use_skill('remotion-markup')`
2. `remotion_init_project`：`compositionId=SongLyricVertical`，竖版 `1080×1920`，fps=30
3. 用 `write_file` 编写歌词时间轴与频谱条 Composition
4. `remotion_studio` 预览节奏
5. `remotion_render` 导出 mp4

## Composition 约定

| 字段 | 值 |
|------|-----|
| compositionId | `SongLyricVertical` |
| 画幅 | 9:16（1080×1920） |
| 建议时长 | 约 62s |

## 交付

- 成功后在回复中保留 mp4 绝对路径
- 禁止未渲染成功就声称成片已生成
