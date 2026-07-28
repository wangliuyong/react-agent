---
name: 深夜电台片头
description: >-
  Remotion 歌曲/品牌模版：黑胶纹理与波形叠化，约 15s 开场片头。
  用户要做电台/播客/品牌片头时加载本技能。
remotionVideoTemplate: true
category: song
compositionId: RadioIntro
accent: "#8b6fd4"
durationSec: 15
status: draft
---

# 深夜电台片头（Remotion 模版）

## 适用场景

- 播客 / 电台节目片头
- 短品牌开场（约 15 秒）

## 标准流程

1. 加载 `react-agent-remotion`、`remotion-design-system`
2. `remotion_init_project`：`compositionId=RadioIntro`，按投放选择横/竖版
3. 编写黑胶纹理、波形与标题叠化
4. `remotion_studio` → `remotion_render`

## Composition 约定

| 字段 | 值 |
|------|-----|
| compositionId | `RadioIntro` |
| 建议时长 | 15s |
| 状态 | 草稿（可扩展 props） |
