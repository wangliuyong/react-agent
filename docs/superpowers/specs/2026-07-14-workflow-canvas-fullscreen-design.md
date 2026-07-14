# 流程画布编辑区全屏设计

日期：2026-07-14  
状态：已确认，待实现计划

## 背景

流程画布在右侧 Drawer（约 80vw）的「画布编辑区」面板内编辑。面板上方还有流程 meta、说明文案，画布可视区域偏小。需要支持浏览器 Fullscreen API，让「画布编辑区」整块进入 OS 级全屏，便于编排节点与连线。

## 目标

- 对「画布编辑区」（`.canvasPanel`）使用 `Element.requestFullscreen()`
- 入口在面板标题栏，样式对齐技能市场页操作按钮
- 全屏内可完整编辑（拖拽、连线、添加节点、打开节点编辑 Modal）
- 可复用：封装 `useElementFullscreen` hook

## 非目标

- Electron `BrowserWindow.setFullScreen` / 新增 IPC
- 全屏时暴露抽屉内「保存 / 立即运行」（仍留在 Drawer 上层）
- 自定义快捷键（Esc 使用浏览器默认退出全屏）
- 多显示器特殊策略

## 交互

| 操作 | 行为 |
|------|------|
| 点击「全屏」 | 对 `.canvasPanel` 调用 `requestFullscreen()` |
| 点击「退出全屏」或 Esc | `exitFullscreen()` / 系统手势；状态经 `fullscreenchange` 同步 |
| API 不可用或拒绝 | `message.warning` 提示，不抛错到未捕获边界 |

**全屏内可见**：面板标题区 + `WorkflowCanvas`（工具栏含「添加节点」+ ReactFlow）。  
**全屏内不可见**：Drawer 顶栏、流程 meta、保存/立即运行、说明文案。

按钮：Ant Design `Button type="text"`，图标 `FullscreenOutlined` / `FullscreenExitOutlined`，约 32×32，hover 使用 `--db-hover`。

## 架构

### Hook：`src/hooks/useElementFullscreen.ts`

```ts
function useElementFullscreen(targetRef: RefObject<HTMLElement | null>): {
  isFullscreen: boolean
  toggleFullscreen: () => Promise<void>
  exitFullscreen: () => Promise<void>
}
```

职责：

1. 监听 `document.fullscreenchange`，以 `document.fullscreenElement === targetRef.current` 同步 `isFullscreen`
2. `toggleFullscreen`：未全屏则 `targetRef.current?.requestFullscreen()`，已全屏则 `document.exitFullscreen()`
3. 卸载时移除 listener；若本元素仍是 `fullscreenElement` 则 `exitFullscreen()`
4. `requestFullscreen` / `exitFullscreen` reject 或 API 缺失时 `message.warning`

### 组件改动

| 文件 | 改动 |
|------|------|
| `WorkflowCanvasDrawer.tsx` | `ref` 挂 `.canvasPanel`；head 右侧全屏按钮；向下传递全屏容器 |
| `WorkflowCanvasDrawer.module.css` | 按钮样式；`.canvasPanel:fullscreen` 宽高 100%、flex 列铺满 |
| `WorkflowCanvas.tsx` | 可选 props：`fullscreenContainer: HTMLElement \| null` 与 `isFullscreen`；仅在全屏时传给 Modal / Dropdown |
| `WorkflowNodeEditModal.tsx` | `isFullscreen && fullscreenContainer` 时设置 `getContainer={() => fullscreenContainer}` |

### 浮层挂载

Fullscreen 创建浏览器顶层；Ant Design `Modal` / `Dropdown` 默认挂 `document.body` 时在全屏内不可见。约定：

- **仅全屏期间**：`getContainer` / `getPopupContainer` → `.canvasPanel`
- **非全屏**：保持现有默认（挂 `document.body`），减小对抽屉内层级的副作用

### ReactFlow 尺寸

进入全屏后容器变大。优先依赖 ReactFlow 对父容器 resize 的处理；若实测空白或尺寸不对，在 `fullscreenchange` 进入后 `requestAnimationFrame` 触发一次 `fitView`。

## 数据流

无新 IPC、无 store 字段。全屏为纯 UI 瞬时状态，不写入 `WorkflowDefinition`。

## 验收

1. 进入 / 退出全屏（按钮与 Esc）正常，图标与 title 同步
2. 全屏内拖拽、连线、添加节点、双击编辑 Modal 可用
3. 关闭 Drawer 时若仍全屏，自动退出全屏
4. `pnpm typecheck` 通过

## 风险与缓解

| 风险 | 缓解 |
|------|------|
| Modal/Dropdown 在全屏外不可见 | 全屏时改 `getContainer` / `getPopupContainer` |
| Electron 环境 Fullscreen API 行为差异 | hook 内统一 catch + warning；验收时在应用内手测 |
| Drawer 关闭后残留全屏 | unmount / Drawer `onClose` 时 `exitFullscreen` |
