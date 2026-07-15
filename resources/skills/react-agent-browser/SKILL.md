---
name: react-agent-browser
description: >-
  React Agent 的 Playwright 浏览器服务：国内安装加速、Profile 锁清理、
  拟人鼠标键盘、截帧预览。在 react-agent 中调试 browser has been closed、
  配置 Playwright 加速、修改 human-input 或 BrowserService 时使用。
---

# 浏览器与 Playwright

## 核心文件

| 文件 | 职责 |
|------|------|
| `electron/main/browser/service.ts` | `BrowserService` 单例：启动、导航、截帧 |
| `electron/main/browser/profile-lock.ts` | 清理 SingletonLock / 残留 Chrome for Testing |
| `electron/main/browser/human-input.ts` | 拟人移动/点击/打字/上传 |
| `scripts/install-browser.mjs` | npmmirror 加速安装 Chromium |
| `src/features/browser/` | 渲染进程「智能体浏览器」预览 UI |

## Playwright 安装加速

**不要用** 简单设置 `PLAYWRIGHT_DOWNLOAD_HOST`（CFT 路径会 404）。

```bash
pnpm install:browser          # 国内 npmmirror，推荐
pnpm install:browser:official # 官方源兜底
```

`install-browser.mjs` 要点：
- `playwright install chromium --dry-run` 解析官方 URL
- 改写到 `cdn.npmmirror.com/binaries/chrome-for-testing`
- 解压到用户真实 `~/Library/Caches/ms-playwright`（忽略沙箱临时路径）
- 跳过 headless shell，只装 chromium + ffmpeg

## BrowserService 模式

- `launchPersistentContext(userData/browser-profile/)` 复用 Cookie
- `ensureStarted()` 并发共用 `starting` Promise，防双开抢锁
- 启动前 `releaseBrowserProfileLock()`
- 失败时 `launchWithRetry(maxAttempts=3)` + `isProfileLockError` 判断
- 有头模式：用户直接看 Playwright 窗口；**不要**定时 `page.screenshot`（会导致窗口闪烁）

## Profile 锁问题

**症状**：`browser has been closed`、`正在现有的浏览器会话中打开`

**处理**（已实现，扩展时勿删）：
1. `releaseBrowserProfileLock()` — 删 Singleton* + kill Chrome for Testing
2. 仅杀 `Google Chrome for Testing`，**不杀**用户日常 Chrome
3. 用 profile 路径精确 `pgrep -f`

用户侧：重启 `pnpm dev` 或设置页「清除小红书登录态」。

## 拟人输入（强制）

小红书等场景**禁止** `locator.fill()` / 瞬时 `click()`。

使用 `human-input.ts`：

| 函数 | 用途 |
|------|------|
| `humanClickLocator` | 移动轨迹 + mouse down/up |
| `humanClickText` | 按文案找元素并拟人点击 |
| `humanTypeInto` | 逐字 keydown/keypress |
| `humanUploadFiles` | 拟人触发 file chooser |

新增浏览器交互时复用以上函数，见 `xhs-publish.ts`。

## 修改检查清单

- [ ] 启动前是否调用 `releaseBrowserProfileLock`
- [ ] `ensureStarted` 是否防并发双开
- [ ] 新点击/输入是否走 human-input
- [ ] 错误信息是否可被 `isProfileLockError` 识别并重试

## 验证

```bash
pnpm typecheck
pnpm dev   # 触发 xhs_publish_note 或 browser_navigate，观察右侧预览
```

## 沉淀

Playwright 排障案例写入 [examples.md](examples.md)。
