# Chat Settings and Channel Status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 缺少大模型必要配置时从聊天页跳转设置，并在设置页集中展示发布渠道登录态与通知渠道配置状态。

**Architecture:** 聊天页使用设置 Store 的 `loaded` 与本地配置执行轻量守卫。设置页新增独立 `ChannelStatusPanel` 容器，复用渠道 Store 与现有 IPC API，在挂载时查询发布渠道登录状态，并通过渠道元数据派生通知渠道配置状态。

**Tech Stack:** React 19、TypeScript、Zustand、Ant Design、Electron IPC、CSS Modules

## Global Constraints

- API 查询函数使用 `query` 前缀，修改函数使用 `post` 前缀。
- 优先使用 Ant Design 内置组件。
- UI 视觉对齐技能市场页面。
- 按用户要求不新增自动化测试。
- 不修改主进程登录检测算法及浏览器 Profile 持久化方式。

---

### Task 1: 聊天配置守卫

**Files:**
- Modify: `src/features/chat/components/ChatPage/ChatPage.tsx`

**Interfaces:**
- Consumes: `useSettingsStore(): { settings: AppSettings; loaded: boolean }`
- Consumes: `useAppStore().setView(view: AppView): void`
- Produces: 设置加载完成后对 `apiKey`、`baseUrl` 的进入聊天页校验

- [ ] **Step 1: 增加设置守卫**

在 `ChatPage` 中读取 `settings`、`loaded`、`setView`，并增加副作用：

```tsx
useEffect(() => {
  if (!settingsLoaded) return
  const missingFields = [
    !settings.apiKey.trim() ? 'API Key' : null,
    !settings.baseUrl.trim() ? 'Base URL' : null
  ].filter(Boolean)
  if (missingFields.length === 0) return
  message.warning(`请先在设置中填写 ${missingFields.join('、')}`)
  setView('settings')
}, [settings, settingsLoaded, setView])
```

- [ ] **Step 2: 类型检查**

Run: `pnpm typecheck`
Expected: 两个 TypeScript 项目均以退出码 0 完成。

### Task 2: 设置页渠道状态模块

**Files:**
- Create: `src/features/settings/components/ChannelStatusPanel/ChannelStatusPanel.tsx`
- Create: `src/features/settings/components/ChannelStatusPanel/ChannelStatusPanel.module.css`
- Create: `src/features/settings/components/ChannelStatusPanel/index.ts`
- Modify: `src/features/settings/components/SettingsPage/SettingsPage.tsx`

**Interfaces:**
- Consumes: `useChannelsStore` 的渠道列表与 `hydrate`
- Consumes: `queryChannelLoginStatuses(): Promise<ChannelLoginStatus[]>`
- Consumes: `postChannelOpenLogin(channelId): Promise<BrowserStatus>`
- Consumes: `postBrowserClearProfile(): Promise<void>`
- Produces: `ChannelStatusPanel(): React.ReactElement`

- [ ] **Step 1: 实现状态容器**

组件挂载时先确保渠道数据可用，再调用 `queryChannelLoginStatuses`。发布渠道按 `ChannelLoginState` 展示标签和状态说明，通知渠道用 `isNotifyChannelConfigured` 派生“已配置/未配置/即将上线”。

- [ ] **Step 2: 实现渠道操作**

发布渠道提供“打开登录页”；打开后延迟刷新。面板提供“重新检测”和带 `Popconfirm` 的“清除全部登录态”，清除后立即重新检测。

- [ ] **Step 3: 接入设置页**

删除仅针对小红书的旧 `Alert`，在设置表单下方渲染：

```tsx
<ChannelStatusPanel />
```

- [ ] **Step 4: 样式对齐**

使用技能市场式卡片网格、圆角、轻边框和状态标签；窄窗口降为单列，避免固定宽度。

- [ ] **Step 5: 类型检查与构建**

Run: `pnpm typecheck && pnpm build`
Expected: 类型检查与 Electron Vite 生产构建均以退出码 0 完成。
