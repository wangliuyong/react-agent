import {
  queryChatModelOptionsFromCatalog,
  queryGeneralChatModelConnection,
  queryGeneralChatModelId,
  queryModelCategory,
  queryModelLabel,
  queryModelOptionDisplayLabel,
  queryResolveModelForProvider,
  type ToolProgressPayload,
  type UserChoiceOption
} from '@shared/types'
import { useSettingsStore } from '@/features/settings'
import { useSkillsStore } from '@/features/skills'
import { useChatAttachments } from '../../hooks/useChatAttachments'
import { useChatPasteDrop } from '../../hooks/useChatPasteDrop'
import { queryAgentStatusLabel } from '../../utils/agent-status'
import { AttachmentPreviewList } from '../AttachmentPreviewList'
import { TypingIndicator } from '../TypingIndicator'
import { postSelectDirectory, postSelectImages } from '../../api'
import styles from './ChatInput.module.css'

const { Text } = Typography

/** 下拉可视区高度，避免模型过多撑满屏幕 */
const MODEL_SELECT_LIST_HEIGHT = 280

/**
 * 仅附件发送时的默认提示。
 * 为什么固定文案：无文字时仍需触发 vision/OCR，避免空 human 消息。
 */
const ATTACHMENT_ONLY_PROMPT = '请根据附件内容回答（图片文字已由本机系统识别）'

interface ChatInputProps {
  disabled?: boolean
  /** disabled 时输入框占位提示（如任务流程已成功结束） */
  sendDisabledHint?: string
  running?: boolean
  streamingText?: string
  activeToolName?: string | null
  /** 当前执行中的工具参数（如 use_skill 的 skillId） */
  activeToolArgs?: Record<string, unknown> | null
  /** 长耗时工具进度（如 Remotion 渲染） */
  activeToolProgress?: ToolProgressPayload | null
  /** 当前任务选用的模型连接名 */
  activeModelLabel?: string | null
  /** 技能 id → 展示名 */
  skillNameById?: ReadonlyMap<string, string>
  awaitUserReason?: string | null
  /** 挂起确认时的可选方案 */
  awaitUserChoices?: UserChoiceOption[] | null
  tokenUsed?: number
  /** 本会话已选用的自定义技能 id */
  selectedSkillIds?: string[]
  /** 更新会话选用技能 */
  onSelectedSkillIdsChange?: (ids: string[]) => void
  onSend: (text: string, paths: string[]) => void
  onAbort: () => void
  onContinue: (userInput?: string, choiceId?: string) => void
}

