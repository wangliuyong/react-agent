import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { join } from 'path'
import { registerIpcHandlers } from './ipc'
import { getDataRoot } from './store/paths'
import { setMainWindow } from './window'
import { getBrowserService } from './browser/service'
import { releaseBrowserProfileLock } from './browser/profile-lock'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: 'React Agent',
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
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
    setMainWindow(null)
  })
}

app.whenReady().then(() => {
  getDataRoot()
  registerIpcHandlers()
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
  void getBrowserService().close()
  releaseBrowserProfileLock()
})

ipcMain.handle('shell:open-external', async (_e, url: string) => {
  await shell.openExternal(url)
})

ipcMain.handle('dialog:select-images', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] }]
  })
  return result.canceled ? [] : result.filePaths
})
