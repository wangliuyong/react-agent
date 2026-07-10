---
name: react-agent-feature-dev
description: >-
  React Agent 桌面应用（Electron + React + Ant Design + Zustand）功能开发与 CRUD 模式。
  在 react-agent 仓库中新增/修改/删除列表项、嵌套子实体（如发布计划子任务）、
  扩展 features 模块、或调整 IPC 数据流时使用。已验证模式：PublishWorkbench 子任务增删改。
---

# React Agent 功能开发

## 快速定位

| 层级 | 路径 | 职责 |
|------|------|------|
| 共享类型 | `shared/types.ts` | 主进程/渲染进程共用 DTO |
| 功能模块 | `src/features/<domain>/` | 组件、hooks、api、types、index barrel |
| 全局视图 | `src/stores/app-store.ts` | 仅导航 view，不放业务数据 |
| 主进程存储 | `electron/main/store/` | JSON 文件持久化 |
| IPC | `electron/preload/index.ts` + `electron/main/ipc.ts` | `window.api.*` |

**App.tsx 只做装配**：`hydrate` 各 store + 订阅 Agent 事件，业务 UI 在 features。

## API 命名（强制）

- 读数据：`query*`（如 `queryPublishPlans`）
- 写/删数据：`post*`（如 `postPublishPlan`、`postDeletePublishPlan`）
- 渲染进程封装在 `src/features/<domain>/api.ts`，调用 `window.api.*`

## Zustand Store 模式

```typescript
// hooks/useXxxStore.ts
interface XxxState {
  items: Item[]
  activeId: string | null
  hydrate: () => Promise<void>           // App 启动时拉取
  saveItem: (item: Item) => Promise<void> // 整对象 upsert
  removeItem: (id: string) => Promise<void> // 顶层实体删除
}
```

- `hydrate` 在 `App.tsx` 的 `useEffect` 中调用
- 顶层实体 CRUD 放 store；**嵌套数组项**（如 `plan.subTasks`）可在组件内 immutably 修改后 `savePlan`

## 嵌套实体 CRUD（子任务模式）

适用于 `PublishPlan.subTasks` 等同父对象内嵌数组。

### 新增

```typescript
const next = {
  ...active,
  subTasks: [...active.subTasks, createEmptySubTask()],
  updatedAt: Date.now()
}
await savePlan(next)
setSubEditing(next.subTasks[next.subTasks.length - 1]) // 可选：打开编辑弹窗
```

### 编辑

- 本地 state 持有编辑副本：`useState<PublishSubTask | null>(null)`
- Modal `onOk` 时 `map` 替换对应 id，再 `savePlan`

### 删除

```typescript
const removeSubTask = async (subId: string): Promise<void> => {
  if (!active) return
  const next = {
    ...active,
    subTasks: active.subTasks.filter((s) => s.id !== subId),
    updatedAt: Date.now()
  }
  await savePlan(next)
  if (subEditing?.id === subId) setSubEditing(null) // 清理编辑态
  message.success('已删除子任务')
}
```

**UI 要求**：
- 删除用 Ant Design `Popconfirm` 二次确认
- `Button type="link" size="small" danger icon={<DeleteOutlined />}`
- 与同级「编辑」按钮放 `Space size={0}`

## UI 组件库

优先 **Ant Design**（已全局 ConfigProvider zh_CN）：
- 反馈：`message.success` / `message.warning`
- 列表空态：`Empty`
- 表单弹窗：`Modal` + `Form layout="vertical"`
- 危险操作：`Popconfirm`

样式用 **CSS Modules**（`*.module.css`），不改全局 CSS。

## 类型与工厂函数

- 接口定义在 `shared/types.ts`
- 模块内工厂函数在 `src/features/<domain>/types.ts`（如 `createEmptySubTask`）
- 禁止 `any` 兜底业务字段

## 注释规范

对非显而易见的业务规则写**中文 JSDoc**（说明「为什么」），避免复述代码。

## 验证清单

任务完成前必须：

```bash
pnpm typecheck   # 必跑
pnpm dev         # 手动验证交互（如删除确认、编辑态清理）
```

## 最小改动原则

1. 只改需求涉及的 feature 文件
2. 嵌套 CRUD 不需要新增 store 方法，除非多处复用
3. 不「顺手重构」无关模块
4. 新 IPC 才改 preload/main；纯 UI 嵌套操作通常只改组件 + 已有 `savePlan`

## 任务完成后沉淀

若本次实现验证了**新的可复用模式**（新 feature 结构、新 IPC 约定、新 Agent 工具链），在本 skill 目录追加：

- 简短步骤 → 写入 `SKILL.md` 对应章节
- 完整代码示例 → 写入 [examples.md](examples.md)

保持 SKILL.md < 500 行，示例外置。

## 参考

- 项目技能路由：[react-agent](../react-agent/SKILL.md)
- 子任务增删改完整示例：[examples.md](examples.md)
- 工程化分层：可叠加 `senior-frontend-engineering` skill
