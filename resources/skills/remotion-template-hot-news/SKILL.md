---
name: 热点新闻
description: >-
  Remotion 新闻模版：片头闪屏、主标题与分条轮播、底部滚动字幕。
  模版代码在 template/；Agent 读取后与处理后的 props 拼装，经 remotion_studio 预览。
remotionVideoTemplate: true
templateDir: template
category: news
compositionId: HotNews
accent: "#e63946"
durationSec: 20
status: ready
previewKind: hot-news-wide
---

# 热点新闻（Remotion 模版）

## 适用场景

- 横版 16:9 热点速览 / 要闻轮播
- 需要品牌条、角标、条目卡与底部 ticker

## 信息来源（必选）

新闻类模版**必须**指定信息来源（微博 / 百度 / 抖音 / 快手 / 腾讯 / 今日热榜 / 全部）。  
生成与导出前先 `fetch_hot_topics`，禁止无来源编造热点。

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

本技能 `template/` 目录包含完整 Composition（`compositions/hot-news/`）与 `manifest.json`。  
**不要**在应用前端写死组件；由工具 `remotion_apply_template_skill` 拷入会话工程后再预览/渲染。

## 标准流程

1. `use_skill('remotion-template-hot-news')`（或视频页一键拼装）
2. `remotion_apply_template_skill`：skillId=`remotion-template-hot-news`，写入含 `dataSource` 的 HotNewsProps
3. `remotion_studio` 预览节奏（确认画面有「数据来源」）
4. `remotion_render`：`compositionId=HotNews` 或 `HotNewsVertical`

## Composition 约定

| 字段 | 值 |
|------|-----|
| compositionId | `HotNews` / `HotNewsVertical` |
| 画幅 | 16:9 或 9:16 |
| props 文件 | `src/compositions/hot-news/default-props.ts` |

## Props 要点

- `brandName` / `dateLabel` / `headline` / `summary`
- **`dataSource`（必填）**：画面「数据来源：…」文案
- `items[]`：标题、摘要、标签；可选 `source` 覆写本条来源
- `tickerLines[]`：底部滚动快讯

## 交付

- 渲染成功后保留 mp4 绝对路径
