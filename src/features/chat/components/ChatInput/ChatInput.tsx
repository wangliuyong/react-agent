import { useMemo, useState } from 'react'
import { Button, Dropdown, Progress, Space, Tooltip, Typography } from 'antd'
import {
  DownOutlined,
  PaperClipOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  SendOutlined
} from '@ant-design/icons'
import { MODEL_OPTIONS, queryModelLabel } from '@shared/types'
import { useSettingsStore } from '@/features/settings'
import { postSelectImages } from '../../api'
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

  /** 下拉项：若当前模型不在预设列表（历史自定义），追加一项以便展示 */
  const modelMenuItems = useMemo(() => {
    const items = MODEL_OPTIONS.map((m) => ({
      key: m.value,
      label: (
        <div className={styles.modelMenuItem}>
          <Text>{m.label}</Text>
          {m.description ? (
            <Text type="secondary" className={styles.modelMenuDesc}>
              {m.description}
            </Text>
          ) : null}
        </div>
      ),
      onClick: () => void postSettings({ model: m.value })
    }))
    if (!MODEL_OPTIONS.some((m) => m.value === settings.model)) {
      items.unshift({
        key: settings.model,
        label: (
          <div className={styles.modelMenuItem}>
            <Text>{settings.model}</Text>
            <Text type="secondary" className={styles.modelMenuDesc}>
              当前自定义模型
            </Text>
          </div>
        ),
        onClick: () => {}
      })
    }
    return items
  }, [postSettings, settings.model])

  const handleSend = (): void => {
    const value = text.trim()
    if (!value || disabled) return
    onSend(value, paths)
    setText('')
    setPaths([])
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.inner}>
        {awaitUserReason ? (
          <div className={styles.awaitBar}>
            <Text style={{ color: '#92400e', fontSize: 13 }}>{awaitUserReason}</Text>
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
            placeholder="描述你的任务，Enter 发送，Shift+Enter 换行…"
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
            <Space size={4}>
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
              <Tooltip title={running ? '任务运行中，请结束后再切换模型' : '选择大模型'}>
                <Dropdown
                  disabled={disabled || running}
                  menu={{ selectedKeys: [settings.model], items: modelMenuItems }}
                  trigger={['click']}
                >
                  <Button type="text" size="small" className={styles.modelBtn}>
                    {queryModelLabel(settings.model)}
                    <DownOutlined className={styles.modelChevron} />
                  </Button>
                </Dropdown>
              </Tooltip>
            </Space>
            <Space size={10}>
              <div className={styles.token}>
                <Progress
                  type="circle"
                  percent={percent}
                  size={22}
                  strokeWidth={10}
                  strokeColor="#2563eb"
                  format={() => ''}
                />
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {Math.round(tokenUsed / 1000)}k
                </Text>
              </div>
              {running ? (
                <Button
                  danger
                  shape="circle"
                  className={styles.stopBtn}
                  icon={<PauseCircleOutlined />}
                  onClick={onAbort}
                />
              ) : (
                <Button
                  type="primary"
                  shape="circle"
                  className={styles.sendBtn}
                  icon={<SendOutlined />}
                  disabled={!text.trim() || disabled}
                  onClick={handleSend}
                />
              )}
            </Space>
          </div>
        </div>
      </div>
    </div>
  )
}
