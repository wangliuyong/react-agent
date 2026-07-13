import { createRoot } from 'react-dom/client'
import zhCN from 'antd/locale/zh_CN'
import App from './App'
import './styles/global.css'
import { antdThemeConfig } from './styles/theme-tokens'

/** 豆包风格 Ant Design 主题配置（令牌见 theme-tokens.ts） */
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN} theme={antdThemeConfig}>
      <App />
    </ConfigProvider>
  </React.StrictMode>
)
