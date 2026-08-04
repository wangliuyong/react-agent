import { Tray, Menu, nativeImage, app, type NativeImage, type BrowserWindow } from 'electron'
import { existsSync } from 'fs'
import { join } from 'path'
import { getMainWindow } from './window'
import { querySettings } from './store/settings'

/** 托盘单例；应用生命周期内只创建一次 */
let tray: Tray | null = null

/**
 * 解析托盘图标路径：开发期读仓库 resources，安装版读 extraResources。
 * 与主窗口图标共用 lingxi-avatar，保证品牌一致。
 */
function resolveTrayIconPath(): string {
  const candidates = [
    join(__dirname, '../../resources/lingxi-avatar.png'),
    join(process.resourcesPath, 'resources/lingxi-avatar.png')
  ]
  return candidates.find((p) => existsSync(p)) ?? candidates[0]
}

/**
 * 生成适合菜单栏 / 系统托盘的小图标。
 * macOS 菜单栏建议约 16–22pt；Windows 托盘常用 16/32。
 */
function queryTrayIcon(): NativeImage {
  const iconPath = resolveTrayIconPath()
  if (!existsSync(iconPath)) {
    return nativeImage.createEmpty()
  }
  const source = nativeImage.createFromPath(iconPath)
  if (source.isEmpty()) return source

  // Retina：按 32px 源图缩放，系统再按 DPR 显示
  const size = process.platform === 'darwin' ? 22 : 16
  return source.resize({ width: size, height: size, quality: 'best' })
}

/** 显示并聚焦主窗口；无窗口时由调用方负责 createWindow */
export function postShowMainWindow(createWindow?: () => void): void {
  let win = getMainWindow()
  if (!win || win.isDestroyed()) {
    createWindow?.()
    win = getMainWindow()
  }
  if (!win || win.isDestroyed()) return

  if (win.isMinimized()) win.restore()
  win.show()
  win.focus()
  if (process.platform === 'darwin') {
    app.dock?.show()
  }
}

/**
 * 隐藏主窗口到托盘（不退出进程）。
 * 定时任务、渠道会话等后台能力依赖进程继续存活。
 */
export function postHideMainWindowToTray(): void {
  const win = getMainWindow()
  if (!win || win.isDestroyed()) return
  win.hide()
}

/** 是否启用「关闭窗口时最小化到托盘」 */
export function queryCloseToTrayEnabled(): boolean {
  return querySettings().closeToTray
}

/**
 * 创建或刷新状态栏托盘图标与右键菜单。
 * @param createWindow 窗口已销毁时用于重建主窗口
 */
export function postCreateTray(createWindow: () => void): void {
  if (tray && !tray.isDestroyed()) {
    postRefreshTrayMenu(createWindow)
    return
  }

  const icon = queryTrayIcon()
  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon)
  tray.setToolTip('灵犀 · AI助手')
  postRefreshTrayMenu(createWindow)

  // 左键单击：显示主窗口（macOS / Windows 一致）
  tray.on('click', () => {
    postShowMainWindow(createWindow)
  })

  // Windows / Linux 双击也打开主窗口
  tray.on('double-click', () => {
    postShowMainWindow(createWindow)
  })
}

/** 刷新托盘右键菜单（设置变更或窗口生命周期变化后调用） */
export function postRefreshTrayMenu(createWindow: () => void): void {
  if (!tray || tray.isDestroyed()) return

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '打开灵犀',
      click: () => postShowMainWindow(createWindow)
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        // 真正退出：跳过「关闭到托盘」拦截
        app.quit()
      }
    }
  ])
  tray.setContextMenu(contextMenu)
}

/** 销毁托盘（退出前清理） */
export function postDestroyTray(): void {
  if (tray && !tray.isDestroyed()) {
    tray.destroy()
  }
  tray = null
}

/**
 * 拦截主窗口关闭：启用 closeToTray 时改为隐藏到托盘。
 * 返回 true 表示已改为隐藏，调用方勿再走默认关闭。
 */
export function postHandleWindowClose(
  event: { preventDefault: () => void },
  win: BrowserWindow,
  isQuitting: () => boolean
): boolean {
  if (isQuitting()) return false
  if (!queryCloseToTrayEnabled()) return false
  if (!tray || tray.isDestroyed()) return false

  event.preventDefault()
  win.hide()
  return true
}
