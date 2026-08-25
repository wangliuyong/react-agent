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
import {
  postEnsureMiniMaxH3SkillsEnabled,
  postEnsureRemotionSkillsEnabled
} from './store/skills'
import { postEnsureRemotionBrowser } from './media/remotion-browser'
import { postStopRemotionStudios } from './media/remotion-service'
import { querySettings } from './store/settings'
import { postLaunchAtLogin } from './store/launch-at-login'
import {
  postCreateTray,
  postDestroyTray,
  postHandleWindowClose,
  postShowMainWindow
} from './tray'
import {
  postRegisterMediaProtocolHandler,
  registerMediaScheme
} from './store/register-media-protocol'

// 必须在 app ready 前注册自定义协议
registerMediaScheme()

let mainWindow: BrowserWindow | null = null
/** 为 true 时允许窗口真正关闭（托盘「退出」或系统退出） */
let isQuitting = false

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

  // 关闭按钮：默认隐藏到托盘，进程继续跑定时任务 / 渠道
  mainWindow.on('close', (event) => {
    if (!mainWindow) return
    postHandleWindowClose(event, mainWindow, () => isQuitting)
  })

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
  // 窗口与 IPC 优先：尽快展示启动屏，减少白屏等待
  getDataRoot()
  postRegisterMediaProtocolHandler()
  registerIpcHandlers()
  createWindow()
  // 状态栏托盘：关闭窗口后仍可通过图标唤起
  postCreateTray(createWindow)

  // 非关键初始化延后到下一事件循环，不阻塞首屏
  void Promise.resolve().then(async () => {
    // Agent 工具全局预热：全量注册进进程缓存，供各角色 / 工作流直接注入
    const { postWarmAgentTools } = await import('./agent/tools')
    postWarmAgentTools()
    initializeResources()
    postEnsureRemotionSkillsEnabled()
    postEnsureMiniMaxH3SkillsEnabled()
    void postEnsureRemotionBrowser().catch(() => {
      /* 首次失败不阻断启动，渲染时会重试 */
    })
    initPublishChannelRegistry()
    initPublishAdapters()
    initMediaProviders()
    startScheduleService()
    postLaunchAtLogin(querySettings().launchAtLogin)
  })

  app.on('activate', () => {
    // Dock / 任务栏点击：显示已有窗口或重建
    postShowMainWindow(createWindow)
  })
})

app.on('window-all-closed', () => {
  // 启用关闭到托盘时进程常驻；否则非 macOS 随最后窗口退出
  if (process.platform === 'darwin') return
  if (querySettings().closeToTray) return
  app.quit()
})

// 退出时关闭 Playwright，避免 SingletonLock 残留导致下次「正在现有的浏览器会话中打开」
app.on('before-quit', () => {
  isQuitting = true
  postDestroyTray()
  postStopRemotionStudios()
  void getBrowserService().close()
  releaseBrowserProfileLock()
})

ipcMain.handle('shell:open-external', async (_e, url: string) => {
  await shell.openExternal(url)
})

ipcMain.handle('post:reveal-path', async (_e, filePath: string) => {
  const { existsSync, statSync } = await import('fs')
  const { normalize, resolve } = await import('path')
  const raw = String(filePath ?? '').trim()
  if (!raw) return { ok: false as const, error: '路径为空' }
  const target = normalize(resolve(raw))
  if (!existsSync(target)) return { ok: false as const, error: '文件不存在' }
  // 目录：直接打开；文件：在资源管理器中定位并选中
  if (statSync(target).isDirectory()) {
    const openError = await shell.openPath(target)
    if (openError) return { ok: false as const, error: openError }
  } else {
    shell.showItemInFolder(target)
  }
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

/** 选择本地媒体：图片 / 视频 / 音频（多选），供聊天输入区附件 */
ipcMain.handle('dialog:select-images', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [
      {
        name: '媒体文件',
        extensions: [
          'png',
          'jpg',
          'jpeg',
          'webp',
          'gif',
          'bmp',
          'mp4',
          'mov',
          'webm',
          'mkv',
          'wav',
          'mp3',
          'm4a',
          'aac',
          'ogg'
        ]
      },
      { name: '图片', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'] },
      { name: '视频', extensions: ['mp4', 'mov', 'webm', 'mkv'] },
      { name: '音频', extensions: ['wav', 'mp3', 'm4a', 'aac', 'ogg'] }
    ]
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
