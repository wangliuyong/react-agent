# 热点话题 → 小红书发布示例

## 示例 1：用户原话（截图场景）

**用户输入：**

> 帮我找一条热点发小红书，内容从新闻网页里找，用 fetch_web_images 抓配图，标题不超过 20 字，本地图片可选。

**Agent 任务清单（update_task_list）：**

```json
{
  "tasks": [
    { "id": "1", "title": "搜索并选定热点话题", "status": "running" },
    { "id": "2", "title": "撰写标题与正文", "status": "pending" },
    { "id": "3", "title": "从来源页抓取配图", "status": "pending" },
    { "id": "4", "title": "发布到小红书", "status": "pending" }
  ]
}
```

**典型工具序列：**

1. `update_task_list` — 创建上述清单
2. `fetch_hot_topics({ "source": "xhs", "maxCount": 20 })` — 拉热点；失败则试 `weibo`、`baidu`、`douyin`
3. `browser_navigate` — 打开选定话题的新闻详情页
4. `browser_snapshot` — 阅读正文，提炼观点
5. `update_task_list` — 第 1 项 `done`，第 2 项 `running`
6. （模型撰写标题与正文，无需工具）
7. `update_task_list` — 第 2 项 `done`，第 3 项 `running`
8. `fetch_web_images({ "pageUrl": "https://...详情页", "maxCount": 3 })`
9. `update_task_list` — 第 3 项 `done`，第 4 项 `running`
10. `xhs_publish_note({ "title": "...", "content": "...", "imagePaths": [...], "autoPublish": true })`
11. `update_task_list` — 第 4 项 `done`

**xhs_publish_note 执行期间**，右侧任务清单会显示子步骤：

- ✓ 打开小红书创作平台
- ✓ 确认登录状态
- ● 上传配图并填写标题正文
- ○ 发布并验证

## 示例 2：用户指定主题（跳过热搜搜索）

**用户输入：**

> 帮我发一条小红书，内容关于今日 A 股收盘速读，标题不超过 20 字，请从相关新闻网页抓取配图。

**简化任务清单：**

1. 搜索 A 股收盘相关新闻（browser_navigate + snapshot）
2. 撰写标题与正文
3. fetch_web_images
4. xhs_publish_note

## 示例 3：fetch_web_images 返回示例

```
已从 https://example.com/news/123 下载 3 张配图：
/Users/.../artifacts/img_abc.jpg
/Users/.../artifacts/img_def.jpg
/Users/.../artifacts/img_ghi.jpg
```

将路径数组传入 `xhs_publish_note.imagePaths`。

## 示例 4：标题与正文风格参考

**选题：** 为什么我们不爱接电话了

**标题（18 字）：** 为什么我们不爱接电话了

**正文片段：**

```
以前电话一响就接，现在看到来电显示只想划走…

不是冷漠，是怕被打断、怕推销、怕尬聊。
微信发文字可以想好了再回，电话是「立刻表演」。

你也是这样吗？评论区说说你最近一次接电话是什么时候 👇
```
