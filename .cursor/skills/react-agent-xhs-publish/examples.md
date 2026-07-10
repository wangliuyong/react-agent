# 小红书发布示例

## 示例：用户聊天发布（推荐路径）

用户输入：
> 帮我发一条小红书，内容关于今日 A 股收盘速读，标题不超过 20 字。请从相关新闻网页抓取配图后发布。

Agent 应：
1. `update_task_list`
2. `fetch_web_images({ pageUrl: '...' })`
3. `xhs_publish_note({ title, content, imagePaths, autoPublish: true })`

## 示例：xhs_publish_note 内配图回退

```typescript
// xhs-tools.ts execute 内顺序
let imagePaths = args.imagePaths?.filter(Boolean) ?? []
if (!imagePaths.length) {
  const fetched = await fetchWebImages({ pageUrl, imageUrls, maxCount: 3, signal: ctx.signal })
  imagePaths = fetched.paths
}
if (!imagePaths.length && ctx.attachmentPaths.length) {
  imagePaths = [...ctx.attachmentPaths]
}
```

## 示例：buildSubTaskPrompt 片段

```typescript
return [
  `请帮我在${sub.channel}发布一条内容。`,
  `内容要求：${sub.contentPrompt}`,
  '配图：优先用 fetch_web_images 从相关新闻/内容来源网页抓取；用户本地上传仅为可选。',
  '优先使用 xhs_publish_note（可传 imageSourceUrl 或先 fetch 再传 imagePaths）。'
].filter(Boolean).join('\n')
```
