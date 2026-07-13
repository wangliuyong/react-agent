import { MODEL_OPTIONS, queryModelLabel } from '@shared/types'
import { useSettingsStore } from '@/features/settings'
import { queryAgentStatusLabel } from '../../utils/agent-status'
import { TypingIndicator } from '../TypingIndicator'
import { postSelectImages } from '../../api'
import styles from './ChatInput.module.css'

const { Text } = Typography

interface ChatInputProps {
  disabled?: boolean
  running?: boolean
  streamingText?: string
  activeToolName?: string | null
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
  streamingText = '',
  activeToolName = null,
  awaitUserReason,
  tokenUsed = 0,
  onSend,
  onAbort,
  onContinue
}: ChatInputProps): React.ReactElement {
  const [text, setText] = useState('')
  const [paths, setPaths] = useState<string[]>([])
  const [modelSwitching, setModelSwitching] = useState(false)
  const settings = useSettingsStore((s) => s.settings)
  const postSettings = useSettingsStore((s) => s.postSettings)

  /** 参考样式：以 120k 为展示上限 */
  const tokenDisplayMax = 120_000
  const tokenDisplayUsed = Math.round(tokenUsed / 1000)
  const tokenDisplayMaxK = Math.round(tokenDisplayMax / 1000)

  const statusLabel = useMemo(
    () =>
      queryAgentStatusLabel({
        running: Boolean(running),
        streamingText,
        activeToolName,
        awaitUserReason: awaitUserReason ?? null
      }),
    [running, streamingText, activeToolName, awaitUserReason]
  )

  /** 切换模型并给出 Toast 反馈 */
  const handleModelChange = async (model: string): Promise<void> => {
    if (model === settings.model) return
    setModelSwitching(true)
    try {
      await postSettings({ model })
      message.success(`已切换至 ${queryModelLabel(model)}`)
    } finally {
      setModelSwitching(false)
    }
  }

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
      onClick: () => void handleModelChange(m.value)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleModelChange 依赖 settings.model
  }, [settings.model])

  const handleSend = (): void => {
    const value = text.trim()
    if (!value || disabled || running) return
    onSend(value, paths)
    setText('')
    setPaths([])
  }

  const inputDisabled = disabled || running

  return (
    <div className={styles.wrap}>
      <div className={styles.inner}>
        {awaitUserReason ? (
          <div className={styles.awaitBar}>
            <Text className={styles.awaitText}>{awaitUserReason}</Text>
            <Button type="primary" icon={<PlayCircleOutlined />} onClick={onContinue}>
              继续
            </Button>
          </div>
        ) : null}

        {running && statusLabel && !awaitUserReason ? (
          <div className={styles.statusBar}>
            <TypingIndicator label={statusLabel} compact />
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

        <div className={styles.box} data-running={running}>
          <textarea
            className={styles.textarea}
            placeholder={
              running
                ? 'Agent 正在处理，请稍候…'
                : '描述你的任务，Enter 发送，Shift+Enter 换行…'
            }
            value={text}
            rows={2}
            disabled={inputDisabled}
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
                  disabled={running}
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
                <Button type="text" size="small" className={styles.accessBtn} disabled={running}>
                  <span className={styles.dot} data-on={settings.fullAccess} />
                  {settings.fullAccess ? '完全访问' : '需确认'}
                  <DownOutlined className={styles.accessChevron} />
                </Button>
              </Dropdown>
              <Tooltip title={running ? '任务运行中，请结束后再切换模型' : '选择大模型'}>
                <Dropdown
                  disabled={inputDisabled || running}
                  menu={{ selectedKeys: [settings.model], items: modelMenuItems }}
                  trigger={['click']}
                >
                  <Button
                    type="text"
                    size="small"
                    className={styles.modelBtn}
                    loading={modelSwitching}
                  >
                    {queryModelLabel(settings.model)}
                    <DownOutlined className={styles.modelChevron} />
                  </Button>
                </Dropdown>
              </Tooltip>
            </Space>
            <Space size={10}>
              <div className={styles.token} data-running={running}>
                {running ? <LoadingOutlined className={styles.tokenSpin} spin /> : null}
                <Text type="secondary" className={styles.tokenText}>
                  {running ? '处理中' : `${tokenDisplayUsed}/${tokenDisplayMaxK}k`}
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
