import { App as AntdApp } from 'antd'
import { postBindAppMessage, postUnbindAppMessage } from '@/lib/app-message'

/**
 * 将 App.useApp 的 message 注入全局代理，供 Zustand / IPC 等非组件代码使用。
 */
export function AntdAppBridge(): React.ReactElement | null {
  const { message } = AntdApp.useApp()

  useEffect(() => {
    postBindAppMessage(message)
    return () => postUnbindAppMessage()
  }, [message])

  return null
}
