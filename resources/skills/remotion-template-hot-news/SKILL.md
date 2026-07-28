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

## 模版源码

本技能 `template/` 目录包含完整 Composition（`compositions/hot-news/`）与 `manifest.json`。  
**不要**在应用前端写死组件；由工具 `remotion_apply_template_skill` 拷入会话工程后再预览/渲染。

## 标准流程

1. `use_skill('remotion-template-hot-news')`（或视频页一键拼装）
2. `remotion_apply_template_skill`：skillId=`remotion-template-hot-news`，写入处理后的 HotNewsProps
3. `remotion_studio` 预览节奏
4. `remotion_render`：`compositionId=HotNews` 或 `HotNewsVertical`

## Composition 约定

| 字段 | 值 |
|------|-----|
| compositionId | `HotNews` / `HotNewsVertical` |
| 画幅 | 16:9 或 9:16 |
| props 文件 | `src/compositions/hot-news/default-props.ts` |

## Props 要点

- `brandName` / `dateLabel` / `headline` / `summary`
- `items[]`：标题、摘要、标签
- `tickerLines[]`：底部滚动快讯

## 交付

- 渲染成功后保留 mp4 绝对路径
