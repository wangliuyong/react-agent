import { app } from 'electron'
import { resolve } from 'path'

/**
 * 读取操作系统当前登录项状态。
 * 主要用于调试；UI 以 settings.json 中的用户偏好为准。
 */
export function queryLaunchAtLoginEnabled(): boolean {
  return app.getLoginItemSettings().openAtLogin
}

/**
 * 将「开机自启」偏好同步到系统登录项。
 * 开发模式下需显式指定 Electron 可执行路径与入口脚本，否则登录项无法正确拉起应用。
 */
export function postLaunchAtLogin(enabled: boolean): void {
  if (!enabled) {
    app.setLoginItemSettings({ openAtLogin: false })
    return
  }

  if (app.isPackaged) {
    app.setLoginItemSettings({ openAtLogin: true })
    return
  }

  const entry = process.argv[1]
  app.setLoginItemSettings({
    openAtLogin: true,
    path: process.execPath,
    args: entry ? [resolve(entry)] : []
  })
}
