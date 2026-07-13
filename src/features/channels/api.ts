import type { BrowserStatus, ChannelLoginStatus } from '@shared/types'
import type { PublishChannelId } from '@shared/publish-channels'

/** 读：检测全部发布渠道的登录态 */
export async function queryChannelLoginStatuses(): Promise<ChannelLoginStatus[]> {
  return window.api.queryChannelLoginStatuses()
}

/** 写：打开指定渠道创作者中心，便于扫码登录 */
export async function postChannelOpenLogin(
  channelId: PublishChannelId
): Promise<BrowserStatus> {
  return window.api.postChannelOpenLogin(channelId)
}

/** 写：清除共享浏览器 Profile（所有渠道登录态一并清除） */
export async function postBrowserClearProfile(): Promise<void> {
  return window.api.postBrowserClearProfile()
}
