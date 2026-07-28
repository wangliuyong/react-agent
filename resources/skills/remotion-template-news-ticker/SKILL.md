---
name: 早报快讯三栏
description: >-
  Remotion 新闻模版：标题区 + 滚动字幕 + 角标时间轴，横屏 16:9。
  模版代码在 template/；拼装后经 remotion_studio 预览。
remotionVideoTemplate: true
templateDir: template
category: news
compositionId: NewsTickerWide
accent: "#e85d4c"
durationSec: 20
status: ready
previewKind: hot-news-wide
---

# 早报快讯三栏（Remotion 模版）

## 信息来源（必选）

新闻类模版**必须**指定信息来源后再拉热点与拼装；禁止无来源编造。

## 模版源码

`template/compositions/hot-news/` + `manifest.json`（compositionId=`NewsTickerWide`）。

## 标准流程

1. `remotion_apply_template_skill`：skillId=`remotion-template-news-ticker`
2. `remotion_studio` → `remotion_render`（compositionId=`NewsTickerWide`）
