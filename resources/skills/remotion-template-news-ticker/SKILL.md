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

## 数据来源标注（必选 · 画面可见）

成片**必须**在画面上标注数据来源，禁止只写在对话里而不写入 props。

| 要求 | 说明 |
|------|------|
| props 字段 | `dataSource`（必填字符串）；单条可覆写 `items[].source` |
| 画面展示 | 主文案下方显示「数据来源：…」，轮播时随当前条切换 |
| 文案内容 | 真实出处：媒体名 / 官方机构 / 热榜平台，如「澎湃新闻」「国家市场监督管理总局」「微博热搜」 |
| 禁止 | 空字符串、占位符（「未知」「暂无」）、编造媒体名；禁止省略本字段后渲染 |

拼装前确认：`dataSource` 非空，且预览中能看到「数据来源」字样。

## 模版源码

`template/compositions/hot-news/` + `manifest.json`（compositionId=`NewsTickerWide`）。

## 标准流程

1. `remotion_apply_template_skill`：skillId=`remotion-template-news-ticker`，写入含 `dataSource` 的 HotNewsProps
2. `remotion_studio` → `remotion_render`（compositionId=`NewsTickerWide`）
