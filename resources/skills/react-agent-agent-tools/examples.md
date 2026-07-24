# Agent 工具示例

## 示例：fetch_hot_topics 多平台热点

`fetch_hot_topics` 参数 `source`：`weibo` | `baidu` | `douyin` | `kuaishou` | `xhs` | `tencent`。

```json
{ "source": "douyin", "maxCount": 20 }
```

成功时工具结果含 `@@workflow_ctx@@`，写入 `hotTopicsOk=1` 与 `hotTopics` 文本；失败时 `hotTopicsOk=0`，应换 `source` 重试或走无头浏览器兜底。

调研任务推荐顺序：平台对口优先（发小红书用 `xhs`，发抖音用 `douyin`），再试 `weibo` → `baidu` → `tencent` → `kuaishou`。

## 示例：fetch_web_images + xhs_publish_note 协作

模型侧推荐流程（已在 SYSTEM_PROMPT 中）：

1. `update_task_list` 列出步骤
2. `fetch_web_images({ pageUrl })` → 返回本地路径
3. `xhs_publish_note({ title, content, imagePaths, autoPublish })`
4. 失败时用 `browser_snapshot` + `browser_click` 排查

## 示例：工具内使用 ctx

```typescript
async execute(args, ctx) {
  if (!ctx.fullAccess) {
    await ctx.emitAwaitUser('即将执行敏感操作，请确认后继续')
  }
  ctx.updateTasks((tasks) =>
    tasks.map((t) => (t.id === '1' ? { ...t, status: 'running' } : t))
  )
  if (ctx.signal?.aborted) return '用户已中止'
  return '操作完成'
}
```
