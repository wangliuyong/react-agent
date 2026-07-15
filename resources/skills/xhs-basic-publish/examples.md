# 小红书基础发布示例

## 用户输入

> 帮我发一条小红书，内容关于今日 A 股收盘速读，标题不超过 20 字。请从相关新闻网页抓取配图后发布。

## 工具序列

1. `update_task_list`
2. `browser_navigate` — 搜索 A 股收盘新闻
3. `browser_snapshot` — 阅读并选定来源
4. `fetch_web_images({ pageUrl })`
5. `xhs_publish_note({ title, content, imagePaths, autoPublish: true })`
