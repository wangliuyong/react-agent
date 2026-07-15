---
name: react-agent-douyin-publish
description: >-
  React Agent 抖音图文发布：douyin_publish_note 工具、fetch_web_images 配图、
  发布工作台多渠道串行、登录暂停与发布确认。在 react-agent 中修改抖音发布逻辑、
  配图策略或创作者中心 DOM 适配时使用。
---

# 抖音图文发布

## 核心文件

| 文件 | 职责 |
|------|------|
| `electron/main/agent/tools/douyin-tools.ts` | `douyin_publish_note` 工具定义 |
| `electron/main/browser/douyin-publish.ts` | 发布流程编排（拟人操作） |
| `electron/main/browser/douyin-dom.ts` | 创作者中心 DOM 适配 |
| `shared/publish-channels.ts` | 渠道 registry（含 xhs / douyin / 视频号预留） |
| `shared/publish-prompt.ts` | 多渠道 Agent 指令构建 |

## 配图优先级（与小红书一致）

1. `imagePaths`（通常来自 `fetch_web_images`）
2. `imageSourceUrl` / `imageUrls`（工具内自动下载，subdir=`douyin-images`）
3. 用户本轮附件（**可选**）

## 发布流程（douyin-publish.ts）

1. 打开 `https://creator.douyin.com/creator-micro/content/upload`
2. 检测登录 → 未登录 `emitAwaitUser`
3. 切换「发布图文」TAB → 上传配图 → 填标题（≤30 字建议）与描述
4. `autoPublish=false` 停在待发布；`fullAccess=false` 发布前再次确认

**当前范围**：仅图文笔记；视频上传后续单独接入。

## Agent 工具

### douyin_publish_note

- `title` / `content` — 必填
- `imagePaths` / `imageSourceUrl` / `imageUrls` — 配图
- `autoPublish` — 是否自动点发布

## 工作台

子任务 `channel` 字段为 `PublishChannelId`（`xhs` | `douyin` | `wechat_channels`）。
`buildPublishPlanPrompt` 会按渠道注入对应工具 hint。
