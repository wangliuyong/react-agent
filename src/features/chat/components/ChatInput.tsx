import { useState } from 'react'
import { Button, Dropdown, Progress, Space, Tooltip, Typography } from 'antd'
import {
  PaperClipOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  SendOutlined
} from '@ant-design/icons'
import { useSettingsStore } from '@/features/settings'
import { postSelectImages } from '../api'
import styles from './ChatInput.module.css'

const { Text } = Typography

interface ChatInputProps {
  disabled?: boolean
  running?: boolean
  awaitUserReason?: string | null
  tokenUsed?: number
  onSend: (text: string, paths: string[]) => void
  onAbort: () => void
  onContinue: () => void
}

/** 底部输入条：附件 / 完全访问 / 模型 / 发送 */
export function ChatInput({
  disabled,
  running,
  awaitUserReason,
  tokenUsed = 0,
  onSend,
  onAbort,
  onContinue
}: ChatInputProps): React.ReactElement {
  const [text, setText] = useState('')
  const [paths, setPaths] = useState<string[]>([])
  const settings = useSettingsStore((s) => s.settings)
  const postSettings = useSettingsStore((s) => s.postSettings)

  const tokenMax = 1_000_000
  const percent = Math.min(100, Math.round((tokenUsed / tokenMax) * 100))

  const handleSend = (): void => {
    const value = text.trim()
    if (!value || disabled) return
    onSend(value, paths)
    setText('')
    setPaths([])
  }

  return (
    <div className={styles.wrap}>
      {awaitUserReason ? (
        <div className={styles.awaitBar}>
          <Text type="warning">{awaitUserReason}</Text>
          <Button type="primary" icon={<PlayCircleOutlined />} onClick={onContinue}>
            继续
          </Button>
        </div>
      ) : null}

      {paths.length > 0 ? (
        <div className={styles.attachments}>
          {paths.map((p) => (
            <Text key={p} code className={styles.fileChip}>
              {p.split('/').pop()}
            </Text>
          ))}
          <Button type="link" size="small" onClick={() => setPaths([])}>
            清除
          </Button>
        </div>
      ) : null}

      <div className={styles.box}>
        <textarea
          className={styles.textarea}
          placeholder="随心输入..."
          value={text}
          rows={2}
          disabled={disabled}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
        />
        <div className={styles.toolbar}>
          <Space size={8}>
            <Tooltip title="可选：上传本地配图（优先用来源网页抓图）">
              <Button
                type="text"
                icon={<PaperClipOutlined />}
                onClick={async () => {
                  const selected = await postSelectImages()
                  if (selected.length) setPaths((prev) => [...prev, ...selected])
                }}
              />
            </Tooltip>
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'full',
                    label: settings.fullAccess ? '切换为需确认' : '切换为完全访问',
                    onClick: () => void postSettings({ fullAccess: !settings.fullAccess })
                  }
                ]
              }}
            >
              <Button type="text" size="small">
                <span className={styles.dot} data-on={settings.fullAccess} />
                {settings.fullAccess ? '完全访问' : '需确认'}
              </Button>
            </Dropdown>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {settings.model}
            </Text>
          </Space>
          <Space size={10}>
            <div className={styles.token}>
              <Progress
                type="circle"
                percent={percent}
                size={22}
                strokeWidth={10}
                format={() => ''}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {Math.round(tokenUsed / 1000)}k/1m
              </Text>
            </div>
            {running ? (
              <Button danger shape="circle" icon={<PauseCircleOutlined />} onClick={onAbort} />
            ) : (
              <Button
                type="primary"
                shape="circle"
                icon={<SendOutlined />}
                disabled={!text.trim() || disabled}
                onClick={handleSend}
              />
            )}
          </Space>
        </div>
      </div>
    </div>
  )
}
