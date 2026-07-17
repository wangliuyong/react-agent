/**
 * 启动时注册各渠道拟人浏览器发布适配器。
 * SDK 适配器留空：queryPublishAdapter 会返回占位提示。
 */
import { publishXhsNote } from '../browser/xhs-publish'
import { publishDouyinNote } from '../browser/douyin-publish'
import { postRegisterBrowserPublishAdapter } from './adapter'

let registered = false

export function initPublishAdapters(): void {
  if (registered) return
  registered = true

  postRegisterBrowserPublishAdapter('xhs', () => ({
    id: 'browser-humanized',
    async publish(params) {
      return publishXhsNote({
        title: params.title,
        content: params.content,
        imagePaths: params.imagePaths ?? [],
        autoPublish: true,
        fullAccess: true,
        emitAwaitUser: async (reason) => {
          params.emitAwaitUser?.(reason)
        },
        updateTasks: () => undefined,
        signal: params.signal
      })
    }
  }))

  postRegisterBrowserPublishAdapter('douyin', () => ({
    id: 'browser-humanized',
    async publish(params) {
      return publishDouyinNote({
        title: params.title,
        content: params.content,
        imagePaths: params.imagePaths ?? [],
        autoPublish: true,
        fullAccess: true,
        emitAwaitUser: async (reason) => {
          params.emitAwaitUser?.(reason)
        },
        updateTasks: () => undefined,
        signal: params.signal
      })
    }
  }))
}
