/**
 * 渲染进程入口。
 * 为什么：React 19 下 Ant Design Form 需先打补丁，否则 Input 输入无法写入 Form store，
 * 会导致飞书 Webhook 等敏感字段保存为空。
 */
import '@ant-design/v5-patch-for-react-19'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App as AntdApp, ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import App from './App'
import './styles/global.css'
import { antdThemeConfig } from './styles/theme-tokens'

/** 淡出并移除 HTML 内联启动屏（在 React 首帧渲染后执行） */
function dismissAppSplash(): void {
  const splash = document.getElementById('app-splash')
  if (!splash) return
  splash.classList.add('is-hidden')
  window.setTimeout(() => splash.remove(), 280)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider locale={zhCN} theme={antdThemeConfig}>
      <AntdApp>
        <App />
      </AntdApp>
    </ConfigProvider>
  </StrictMode>
)

// 下一帧再隐藏启动屏，确保根布局已绘制
requestAnimationFrame(() => {
  requestAnimationFrame(dismissAppSplash)
})
