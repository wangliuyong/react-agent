# Workflow Canvas Fullscreen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让流程抽屉内「画布编辑区」支持浏览器 Fullscreen API OS 级全屏，且全屏内节点编辑浮层仍可用。

**Architecture:** 抽可复用 `useElementFullscreen` hook 驱动 `.canvasPanel` 的 `requestFullscreen`；Drawer 标题栏放切换按钮；全屏期间把 Modal/Dropdown 的容器挂到 panel，避免浮层落在全屏顶层外。

**Tech Stack:** React 19、Ant Design 5、CSS Modules、Fullscreen API、`pnpm typecheck`（仓库无前端单测 runner）

## Global Constraints

- 全屏目标仅为 `.canvasPanel`（面板标题 + WorkflowCanvas），不含保存/立即运行
- 使用浏览器 Fullscreen API，禁止 Electron `setFullScreen` / 新 IPC
- API 命名：本功能无后端 query/post；UI 状态用 `isFullscreen` / `toggleFullscreen` / `exitFullscreen`
- 优先 Ant Design 组件；样式对齐技能市场（`--db-*` token）
- 图标与 antd 组件依赖项目 `unplugin-auto-import`，无需手写 antd import（若文件已有显式 import 则保持一致）
- 验证：`pnpm typecheck` + 手测全屏交互
- Spec：`docs/superpowers/specs/2026-07-14-workflow-canvas-fullscreen-design.md`

## File Structure

| 文件 | 职责 |
|------|------|
| Create: `src/hooks/useElementFullscreen.ts` | Fullscreen API 封装 |
| Modify: `src/features/workflows/components/WorkflowCanvasDrawer/WorkflowCanvasDrawer.tsx` | ref、按钮、向画布传 props |
| Modify: `src/features/workflows/components/WorkflowCanvasDrawer/WorkflowCanvasDrawer.module.css` | 按钮与 `:fullscreen` 布局 |
| Modify: `src/features/workflows/components/WorkflowCanvas/WorkflowCanvas.tsx` | 透传全屏容器给 Dropdown/Modal |
| Modify: `src/features/workflows/components/WorkflowNodeEditModal/WorkflowNodeEditModal.tsx` | 全屏时 `getContainer` |

---

### Task 1: `useElementFullscreen` hook

**Files:**
- Create: `src/hooks/useElementFullscreen.ts`

**Interfaces:**
- Consumes: DOM Fullscreen API、`antd` `message`
- Produces:

```ts
import type { RefObject } from 'react'

export function useElementFullscreen(targetRef: RefObject<HTMLElement | null>): {
  isFullscreen: boolean
  toggleFullscreen: () => Promise<void>
  exitFullscreen: () => Promise<void>
}
```

- [ ] **Step 1: 创建 hook 文件**

```ts
import { useCallback, useEffect, useState, type RefObject } from 'react'
import { message } from 'antd'

/**
 * 对任意 DOM 元素封装浏览器 Fullscreen API。
 * 以 `document.fullscreenElement === targetRef.current` 判定是否处于本目标的全屏态。
 */
export function useElementFullscreen(targetRef: RefObject<HTMLElement | null>): {
  isFullscreen: boolean
  toggleFullscreen: () => Promise<void>
  exitFullscreen: () => Promise<void>
} {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const syncFullscreenState = useCallback((): void => {
    setIsFullscreen(document.fullscreenElement === targetRef.current)
  }, [targetRef])

  useEffect(() => {
    document.addEventListener('fullscreenchange', syncFullscreenState)
    syncFullscreenState()
    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreenState)
      if (document.fullscreenElement === targetRef.current) {
        void document.exitFullscreen().catch(() => {
          /* 卸载收尾失败忽略 */
        })
      }
    }
  }, [syncFullscreenState, targetRef])

  const exitFullscreen = useCallback(async (): Promise<void> => {
    if (!document.fullscreenElement) return
    if (typeof document.exitFullscreen !== 'function') {
      message.warning('当前环境不支持退出全屏')
      return
    }
    try {
      await document.exitFullscreen()
    } catch {
      message.warning('退出全屏失败')
    }
  }, [])

  const toggleFullscreen = useCallback(async (): Promise<void> => {
    const el = targetRef.current
    if (!el) {
      message.warning('全屏目标未就绪')
      return
    }
    if (document.fullscreenElement === el) {
      await exitFullscreen()
      return
    }
    if (typeof el.requestFullscreen !== 'function') {
      message.warning('当前环境不支持全屏')
      return
    }
    try {
      await el.requestFullscreen()
    } catch {
      message.warning('无法进入全屏，请检查系统或浏览器权限')
    }
  }, [targetRef, exitFullscreen])

  return { isFullscreen, toggleFullscreen, exitFullscreen }
}
```

- [ ] **Step 2: 类型检查**

