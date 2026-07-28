---
name: 突发简讯
description: >-
  Remotion 新闻竖版模版：大字报标题 + LIVE 滚动带。
  模版代码在 template/；Agent 拼装 props 后 remotion_studio 预览。
remotionVideoTemplate: true
templateDir: template
category: news
compositionId: HotNewsVertical
accent: "#ff4d4f"
durationSec: 15
status: ready
previewKind: hot-news-vertical
---

# 突发简讯（Remotion 模版）

## 信息来源（必选）

新闻类模版**必须**指定信息来源后再拉热点与拼装；禁止无来源编造。

## 模版源码

`template/compositions/hot-news/` + `manifest.json`（竖版 `HotNewsVertical` / `NewsFlashVertical`）。

## 标准流程

1. `remotion_apply_template_skill`：skillId=`remotion-template-news-flash`
2. `remotion_studio` → `remotion_render`
