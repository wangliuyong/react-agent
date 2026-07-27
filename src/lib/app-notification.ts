import { createElement } from 'react'
import { notification as antdStaticNotification } from 'antd'
import type { NotificationInstance } from 'antd/es/notification/interface'
import { AppErrorNotice } from '@/components/AppErrorNotice/AppErrorNotice'
import noticeStyles from '@/components/AppErrorNotice/AppErrorNotice.module.css'

/**
 * 全局 notification 实例：由 AntdAppBridge 经 App.useApp 注入。
 * 用于需手动关闭的长错误（Agent 报错等）；普通短提示仍用 appMessage。
 */
let boundNotification: NotificationInstance | null = null

/** 在 App 子树挂载后绑定可消费上下文的 notification API */
export function postBindAppNotification(api: NotificationInstance): void {
  boundNotification = api
}

/** 解绑，避免 HMR / StrictMode 持有过期实例 */
export function postUnbindAppNotification(): void {
  boundNotification = null
}

function queryNotificationApi(): NotificationInstance {
  return boundNotification ?? antdStaticNotification
}

/** 供 Zustand / IPC 等非组件代码使用的 notification 代理 */
export const appNotification: NotificationInstance = new Proxy(antdStaticNotification, {
  get(_target, prop, receiver) {
    const api = queryNotificationApi() as NotificationInstance
    const value = Reflect.get(api, prop, receiver)
    return typeof value === 'function' ? value.bind(api) : value
  }
}) as NotificationInstance

/**
 * 展示可手动关闭的错误通知（不自动消失，自定义故障卡片样式）。
 * 为什么：antd message 即使 duration=0 也无关闭按钮；默认 notification 样式偏朴素。
 */
export function postAppErrorNotification(content: string, title = '执行失败'): void {
  const text = content.trim() || title
  const key = `app-error-${Date.now()}`
  const api = queryNotificationApi()

  api.open({
    key,
    message: '',
    description: createElement(AppErrorNotice, {
      title,
      content: text,
      onClose: () => api.destroy(key)
    }),
    duration: 0,
    placement: 'topRight',
    closable: false,
    className: noticeStyles.noticeShell,
    style: {
      padding: 0,
      background: 'transparent',
      boxShadow: 'none',
      width: 'auto',
      maxWidth: 'min(440px, calc(100vw - 32px))'
    }
  })
}
