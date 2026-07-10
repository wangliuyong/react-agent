# React Agent 功能开发示例

## 示例 1：子任务删除（已验证，2026-07-10）

**需求**：发布工作台子任务卡片增加删除能力。

**改动文件**：仅 `src/features/publish/components/PublishWorkbench.tsx`

**要点**：
1. 不新增 store 方法，复用 `savePlan` 持久化
2. `Popconfirm` 防误删
3. 删除时若 `subEditing` 指向同一 id，关闭 Modal

**关键 diff**：

```tsx
// imports 增加 Popconfirm, DeleteOutlined

/** 从当前计划中移除指定子任务 */
const removeSubTask = async (subId: string): Promise<void> => {
  if (!active) return
  const next = {
    ...active,
    subTasks: active.subTasks.filter((s) => s.id !== subId),
    updatedAt: Date.now()
  }
  await savePlan(next)
  if (subEditing?.id === subId) setSubEditing(null)
  message.success('已删除子任务')
}

// 子任务卡片标题行
<Space size={0}>
  <Button type="link" size="small" onClick={() => setSubEditing(sub)}>编辑</Button>
  <Popconfirm title="确定删除该子任务？" onConfirm={() => void removeSubTask(sub.id)}>
    <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
  </Popconfirm>
</Space>
```

**验证**：`pnpm typecheck` 通过；删除后侧边栏子任务计数自动更新。

---

## 示例 2：子任务新增（同文件既有模式）

```tsx
<Button
  block
  icon={<PlusOutlined />}
  onClick={async () => {
    const next = {
      ...active,
      subTasks: [...active.subTasks, createEmptySubTask()],
      updatedAt: Date.now()
    }
    await savePlan(next)
    setSubEditing(next.subTasks[next.subTasks.length - 1])
  }}
>
  添加子任务
</Button>
```

---

## 示例 3：顶层计划删除（store 层）

顶层实体删除走 store，见 `usePublishStore.removePlan`：

```typescript
removePlan: async (id) => {
  await postDeletePublishPlan(id)
  set((s) => {
    const plans = s.plans.filter((p) => p.id !== id)
    return {
      plans,
      activePlanId: s.activePlanId === id ? (plans[0]?.id ?? null) : s.activePlanId
    }
  })
}
```

**决策**：顶层实体 → store + 专用 delete API；嵌套数组项 → 组件 filter + save upsert。
