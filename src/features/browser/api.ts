import type { BrowserStatus } from '@shared/types'

/** 读：Playwright 浏览器运行状态 */
export async function queryBrowserStatus(): Promise<BrowserStatus> {
  return window.api.queryBrowserStatus()
}

/** 写：启动 Playwright 有头浏览器窗口 */
export async function postBrowserStart(): Promise<BrowserStatus> {
  return window.api.postBrowserStart()
}

/** 写：关闭 Playwright 浏览器窗口 */
export async function postBrowserClose(): Promise<BrowserStatus> {
  return window.api.postBrowserClose()
}
