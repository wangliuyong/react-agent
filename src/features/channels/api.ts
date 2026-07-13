import type { PublishChannelMeta, PublishChannelUpsertInput } from '@shared/publish-channels'
import { setPublishChannelRegistry } from '@shared/publish-channels'

/** 读：全部发布渠道 */
export async function queryPublishChannels(): Promise<PublishChannelMeta[]> {
  return window.api.queryPublishChannels()
}

/** 写：新增或更新渠道 */
export async function postPublishChannel(
  input: PublishChannelUpsertInput
): Promise<PublishChannelMeta> {
  return window.api.postPublishChannel(input)
}

/** 写：删除自定义渠道 */
export async function postDeletePublishChannel(id: string): Promise<void> {
  return window.api.postDeletePublishChannel(id)
}

/** 写：初始化/恢复内置渠道（小红书、抖音、视频号） */
export async function postInitPublishChannels(): Promise<PublishChannelMeta[]> {
  return window.api.postInitPublishChannels()
}

/** 读：检测全部发布渠道的登录态 */
export async function queryChannelLoginStatuses() {
  return window.api.queryChannelLoginStatuses()
}

/** 写：打开指定渠道创作者中心，便于扫码登录 */
export async function postChannelOpenLogin(channelId: string) {
  return window.api.postChannelOpenLogin(channelId)
}

/** 写：清除共享浏览器 Profile（所有渠道登录态一并清除） */
export async function postBrowserClearProfile(): Promise<void> {
  return window.api.postBrowserClearProfile()
}

/** 同步渲染进程渠道注册表（供 publish-prompt 等 shared 模块使用） */
export function syncPublishChannelRegistry(channels: PublishChannelMeta[]): void {
  setPublishChannelRegistry(channels)
}
