import { message as antdStaticMessage } from 'antd'
import type { MessageInstance } from 'antd/es/message/interface'

/**
 * 全局 message 实例：由 AntdAppBridge 在 React 树内通过 App.useApp 注入。
 * 为什么：Zustand / IPC 回调等非组件代码无法使用 hooks，但仍需消费 ConfigProvider 主题。
 */
let boundMessage: MessageInstance | null = null

/** 在 App 子树挂载后绑定可消费上下文的 message API */
export function postBindAppMessage(api: MessageInstance): void {
  boundMessage = api
}

/** 解绑，避免 HMR 或 StrictMode 重复挂载时持有过期实例 */
export function postUnbindAppMessage(): void {
  boundMessage = null
}

function queryMessageApi(): MessageInstance {
  return boundMessage ?? antdStaticMessage
}

/** 供 auto-import 与业务代码使用的 message 代理（优先走 App.useApp 实例） */
export const appMessage: MessageInstance = new Proxy(antdStaticMessage, {
  get(_target, prop, receiver) {
    const api = queryMessageApi() as MessageInstance
    const value = Reflect.get(api, prop, receiver)
    return typeof value === 'function' ? value.bind(api) : value
  }
}) as MessageInstance
