import {
  MODEL_OPTIONS,
  queryModelCategory,
  queryModelLabel,
  queryModelOptionDisplayLabel,
  type ModelOption,
  type UserChoiceOption
} from '@shared/types'
import { useSettingsStore } from '@/features/settings'
import { useProviderModels } from '@/features/settings/hooks/useProviderModels'
import { queryAgentStatusLabel } from '../../utils/agent-status'
import { TypingIndicator } from '../TypingIndicator'
import { postSelectImages } from '../../api'
import styles from './ChatInput.module.css'

const { Text } = Typography

/** 下拉可视区高度，避免模型过多撑满屏幕 */
const MODEL_SELECT_LIST_HEIGHT = 280

interface ChatInputProps {
  disabled?: boolean
  /** disabled 时输入框占位提示（如任务流程已成功结束） */
  sendDisabledHint?: string
  running?: boolean
  streamingText?: string
  activeToolName?: string | null
  /** 当前任务选用的模型连接名 */
  activeModelLabel?: string | null
  awaitUserReason?: string | null
  /** 挂起确认时的可选方案 */
  awaitUserChoices?: UserChoiceOption[] | null
  tokenUsed?: number
  onSend: (text: string, paths: string[]) => void
  onAbort: () => void
  onContinue: (userInput?: string, choiceId?: string) => void
}

/**
 * 合并平台列表与内置全量模型，按 value 去重。
 * 为什么：聊天切换模型不应被当前供应商静态列表卡住，平台返回优先展示。
 */
function queryMergedModelOptions(
  remoteModels: ModelOption[] | null,
  currentModel: string
): ModelOption[] {
  const seen = new Set<string>()
  const merged: ModelOption[] = []
  for (const m of [...(remoteModels ?? []), ...MODEL_OPTIONS]) {
    const id = m.value.trim()
    if (!id || seen.has(id)) continue
    seen.add(id)
    merged.push(m)
  }
  if (currentModel.trim() && !seen.has(currentModel.trim())) {
    merged.unshift({
      provider: 'openai_compatible',
      value: currentModel,
      label: currentModel,
      category: queryModelCategory(currentModel)
    })
  }
  return merged
}