Run: `pnpm typecheck`  
Expected: 无与该文件相关的错误（全项目通过或仅有既有无关错误）

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useElementFullscreen.ts
git commit -m "$(cat <<'EOF'
feat: add useElementFullscreen hook for DOM fullscreen

EOF
)"
```

---

### Task 2: Drawer 面板接入全屏按钮与样式

**Files:**
- Modify: `src/features/workflows/components/WorkflowCanvasDrawer/WorkflowCanvasDrawer.tsx`
- Modify: `src/features/workflows/components/WorkflowCanvasDrawer/WorkflowCanvasDrawer.module.css`

**Interfaces:**
- Consumes: `useElementFullscreen` from `@/hooks/useElementFullscreen`（或相对路径 `../../../../hooks/useElementFullscreen`，以项目 `@/` 别名为准）
- Produces: `WorkflowCanvas` 将收到 `isFullscreen` 与 `fullscreenContainer`（Task 3 接线）

- [ ] **Step 1: 更新 CSS**

在 `WorkflowCanvasDrawer.module.css` 末尾追加（并调整 `canvasPanelHead` 使右侧可放按钮）：

将 `.canvasPanelHead` 改为：

```css
.canvasPanelHead {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--db-border-light);
  flex-shrink: 0;
}
```

（保持现有即可；在 head 内右侧新增按钮容器）

追加：

```css
.canvasPanelActions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  margin-left: auto;
}

.fullscreenBtn {
  width: 32px;
  height: 32px;
  padding: 0;
  color: var(--db-text-secondary);
  border-radius: var(--db-radius-md);
}

.fullscreenBtn:hover {
  color: var(--db-text) !important;
  background: var(--db-hover) !important;
}

.canvasPanel:fullscreen {
  width: 100%;
  height: 100%;
  border-radius: 0;
  border: none;
  background: var(--db-bg-content);
}
```

- [ ] **Step 2: 更新 Drawer 组件**

在 `WorkflowCanvasDrawer.tsx`：

1. 增加：
```ts
import { useRef } from 'react'
import { useElementFullscreen } from '@/hooks/useElementFullscreen'
```
（若 `@/` 解析失败，改用相对导入）

2. 组件内：
```ts
const canvasPanelRef = useRef<HTMLDivElement>(null)
const { isFullscreen, toggleFullscreen, exitFullscreen } =
  useElementFullscreen(canvasPanelRef)

/** 关闭抽屉时若仍全屏，先退出，避免残留全屏壳 */
const handleClose = (): void => {
  if (isFullscreen) {
    void exitFullscreen().finally(() => onClose())
    return
  }
  onClose()
}
```

3. `Drawer` 的 `onClose={handleClose}`

4. `.canvasPanel` 加 `ref={canvasPanelRef}`

5. `canvasPanelHead` 末尾（`canvasPanelText` 之后）增加：

```tsx
<div className={styles.canvasPanelActions}>
  <Button
    type="text"
    className={styles.fullscreenBtn}
    icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
    title={isFullscreen ? '退出全屏' : '全屏'}
    aria-label={isFullscreen ? '退出全屏' : '全屏'}
    onClick={() => void toggleFullscreen()}
  />
</div>
```

6. 暂先给 `WorkflowCanvas` 增加（Task 3 在 Canvas/Modal 侧消费）：
```tsx
<WorkflowCanvas
  workflowId={draft.id}
  nodes={draft.nodes}
  canvas={draft.canvas}
  onChange={onCanvasChange}
  isFullscreen={isFullscreen}
  fullscreenContainer={isFullscreen ? canvasPanelRef.current : null}
/>
```

注意：此时 `WorkflowCanvas` 类型尚未接受新 props，Task 2 与 Task 3 宜连续完成；若单独提交 Task 2，可先不传 props，Task 3 再传——**本计划要求 Task 2 可先只加 ref/按钮/样式/关闭收尾，Task 3 再接线 props**。

**推荐拆分：** Task 2 仅：hook 调用、ref、按钮、CSS、`handleClose`。不要改 `WorkflowCanvas` 调用签名，避免半成品 typecheck 失败。

- [ ] **Step 3: typecheck**

Run: `pnpm typecheck`  
Expected: PASS

- [ ] **Step 4: 手测（可选但推荐）**

Run: 已有 `pnpm dev` / `npm run dev` 时打开流程画布 → 点全屏 → Esc 退出 → 关抽屉时若全屏应自动退出。

- [ ] **Step 5: Commit**

```bash
git add \
  src/features/workflows/components/WorkflowCanvasDrawer/WorkflowCanvasDrawer.tsx \
  src/features/workflows/components/WorkflowCanvasDrawer/WorkflowCanvasDrawer.module.css
git commit -m "$(cat <<'EOF'
feat: add fullscreen toggle to workflow canvas panel

