---
name: 课程章节导览
description: >-
  Remotion 教育模版：章节序号与知识点 bullet 飞入，适合课程片头。
  用户要做网课/章节导览片头时加载。
remotionVideoTemplate: true
category: education
compositionId: EduChapterIntro
accent: "#6b9e3d"
durationSec: 22
status: draft
---

# 课程章节导览（Remotion 模版）

## 适用场景

- 在线课程章节片头
- 知识点列表飞入动效

## 标准流程

1. 加载 `react-agent-remotion`、`remotion-markup`
2. `remotion_init_project`：`compositionId=EduChapterIntro`
3. 编写章节序号与 bullet 列表动效
4. `remotion_studio` → `remotion_render`

## Composition 约定

| 字段 | 值 |
|------|-----|
| compositionId | `EduChapterIntro` |
| 建议时长 | 22s |
| 状态 | 草稿 |
