import { useEffect, useState } from 'react'
import { Badge, Button, Space, Typography } from 'antd'
import { CloseOutlined, ReloadOutlined } from '@ant-design/icons'
import type { BrowserFramePayload } from '@shared/types'
import { useAppStore } from '@/stores/app-store'
import styles from './AgentBrowser.module.css'

const { Text, Title } = Typography

/** 右侧智能体浏览器：展示 Playwright 截帧 */
export function AgentBrowser(): React.ReactElement | null {
  const open = useAppStore((s) => s.browserOpen)
  const setBrowserOpen = useAppStore((s) => s.setBrowserOpen)
  const [frame, setFrame] = useState<BrowserFramePayload | null>(null)

  useEffect(() => {
    return window.api.onBrowserFrame((payload) => {
      setFrame(payload)
    })
  }, [])

  if (!open) return null

  return (
    <aside className={styles.panel}>
      <header className={styles.header}>
        <Space>
          <Title level={5} style={{ margin: 0 }}>
            智能体浏览器
          </Title>
          <Badge status="processing" text="实时" />
        </Space>
        <Button
          type="text"
          size="small"
          icon={<CloseOutlined />}
          onClick={() => setBrowserOpen(false)}
        />
      </header>
      <div className={styles.toolbar}>
        <Button type="text" size="small" icon={<ReloadOutlined />} disabled />
        <div className={styles.url}>{frame?.url || 'about:blank'}</div>
      </div>
      <div className={styles.viewport}>
        {frame?.data ? (
          <img
            className={styles.frame}
            src={`data:image/jpeg;base64,${frame.data}`}
            alt={frame.title || 'browser'}
          />
        ) : (
          <div className={styles.empty}>
            <Text type="secondary">等待 Agent 打开页面…</Text>
          </div>
        )}
      </div>
    </aside>
  )
}