/** 底部输入条：附件 / 学习技能 / 完全访问 / 模型 / 发送 */
export function ChatInput({
  disabled,
  sendDisabledHint,
  running,
  streamingText = '',
  activeToolName = null,
  activeToolArgs = null,
  activeToolProgress = null,
  activeModelLabel = null,
  skillNameById,
  awaitUserReason,
  awaitUserChoices = null,
  tokenUsed = 0,
  selectedSkillIds = [],
  onSelectedSkillIdsChange,
  onSend,
  onAbort,
  onContinue
}: ChatInputProps): React.ReactElement {
  const [text, setText] = useState('')
  const [modelSwitching, setModelSwitching] = useState(false)
  const [skillPopoverOpen, setSkillPopoverOpen] = useState(false)
  const {
    attachments,
    paths,
    postAddPaths,
    postRemovePath,
    postClearAttachments
  } = useChatAttachments()
  const settings = useSettingsStore((s) => s.settings)
  const postSettings = useSettingsStore((s) => s.postSettings)
  const skills = useSkillsStore((s) => s.skills)
  const hydrateSkills = useSkillsStore((s) => s.hydrate)

  const awaitingUser = Boolean(awaitUserReason)
  /** 确认态仍允许输入；普通运行中禁用（含粘贴/拖入） */
  const inputDisabled = disabled || (running && !awaitingUser)
  const { onPaste, onDrop, onDragOver } = useChatPasteDrop({
    disabled: inputDisabled,
    postAddPaths
  })
  /** 有文字或已选附件即可发送 */
  const canSend = Boolean(text.trim() || paths.length)

  useEffect(() => {
    void hydrateSkills()
  }, [hydrateSkills])

  const customSkills = useMemo(() => skills.filter((s) => !s.isBuiltin), [skills])
  /** 内置技能始终全局注入，弹层只读提示 */
  const builtinSkills = useMemo(() => skills.filter((s) => s.isBuiltin), [skills])

  /** 主聊天实际调用的默认连接（可能与顶层 settings.model 不同步） */
  const generalChatConnection = useMemo(
    () => queryGeneralChatModelConnection(settings),
    [settings]
  )
  const activeChatModelId = useMemo(() => queryGeneralChatModelId(settings), [settings])
  const providerMismatch =
    generalChatConnection.provider !== settings.provider &&
    Boolean(generalChatConnection.apiKey.trim())

  /** 参考样式：以 120k 为展示上限 */
  const tokenDisplayMax = 200_000
  const tokenDisplayUsed = Math.round(tokenUsed / 1000)
  const tokenDisplayMaxK = Math.round(tokenDisplayMax / 1000)

  const statusLabel = useMemo(
    () =>
      queryAgentStatusLabel({
        running: Boolean(running),
        streamingText,
        activeToolName,
        activeToolArgs,
        skillNameById,
        activeToolProgress,
        awaitUserReason: awaitUserReason ?? null,
        activeModelLabel
      }),
    [
      running,
      streamingText,
      activeToolName,
      activeToolArgs,
      skillNameById,
      activeToolProgress,
      awaitUserReason,
      activeModelLabel
    ]
  )

  /** 切换模型并给出 Toast 反馈；非法 model 会回退到供应商默认并校正默认连接 */
  const handleModelChange = async (model: string): Promise<void> => {
    const next = model.trim()
    if (!next || next === activeChatModelId) return
    const resolved = queryResolveModelForProvider(
      settings.provider,
      next,
      settings.providerModelCatalog,
      settings.customProviders ?? []
    )
    setModelSwitching(true)
    try {
      await postSettings({ model: resolved })
      if (resolved !== next) {
        message.warning(
          `「${next}」与当前供应商 API 不兼容，已切换为 ${queryModelLabel(resolved)}`
        )
      } else {
        message.success(`已切换至 ${queryModelLabel(resolved)}`)
      }
    } finally {
      setModelSwitching(false)
    }
  }

  /** 仅当前选用供应商在本机登记的模型（设置 → 模型与 API → 管理模型） */
  const modelSelectOptions = useMemo(() => {
    const catalogOptions = queryChatModelOptionsFromCatalog(
      settings.provider,
      settings.providerModelCatalog
    )
    const options = catalogOptions.map((m) => ({
      value: m.value,
      label: queryModelOptionDisplayLabel(m),
      searchText: [m.label, m.value, m.category || queryModelCategory(m.value), m.description]
        .filter(Boolean)
        .join(' ')
    }))
    // 默认连接上的 model 可能尚未登记到目录，仍须在下拉中展示为当前选中项
    if (
      activeChatModelId &&
      !options.some((item) => item.value === activeChatModelId) &&
      !providerMismatch
    ) {
      options.unshift({
        value: activeChatModelId,
        label: queryModelLabel(activeChatModelId),
        searchText: activeChatModelId
      })
    }
    return options
  }, [
    settings.provider,
    settings.providerModelCatalog,
    activeChatModelId,
    providerMismatch
  ])

  /** 确认挂起：带上输入框内容继续（空则仅继续） */
  const handleContinue = (choiceId?: string): void => {
    const value = text.trim()
    onContinue(value || undefined, choiceId)
    setText('')
    postClearAttachments()
  }

  /** 点击方案按钮：直接带 choiceId 继续 */
  const handleChoiceClick = (choiceId: string): void => {
    handleContinue(choiceId)
  }

  const handleSend = (): void => {
    if (disabled) return
    const value = text.trim()
    // 确认挂起时：发送说明并继续流程（附件可选）
    if (awaitingUser) {
      handleContinue()
      return
    }
    if (running) return
    if (!value && !paths.length) return
    // 仅附件：补默认识图提示，触发 vision / OCR
    onSend(value || ATTACHMENT_ONLY_PROMPT, paths)
    setText('')
    postClearAttachments()
  }

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

        {/* 长耗时进度条只在消息区展示，输入区仅保留文字状态，避免双进度条 */}
        {running && !awaitUserReason && statusLabel ? (
          <div className={styles.statusBar}>
            <TypingIndicator label={statusLabel} compact />
          </div>
        ) : null}

        <AttachmentPreviewList
          attachments={attachments}
          onRemove={postRemovePath}
          onClear={postClearAttachments}
        />

        <div
          className={styles.box}
          data-running={running}
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
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
                    : '描述任务，可粘贴/拖入图片或文件；Enter 发送，Shift+Enter 换行…'
            }
            value={text}
            rows={2}
            disabled={inputDisabled}
            onChange={(e) => setText(e.target.value)}
            onPaste={onPaste}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
          <div className={styles.toolbar}>
            <Space size={4}>
              <Dropdown
                disabled={running}
                menu={{
                  items: [
                    {
                      key: 'media',
                      icon: <PictureOutlined />,
                      label: '上传媒体（图片 / 视频 / 音频）',
                      onClick: () => {
                        void (async () => {
                          const selected = await postSelectImages()
                          if (selected.length) postAddPaths(selected)
                        })()
                      }
                    },
                    {
                      key: 'folder',
                      icon: <FolderOpenOutlined />,
                      label: '选择文件夹',
                      onClick: () => {
                        void (async () => {
                          const dir = await postSelectDirectory()
                          if (dir) postAddPaths([dir], 'folder')
                        })()
                      }
                    }
                  ]
                }}
              >
                <Button type="text" icon={<PaperClipOutlined />} disabled={running} />
              </Dropdown>
              <Popover
                trigger="click"
                open={skillPopoverOpen}
                onOpenChange={setSkillPopoverOpen}
                placement="topLeft"
                title="学习技能"
                content={
                  <div className={styles.skillPicker}>
                    {builtinSkills.length > 0 ? (
                      <Text type="secondary" className={styles.skillPickerHint}>
                        已全局注入 {builtinSkills.length} 个内置技能
                        {builtinSkills.length <= 4
                          ? `：${builtinSkills.map((s) => s.name).join('、')}`
                          : ''}
                      </Text>
                    ) : (
                      <Text type="secondary" className={styles.skillPickerHint}>
                        当前无内置技能
                      </Text>
                    )}
                    <Text type="secondary" className={styles.skillPickerHint}>
                      自定义技能可在技能市场开全局注入，或在此勾选后注入本会话
                    </Text>
                    <Select
                      mode="multiple"
                      allowClear
                      showSearch
                      placeholder={
                        customSkills.length ? '选择要注入的自定义技能' : '暂无自定义技能'
                      }
                      disabled={!onSelectedSkillIdsChange || customSkills.length === 0}
                      value={selectedSkillIds}
                      optionFilterProp="label"
                      style={{ width: 320 }}
                      options={customSkills.map((s) => ({
                        value: s.id,
                        label: s.name,
                        title: s.description
                      }))}
                      onChange={(ids) => onSelectedSkillIdsChange?.(ids as string[])}
                    />
                  </div>
                }
              >
                <Tooltip title="学习技能：为本会话选用自定义技能">
                  <Badge
                    count={selectedSkillIds.length}
                    size="small"
                    offset={[-2, 2]}
                    overflowCount={99}
                  >
                    <Button
                      type="text"
                      icon={<ThunderboltOutlined />}
                      disabled={running || disabled}
                    />
                  </Badge>
                </Tooltip>
              </Popover>
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
                        ? '完全访问：跳过敏感确认与方案选择；自动发布/流程连续执行（确认节点、扫码、渲染除外）'
                        : '需确认模式：敏感操作与多方案选择前会暂停确认'
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
                    : providerMismatch
                      ? `当前选用供应商与默认对话连接不一致，实际调用 ${generalChatConnection.model}（${generalChatConnection.label}）。请在设置中保存「模型与 API」或调整多模型连接。`
                      : modelSelectOptions.length === 0
                        ? '请先在设置 → 模型与 API → 管理模型 中登记模型'
                        : '展示默认对话连接正在使用的模型；列表为当前供应商本机登记项'
                }
              >
                <Select
                  showSearch
                  size="small"
                  className={styles.modelSelect}
                  classNames={{ popup: { root: styles.modelSelectPopup } }}
                  disabled={inputDisabled || running || providerMismatch}
                  loading={modelSwitching}
                  value={providerMismatch ? generalChatConnection.model : activeChatModelId}
                  options={modelSelectOptions}
                  listHeight={MODEL_SELECT_LIST_HEIGHT}
                  popupMatchSelectWidth={320}
                  placeholder={
                    modelSelectOptions.length === 0 ? '暂无登记模型' : '搜索模型'
                  }
                  optionFilterProp="searchText"
                  filterOption={(input, option) => {
                    const hay = String(option?.searchText ?? option?.label ?? '').toLowerCase()
                    return hay.includes(input.trim().toLowerCase())
                  }}
                  onChange={(v) => void handleModelChange(String(v))}
                  suffixIcon={<DownOutlined className={styles.modelChevron} />}
                />
              </Tooltip>
            </Space>
            <Space size={10}>
              {/*不在展示token消耗*/}
              {/*<div className={styles.token} data-running={running}>
                {running ? <LoadingOutlined className={styles.tokenSpin} spin /> : null}
                <Text type="secondary" className={styles.tokenText}>
                  {running ? '处理中' : `${tokenDisplayUsed}k/${tokenDisplayMaxK}k`}
                </Text>
              </div>*/}
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
                        ? !text.trim() && !paths.length
                          ? '可输入说明或直接继续'
                          : '发送并继续'
                        : !canSend
                          ? '请输入消息或添加附件'
                          : '发送'
                  }
                >
                  <Button
                    type="primary"
                    shape="circle"
                    className={styles.sendBtn}
                    icon={<SendOutlined />}
                    disabled={!canSend || disabled || (running && !awaitingUser)}
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
