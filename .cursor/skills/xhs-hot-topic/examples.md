# 热点话题 → 小红书发布示例

## 用户输入示例

> 帮我找一条热点发小红书，内容从新闻网页里找，用 fetch_web_images 抓配图，标题不超过 20 字，本地图片可选。

## 典型工具序列

1. `update_task_list` — 创建 4 步任务清单
2. `browser_navigate` — 打开百度热搜
3. `browser_snapshot` — 阅读榜单选定话题
4. `browser_click` — 进入话题详情
5. `fetch_web_images({ pageUrl, maxCount: 3 })`
6. `xhs_publish_note({ title, content, imagePaths, autoPublish: true })`
