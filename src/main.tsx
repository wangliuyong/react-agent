import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import App from './App'
import './styles/global.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 10,
          fontFamily:
            '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", -apple-system, sans-serif'
        }
      }}
    >
      <App />
    </ConfigProvider>
  </StrictMode>
)