EOF
)"
```

---

### Task 3: 全屏期间浮层挂载到 panel

**Files:**
- Modify: `src/features/workflows/components/WorkflowCanvas/WorkflowCanvas.tsx`
- Modify: `src/features/workflows/components/WorkflowNodeEditModal/WorkflowNodeEditModal.tsx`
- Modify: `src/features/workflows/components/WorkflowCanvasDrawer/WorkflowCanvasDrawer.tsx`（接线 props）

**Interfaces:**
- Consumes: Drawer 传入的 `isFullscreen: boolean`、`fullscreenContainer: HTMLElement | null`
- Produces: Modal/Dropdown 全屏时挂在 panel 内

- [ ] **Step 1: 扩展 `WorkflowNodeEditModal` props**

在接口中增加：

```ts
  /** 全屏时 Modal 挂载目标，避免落在 Fullscreen 顶层外 */
  getContainer?: HTMLElement | false | (() => HTMLElement) | null
```

或更贴合 spec：

```ts
  isFullscreen?: boolean
  fullscreenContainer?: HTMLElement | null
```

`Modal` 上：

```tsx
getContainer={
  isFullscreen && fullscreenContainer
    ? () => fullscreenContainer
    : undefined
}
```

- [ ] **Step 2: 扩展 `WorkflowCanvas` props**

```ts
interface WorkflowCanvasProps {
  workflowId: string
  nodes: WorkflowNode[]
  canvas?: WorkflowCanvasModel
  onChange: (next: { nodes: WorkflowNode[]; canvas: WorkflowCanvasModel }) => void
  isFullscreen?: boolean
  fullscreenContainer?: HTMLElement | null
}
```

解构默认：`isFullscreen = false`, `fullscreenContainer = null`

`Dropdown`：

```tsx
<Dropdown
  menu={{ items: addMenu }}
  getPopupContainer={
    isFullscreen && fullscreenContainer
      ? () => fullscreenContainer
      : undefined
  }
>
```

`WorkflowNodeEditModal`：

```tsx
<WorkflowNodeEditModal
  open={editOpen}
  node={editingLeaf}
  leafOnly
  isFullscreen={isFullscreen}
  fullscreenContainer={fullscreenContainer}
  onCancel={() => {
    setEditOpen(false)
    setEditingLeaf(null)
  }}
  onOk={handleEditOk}
/>
```

- [ ] **Step 3: Drawer 接线**

```tsx
<WorkflowCanvas
  workflowId={draft.id}
  nodes={draft.nodes}
  canvas={draft.canvas}
  onChange={onCanvasChange}
  isFullscreen={isFullscreen}
  fullscreenContainer={isFullscreen ? canvasPanelRef.current : null}
/>
```

说明：进入全屏后会 re-render（`isFullscreen` 变 true），此时 `canvasPanelRef.current` 已存在，可安全传入。

- [ ] **Step 4: typecheck**

Run: `pnpm typecheck`  
Expected: PASS

- [ ] **Step 5: 手测验收（对照 spec）**

1. 全屏按钮进入 / 再点退出；Esc 退出；图标与 title 同步  
2. 全屏内：拖拽、连线、添加节点菜单可见、双击节点打开编辑 Modal 并可保存关闭  
3. 全屏时关闭 Drawer：全屏退出且抽屉关闭  
4. ReactFlow 区域铺满；若空白，在 Drawer 内于 `isFullscreen` 变 true 后可选加 `fitView`（仅实测失败时补）

- [ ] **Step 6: Commit**

```bash
git add \
  src/features/workflows/components/WorkflowCanvas/WorkflowCanvas.tsx \
  src/features/workflows/components/WorkflowNodeEditModal/WorkflowNodeEditModal.tsx \
  src/features/workflows/components/WorkflowCanvasDrawer/WorkflowCanvasDrawer.tsx
git commit -m "$(cat <<'EOF'
feat: mount canvas overlays inside fullscreen panel

EOF
)"
```

---

## Spec Coverage Checklist

| Spec 要求 | Task |
|-----------|------|
| `useElementFullscreen` hook | Task 1 |
| `.canvasPanel` + 标题栏按钮 + `:fullscreen` CSS | Task 2 |
| 关闭 Drawer 退出全屏 | Task 2 `handleClose` + hook unmount |
| Modal/Dropdown 全屏挂载 | Task 3 |
| 无 IPC / 不暴露保存运行 | 全任务遵守 |
| `pnpm typecheck` + 手测 | Task 2/3 steps |

## Self-Review Notes

- 无 TBD/占位步骤
- Hook 返回名与 Drawer/Canvas 消费名一致：`isFullscreen` / `toggleFullscreen` / `exitFullscreen`
- 仓库无 vitest；不以虚构测试 runner 阻塞；以 typecheck + 手测代替 TDD 红绿循环
