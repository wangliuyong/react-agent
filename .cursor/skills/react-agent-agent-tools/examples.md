# Agent 工具示例

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
