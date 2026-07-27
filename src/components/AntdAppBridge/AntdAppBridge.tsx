import { App as AntdApp } from 'antd'
import { postBindAppMessage, postUnbindAppMessage } from '@/lib/app-message'
import { postBindAppNotification, postUnbindAppNotification } from '@/lib/app-notification'

/**
 * 将 App.useApp 的 message / notification 注入全局代理，供 Zustand / IPC 等非组件代码使用。
 */
export function AntdAppBridge(): React.ReactElement | null {
  const { message, notification } = AntdApp.useApp()

  useEffect(() => {
    postBindAppMessage(message)
    postBindAppNotification(notification)
    return () => {
      postUnbindAppMessage()
      postUnbindAppNotification()
    }
  }, [message, notification])

  return null
}
