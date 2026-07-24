---
name: react-agent-xhs-hot-topic
description: >-
  热点话题搜索 → 内容创作 → 网页抓配图 → 小红书图文发布的端到端 Agent 工作流。
  在用户要求「找热点/热搜发小红书」「从新闻网页抓配图发布」「帮我发一条小红书内容关于…」
  且需先调研热点时使用。热点优先 fetch_hot_topics（xhs/weibo/baidu/douyin/kuaishou/tencent）。
---

# 热点话题 → 小红书发布

## 适用场景

用户希望 Agent **先找热点/新闻**，再自动撰写并发布小红书图文，例如：

- 「帮我找一条热点发小红书…」
- 「从热搜/新闻里选题，标题不超过 20 字，用 fetch_web_images 抓配图」
- 「内容贴近年轻人生活，本地图片可选」

## 标准任务清单（开始时用 update_task_list 创建）

| id | 标题 | 说明 |
|----|------|------|
| 1 | 搜索并选定热点话题 | 浏览热搜/新闻，选适合小红书风格的选题 |
| 2 | 撰写标题与正文 | 标题 ≤20 字，正文口语化、有共鸣 |
| 3 | 从来源页抓取配图 | `fetch_web_images` |
| 4 | 发布到小红书 | `xhs_publish_note`（内部会再更新 4 步子清单） |

每完成一步立即 `update_task_list` 将对应项标为 `done`，下一步标为 `running`。

## 执行步骤

### 1. 搜索热点（fetch_hot_topics + browser_*）

**优先**调用 `fetch_hot_topics`，按平台与任务选 `source`：

| source | 平台 | 说明 |
|--------|------|------|
| `xhs` | 小红书 | 发小红书时首选 |
| `douyin` | 抖音 | 发抖音图文时首选 |
| `weibo` | 微博 | 综合热搜 |
| `baidu` | 百度 | 综合热搜 |
| `kuaishou` | 快手 | 短视频热点 |
| `tencent` | 腾讯新闻 | 资讯热点 |

```json
{ "source": "xhs", "maxCount": 20 }
```

`hotTopicsOk=1` 时从 `hotTopics` 文本选题；失败则换 `source` 重试。全部失败再走浏览器：

```
browser_navigate → browser_snapshot → 阅读榜单
→ browser_click 进入感兴趣话题 → browser_snapshot 读详情
```

**选题标准**（小红书友好）：

- 贴近年轻人日常生活、情感共鸣、轻科普
- 避免纯政治、负面灾难、过度营销
- 有可用新闻配图来源页

选定后记住：**话题标题、来源 URL、核心观点**。

### 2. 撰写内容

| 字段 | 要求 |
|------|------|
| 标题 | ≤20 字，带情绪或悬念，适合小红书 |
| 正文 | 300～800 字；开头抓人；分段清晰；结尾可互动提问 |
| 风格 | 口语化、第一人称或闺蜜分享感，避免新闻稿腔 |

### 3. 抓取配图（fetch_web_images）

**必须**在发布前调用，参数示例：

```json
{
  "pageUrl": "https://...新闻或话题详情页",
  "maxCount": 3
}
```

- 优先用步骤 1 浏览过的**详情页 URL**
- 返回本地绝对路径 → 传给 `xhs_publish_note.imagePaths`
- 用户本地上传仅为**可选补充**，无附件不要强求

### 4. 发布（xhs_publish_note）

```json
{
  "title": "不超过20字的标题",
  "content": "正文全文",
  "imagePaths": ["/path/from/fetch_web_images/..."],
  "autoPublish": true
}
```

也可合并：`imageSourceUrl` 传来源页让工具内下载（仍建议先 `fetch_web_images` 便于确认）。

**内部子任务**（工具自动更新，无需重复创建）：

1. 打开小红书创作平台
2. 确认登录状态
3. 上传配图并填写标题正文
4. 发布并验证

### 5. 收尾

- 以工具返回为准，**不要编造**已发布成功
- 未登录 → 告知用户去右侧「智能体浏览器」扫码，点「继续」
- 非完全访问模式 → 正式发布前会暂停确认
- 全部完成后，任务清单 4 项均为 `done`

## 禁止事项

- 不要跳过热点调研直接编造内容（除非用户已给出明确主题）
- 不要默认要求用户上传本地图片
- 不要用脚本直接改 DOM；交互走 `browser_*` 或 `xhs_publish_note`
- 不要在 `fetch_web_images` 失败时静默发布无图笔记

## 失败回退

| 情况 | 处理 |
|------|------|
| 热搜 API 失败 | 换 `fetch_hot_topics` 的 `source`（weibo/baidu/douyin/tencent/kuaishou/xhs）重试 |
| 热搜页结构变化 | `browser_snapshot` 排查，换来源或换 selector 文案 |
| 配图下载失败 | 换 `imageUrls` 直链或换来源页重试 `fetch_web_images` |
| 创作台 DOM 改版 | `browser_snapshot` + `browser_*` 原子工具补操作 |
| 发布失败 | 读工具返回，修正后重调 `xhs_publish_note` |

## 相关技能

- 发布细节与 DOM：[react-agent-xhs-publish](../react-agent-xhs-publish/SKILL.md)
- 浏览器异常：[react-agent-browser](../react-agent-browser/SKILL.md)
