---
name: xhs-hot-topic
description: >-
  热点话题搜索 → 内容创作 → 网页抓配图 → 小红书图文发布的端到端 Agent 工作流。
  在用户要求「找热点/热搜发小红书」「从新闻网页抓配图发布」时使用。
  热点调研优先 fetch_hot_topics（含 xhs/weibo/baidu/douyin/kuaishou/tencent）。
---

# 热点话题 → 小红书发布

## 适用场景

用户希望 Agent **先找热点/新闻**，再自动撰写并发布小红书图文。

## 标准任务清单（开始时用 update_task_list 创建）

| id | 标题 | 说明 |
|----|------|------|
| 1 | 搜索并选定热点话题 | 浏览热搜/新闻，选适合小红书风格的选题 |
| 2 | 撰写标题与正文 | 标题 ≤20 字，正文口语化、有共鸣 |
| 3 | 从来源页抓取配图 | `fetch_web_images` |
| 4 | 发布到小红书 | `xhs_publish_note` |

每完成一步立即 `update_task_list` 将对应项标为 `done`，下一步标为 `running`。

## 执行步骤

### 1. 搜索热点（fetch_hot_topics + browser_*）

**优先**调用 `fetch_hot_topics`（API 优先，失败再无头浏览器兜底），按场景选 `source`：

| source | 平台 | 适用场景 |
|--------|------|----------|
| `xhs` | 小红书 | 发小红书笔记（首选） |
| `douyin` | 抖音 | 发抖音图文 |
| `weibo` | 微博 | 综合热搜、舆论热点 |
| `baidu` | 百度 | 综合热搜 |
| `kuaishou` | 快手 | 短视频平台热点 |
| `tencent` | 腾讯新闻 | 资讯类选题 |

示例：`fetch_hot_topics({ "source": "xhs", "maxCount": 20 })`

若工具返回 `hotTopicsOk≠1`，按上表换 `source` 重试；仍失败再用 `browser_navigate` 打开对应热榜页补读。

选题标准：贴近年轻人生活、有共鸣；避免纯政治与负面灾难；有可用新闻配图来源页。

### 2. 撰写内容

- 标题 ≤20 字，带情绪或悬念
- 正文 300～800 字，口语化，结尾可互动提问

### 3. 抓取配图（fetch_web_images）

```json
{ "pageUrl": "https://...详情页", "maxCount": 3 }
```

用户本地上传仅为可选补充。

### 4. 发布（xhs_publish_note）

```json
{
  "title": "不超过20字的标题",
  "content": "正文全文",
  "imagePaths": ["/path/from/fetch_web_images/..."],
  "autoPublish": true
}
```

## 禁止事项

- 不要跳过热点调研直接编造内容（除非用户已给出明确主题）
- 不要默认要求用户上传本地图片
- 不要编造已发布成功，以工具返回为准
