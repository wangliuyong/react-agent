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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider locale={zhCN} theme={antdThemeConfig}>
      <AntdApp>
        <App />
      </AntdApp>
    </ConfigProvider>
  </StrictMode>
)
