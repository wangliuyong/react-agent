import { app, BrowserWindow, ipcMain, dialog, shell, nativeImage } from 'electron'
import { existsSync } from 'fs'
import { join } from 'path'
import { registerIpcHandlers } from './ipc'
import { getDataRoot } from './store/paths'
import { initPublishChannelRegistry } from './store/channels'
import { initPublishAdapters } from './publish/register'
import { initMediaProviders } from './media/provider'
import { setMainWindow } from './window'
import { getBrowserService } from './browser/service'
import { releaseBrowserProfileLock } from './browser/profile-lock'
import { startScheduleService } from './schedule/scheduler'
import { initializeResources } from './store/resources'
import { postEnsureRemotionSkillsEnabled } from './store/skills'
import { postEnsureRemotionBrowser } from './media/remotion-browser'
import { postStopRemotionStudios } from './media/remotion-service'
import { querySettings } from './store/settings'
import { postLaunchAtLogin } from './store/launch-at-login'
import {
  postRegisterMediaProtocolHandler,
  registerMediaScheme
} from './store/register-media-protocol'

// 必须在 app ready 前注册自定义协议
registerMediaScheme()

let mainWindow: BrowserWindow | null = null

/** 解析应用图标：开发期读仓库 resources，安装版读 extraResources */
function resolveAppIconPath(): string {
  const candidates = [
    join(__dirname, '../../resources/lingxi-avatar.png'),
    join(process.resourcesPath, 'resources/lingxi-avatar.png')
  ]
  return candidates.find((p) => existsSync(p)) ?? candidates[0]
}

/** 开发模式下同步 Dock / 窗口图标，避免显示 Electron 默认图标 */
function applyAppIcon(): void {
  const iconPath = resolveAppIconPath()
  if (!existsSync(iconPath)) return

  const icon = nativeImage.createFromPath(iconPath)
  if (icon.isEmpty()) return

  if (process.platform === 'darwin') {
    app.dock?.setIcon(icon)
  }
}

function createWindow(): void {
  const iconPath = resolveAppIconPath()
  const icon = existsSync(iconPath) ? nativeImage.createFromPath(iconPath) : undefined
  const windowIcon = icon && !icon.isEmpty() ? icon : undefined

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: '灵犀 · AI助手',
    ...(windowIcon ? { icon: windowIcon } : {}),
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: { x: 16, y: 16 },
    backgroundColor: '#f5f5f7',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  setMainWindow(mainWindow)

  if (process.env.ELECTRON_RENDERER_URL) {
    // 本地开发：加载 Vite 开发服务器
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
    // 仅在 OPEN_DEVTOOLS=1 时自动打开调试面板（见 package.json 的 dev:devtools）
    if (process.env.OPEN_DEVTOOLS === '1') {
      mainWindow.webContents.once('did-finish-load', () => {
        mainWindow?.webContents.openDevTools({ mode: 'detach' })
      })
    }
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
    setMainWindow(null)
  })
}

app.whenReady().then(() => {
  applyAppIcon()
  getDataRoot()
  initializeResources()
  postEnsureRemotionSkillsEnabled()
  void postEnsureRemotionBrowser().catch(() => {
    /* 首次失败不阻断启动，渲染时会重试 */
  })
  initPublishChannelRegistry()
  initPublishAdapters()
  initMediaProviders()
  postRegisterMediaProtocolHandler()
  registerIpcHandlers()
  startScheduleService()
  // 启动时按本机配置同步系统登录项
  postLaunchAtLogin(querySettings().launchAtLogin)
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 退出时关闭 Playwright，避免 SingletonLock 残留导致下次「正在现有的浏览器会话中打开」
app.on('before-quit', () => {
  postStopRemotionStudios()
  void getBrowserService().close()
  releaseBrowserProfileLock()
})

ipcMain.handle('shell:open-external', async (_e, url: string) => {
  await shell.openExternal(url)
})

ipcMain.handle('post:reveal-path', async (_e, filePath: string) => {
  const { existsSync } = await import('fs')
  const { normalize, resolve } = await import('path')
  const raw = String(filePath ?? '').trim()
  if (!raw) return { ok: false as const, error: '路径为空' }
  const target = normalize(resolve(raw))
  if (!existsSync(target)) return { ok: false as const, error: '文件不存在' }
  shell.showItemInFolder(target)
  return { ok: true as const }
})

/** 在系统默认浏览器中打开本地 HTML 等文件 */
ipcMain.handle('post:open-local-file', async (_e, filePath: string) => {
  const { existsSync } = await import('fs')
  const { normalize, resolve } = await import('path')
  const { pathToFileURL } = await import('url')
  const raw = String(filePath ?? '').trim()
  if (!raw) return { ok: false as const, error: '路径为空' }
  const target = normalize(resolve(raw))
  if (!existsSync(target)) return { ok: false as const, error: '文件不存在' }
  await shell.openExternal(pathToFileURL(target).href)
  return { ok: true as const }
})

ipcMain.handle('dialog:select-images', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] }]
  })
  return result.canceled ? [] : result.filePaths
})

/** 选择本地文件夹（流程输出节点等） */
ipcMain.handle('dialog:select-directory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory']
  })
  if (result.canceled || !result.filePaths.length) return null
  return result.filePaths[0]
})
