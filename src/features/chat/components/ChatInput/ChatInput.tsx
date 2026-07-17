import {
  queryModelCategory,
  queryModelLabel,
  queryModelOptions,
  type ModelOption
} from '@shared/types'
import { useSettingsStore } from '@/features/settings'
import { queryAgentStatusLabel } from '../../utils/agent-status'
import { TypingIndicator } from '../TypingIndicator'
import { postSelectImages, queryProviderModels } from '../../api'
import styles from './ChatInput.module.css'

const { Text } = Typography

interface ChatInputProps {
  disabled?: boolean
  /** disabled 时输入框占位提示（如任务流程已成功结束） */
  sendDisabledHint?: string
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
  sendDisabledHint,
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
  /** DeepSeek 等平台动态模型；null 表示使用本地静态列表 */
  const [remoteModels, setRemoteModels] = useState<ModelOption[] | null>(null)
  const [modelsLoading, setModelsLoading] = useState(false)
  const settings = useSettingsStore((s) => s.settings)
  const postSettings = useSettingsStore((s) => s.postSettings)

  /**
   * 百炼 / DeepSeek 等模型随平台版本变化，聊天框优先展示平台 /models 实时列表。
   * 拉取失败时回退静态 MODEL_OPTIONS，保证仍可切换。
   */
  useEffect(() => {
    if (!settings.apiKey.trim()) {
      setRemoteModels(null)
      setModelsLoading(false)
      return
    }
    let cancelled = false
    setModelsLoading(true)
    void queryProviderModels()
      .then((models) => {
        if (!cancelled && models.length > 0) setRemoteModels(models)
      })
      .catch(() => {
        if (!cancelled) setRemoteModels(null)
      })
      .finally(() => {
        if (!cancelled) setModelsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [settings.provider, settings.apiKey, settings.baseUrl])

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

  /** 下拉项：优先平台列表；展示名称 + 模型类型；历史自定义模型追加一项 */
  const modelMenuItems = useMemo(() => {
    const providerModels = remoteModels ?? queryModelOptions(settings.provider)
    const items = providerModels.map((m) => ({
      key: m.value,
      label: (
        <div className={styles.modelMenuItem}>
          <div className={styles.modelMenuTitleRow}>
            <Text>{m.label}</Text>
            <Text type="secondary" className={styles.modelMenuCategory}>
              {m.category || queryModelCategory(m.value)}
            </Text>
          </div>
          {m.description ? (
            <Text type="secondary" className={styles.modelMenuDesc}>
              {m.description}
            </Text>
          ) : null}
        </div>
      ),
      onClick: () => void handleModelChange(m.value)
    }))
    if (!providerModels.some((m) => m.value === settings.model)) {
      items.unshift({
        key: settings.model,
        label: (
          <div className={styles.modelMenuItem}>
            <div className={styles.modelMenuTitleRow}>
              <Text>{settings.model}</Text>
              <Text type="secondary" className={styles.modelMenuCategory}>
                {queryModelCategory(settings.model)}
              </Text>
            </div>
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
  }, [settings.model, settings.provider, remoteModels])

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
                : disabled
                  ? (sendDisabledHint ?? '当前不可发送消息')
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
                  <Tooltip
                    title={
                      settings.fullAccess
                        ? '完全访问模式：将跳过部分敏感确认'
                        : '需确认模式：敏感操作前会暂停确认'
                    }
                  >
                    <span className={styles.dot} data-on={settings.fullAccess} />
                  </Tooltip>
                  {settings.fullAccess ? '完全访问' : '需确认'}
                  <DownOutlined className={styles.accessChevron} />
                </Button>
              </Dropdown>
              <Tooltip
                title={
                  running
                    ? '任务运行中，请结束后再切换模型'
                    : settings.provider === 'deepseek'
                      ? '选择 DeepSeek 平台模型'
                      : '选择大模型'
                }
              >
                <Dropdown
                  disabled={inputDisabled || running}
                  menu={{ selectedKeys: [settings.model], items: modelMenuItems }}
                  trigger={['click']}
                >
                  <Button
                    type="text"
                    size="small"
                    className={styles.modelBtn}
                    loading={modelSwitching || modelsLoading}
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
                <Tooltip
                  title={
                    disabled
                      ? (sendDisabledHint ?? '当前不可发送消息')
                      : !text.trim()
                        ? '请输入消息内容'
                        : '发送'
                  }
                >
                  <Button
                    type="primary"
                    shape="circle"
                    className={styles.sendBtn}
                    icon={<SendOutlined />}
                    disabled={!text.trim() || disabled}
                    onClick={handleSend}
                  />
                </Tooltip>
              )}
            </Space>
          </div>
        </div>
      </div>
    </div>
  )
}
