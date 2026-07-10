import type { BrowserWindow } from 'electron'

/** 独立模块持有主窗口引用，避免 agent ↔ index 循环依赖 */
let mainWindow: BrowserWindow | null = null

export function setMainWindow(win: BrowserWindow | null): void {
  mainWindow = win
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}
