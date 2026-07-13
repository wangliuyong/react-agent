import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import App from './App'
import './styles/global.css'

/** 豆包风格 Ant Design 主题配置 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#0057ff',
          colorSuccess: '#00b578',
          colorWarning: '#ff8800',
          colorError: '#f53f3f',
          colorText: '#1c1f23',
          colorTextSecondary: '#86909c',
          colorBorder: '#e5e6eb',
          colorBgContainer: '#ffffff',
          colorBgLayout: '#f4f5f7',
          borderRadius: 12,
          borderRadiusLG: 16,
          borderRadiusSM: 8,
          fontFamily:
            '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", -apple-system, sans-serif',
          controlHeight: 36,
          boxShadow:
            '0 16px 48px rgba(0, 0, 0, 0.14), 0 6px 16px rgba(0, 0, 0, 0.08)',
          boxShadowSecondary: '0 8px 28px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)'
        },
        components: {
          Button: {
            primaryShadow: 'none',
            defaultBorderColor: '#e5e6eb',
            defaultHoverBorderColor: '#0057ff',
            defaultHoverColor: '#0057ff'
          },
          Card: {
            borderRadiusLG: 16
          },
          Input: {
            activeBorderColor: '#0057ff',
            hoverBorderColor: '#0057ff'
          },
          Segmented: {
            trackBg: '#f2f3f5'
          }
        }
      }}
    >
      <App />
    </ConfigProvider>
  </StrictMode>
)