/** 底部输入条：附件 / 完全访问 / 模型 / 发送 */
export function ChatInput({
  disabled,
  sendDisabledHint,
  running,
  streamingText = '',
  activeToolName = null,
  activeModelLabel = null,
  awaitUserReason,
  awaitUserChoices = null,
  tokenUsed = 0,
  onSend,
  onAbort,
  onContinue
}: ChatInputProps): React.ReactElement {
  const [text, setText] = useState('')
  const [paths, setPaths] = useState<string[]>([])
  const [modelSwitching, setModelSwitching] = useState(false)
  /** 搜索关键字：用于把未在列表中的模型 id 临时加入可选项 */
  const [modelSearch, setModelSearch] = useState('')
  const settings = useSettingsStore((s) => s.settings)
  const postSettings = useSettingsStore((s) => s.postSettings)

  /**
   * 与设置页共用拉取逻辑；凭证不变只拉一次。
   * 为什么：流式输出会频繁重渲染，不能把 /models 绑在渲染周期上。
   */
  const { remoteModels, loading: modelsLoading } = useProviderModels({
    enabled: true,
    provider: settings.provider,
    apiKey: settings.apiKey,
    baseUrl: settings.baseUrl,
    customProviders: settings.customProviders
  })

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
        awaitUserReason: awaitUserReason ?? null,
        activeModelLabel
      }),
    [running, streamingText, activeToolName, awaitUserReason, activeModelLabel]
  )

  /** 切换模型并给出 Toast 反馈 */
  const handleModelChange = async (model: string): Promise<void> => {
    const next = model.trim()
    if (!next || next === settings.model) return
    setModelSwitching(true)
    try {
      await postSettings({ model: next })
      message.success(`已切换至 ${queryModelLabel(next)}`)
      setModelSearch('')
    } finally {
      setModelSwitching(false)
    }
  }

  /**
   * 可搜索选项：平台列表 ∪ 内置全量模型 ∪ 当前搜索关键字（自定义 id）。
   * 不受当前供应商过滤限制，便于网关挂载任意模型。
   */
  const modelSelectOptions = useMemo(() => {
    const merged = queryMergedModelOptions(remoteModels, settings.model)
    const options = merged.map((m) => ({
      value: m.value,
      label: queryModelOptionDisplayLabel(m),
      // 供 filterOption 检索：名称 / id / 类型 / 说明
      searchText: [m.label, m.value, m.category || queryModelCategory(m.value), m.description]
        .filter(Boolean)
        .join(' ')
    }))
    const q = modelSearch.trim()
    if (q && !options.some((o) => o.value === q)) {
      options.unshift({
        value: q,
        label: `${q}（自定义）`,
        searchText: q
      })
    }
    return options
  }, [remoteModels, settings.model, modelSearch])

  const awaitingUser = Boolean(awaitUserReason)

  /** 确认挂起：带上输入框内容继续（空则仅继续） */
  const handleContinue = (choiceId?: string): void => {
    const value = text.trim()
    onContinue(value || undefined, choiceId)
    setText('')
    setPaths([])
  }

  /** 点击方案按钮：直接带 choiceId 继续 */
  const handleChoiceClick = (choiceId: string): void => {
    handleContinue(choiceId)
  }

  const handleSend = (): void => {
    const value = text.trim()
    if (!value || disabled) return
    // 确认挂起时：发送说明并继续流程
    if (awaitingUser) {
      handleContinue()
      return
    }
    if (running) return
    onSend(value, paths)
    setText('')
    setPaths([])
  }

  /** 确认态仍允许输入；普通运行中禁用 */
  const inputDisabled = disabled || (running && !awaitingUser)

  return (
    <div className={styles.wrap}>
      <div className={styles.inner}>
        {awaitUserReason ? (
          <div className={styles.awaitBar}>
            <div className={styles.awaitMain}>
              <Text className={styles.awaitText}>{awaitUserReason}</Text>
              {awaitUserChoices?.length ? (
                <div className={styles.choiceGroup}>
                  {awaitUserChoices.map((choice) => (
                    <Tooltip key={choice.id} title={choice.description}>
                      <Button size="small" onClick={() => handleChoiceClick(choice.id)}>
                        {choice.label}
                      </Button>
                    </Tooltip>
                  ))}
                </div>
              ) : null}
            </div>
            <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => handleContinue()}>
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
              awaitingUser
                ? awaitUserChoices?.length
                  ? '可点击上方方案，或输入如「选方案B」后发送'
                  : '可输入补充说明，Enter 或点「继续」一并提交给 Agent'
                : running
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
                    : '搜索或选择模型，也可直接输入模型 id'
                }
              >
                <Select
                  showSearch
                  size="small"
                  className={styles.modelSelect}
                  classNames={{ popup: { root: styles.modelSelectPopup } }}
                  disabled={inputDisabled || running}
                  loading={modelSwitching || modelsLoading}
                  value={settings.model}
                  options={modelSelectOptions}
                  listHeight={MODEL_SELECT_LIST_HEIGHT}
                  popupMatchSelectWidth={320}
                  placeholder="搜索模型"
                  optionFilterProp="searchText"
                  filterOption={(input, option) => {
                    const hay = String(option?.searchText ?? option?.label ?? '').toLowerCase()
                    return hay.includes(input.trim().toLowerCase())
                  }}
                  onSearch={setModelSearch}
                  onChange={(v) => void handleModelChange(String(v))}
                  onOpenChange={(open) => {
                    if (!open) setModelSearch('')
                  }}
                  suffixIcon={<DownOutlined className={styles.modelChevron} />}
                />
              </Tooltip>
            </Space>
            <Space size={10}>
              <div className={styles.token} data-running={running}>
                {running ? <LoadingOutlined className={styles.tokenSpin} spin /> : null}
                <Text type="secondary" className={styles.tokenText}>
                  {running ? '处理中' : `${tokenDisplayUsed}/${tokenDisplayMaxK}k`}
                </Text>
              </div>
              {running && !awaitingUser ? (
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
                      : awaitingUser
                        ? !text.trim()
                          ? '输入说明后发送并继续'
                          : '发送并继续'
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
                    disabled={!text.trim() || disabled || (running && !awaitingUser)}
                    onClick={handleSend}
                  />
                </Tooltip>
              )}
              {running && awaitingUser ? (
                <Tooltip title="中止当前流程">
                  <Button
                    danger
                    shape="circle"
                    className={styles.stopBtn}
                    icon={<PauseCircleOutlined />}
                    onClick={onAbort}
                  />
                </Tooltip>
              ) : null}
            </Space>
          </div>
        </div>
      </div>
    </div>
  )
}
