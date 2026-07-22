import type { CSSProperties } from 'react'
import {
  queryAllProviderOptions,
  queryIsCustomModelProvider,
  queryRemoveCustomProvider,
  type CustomModelProvider,
  type ModelProvider
} from '@shared/types'
import { useSettingsStore } from '../../hooks/useSettingsStore'
import { AddModelProviderModal } from '../AddModelProviderModal'
import { EditProviderCredentialsModal } from '../EditProviderCredentialsModal'
import {
  queryInitialProviderDrafts,
  queryModelApiSavePatch,
  type ProviderFormDraft,
  type ProviderFormDraftMap
} from '../SettingsPage/settingsFormSync'
import cardStyles from '../../styles/settingsCard.module.css'
import styles from './ModelApiPanel.module.css'

const { Text, Title } = Typography

/** 密钥脱敏展示 */
function queryMaskApiKey(key: string): string {
  const trimmed = key.trim()
  if (!trimmed) return '未配置'
  if (trimmed.length <= 8) return '••••••••'
  return `${trimmed.slice(0, 4)}••••${trimmed.slice(-4)}`
}

/**
 * 模型与 API 配置面板：每个供应商一张卡片，编辑走弹窗；保存时一次性写入。
 */
export function ModelApiPanel(): React.ReactElement {
  const settings = useSettingsStore((s) => s.settings)
  const loaded = useSettingsStore((s) => s.loaded)
  const postSettings = useSettingsStore((s) => s.postSettings)

  const [saving, setSaving] = useState(false)
  const [addProviderOpen, setAddProviderOpen] = useState(false)
  const [activeProvider, setActiveProvider] = useState<ModelProvider>(settings.provider)
  const [providerDrafts, setProviderDrafts] = useState<ProviderFormDraftMap>({})
  const [maxTurns, setMaxTurns] = useState(settings.maxTurns)
  const [fullAccess, setFullAccess] = useState(settings.fullAccess)
  const [thinkingEnabled, setThinkingEnabled] = useState(settings.thinkingEnabled)
  const [customProviders, setCustomProviders] = useState<CustomModelProvider[]>(
    settings.customProviders ?? []
  )
  const [editingProvider, setEditingProvider] = useState<ModelProvider | null>(null)
  /** 添加供应商后跳过下一次全量同步，避免冲掉未保存草稿 */
  const skipSyncRef = useRef(false)
  /** 用户已切换「当前选用」但未保存时，避免 settings 更新把选用状态冲回 */
  const activeProviderDirtyRef = useRef(false)

  const providerOptions = useMemo(
    () => queryAllProviderOptions(customProviders),
    [customProviders]
  )

  useEffect(() => {
    if (!loaded) return
    if (skipSyncRef.current) {
      skipSyncRef.current = false
      setCustomProviders(settings.customProviders ?? [])
      return
    }
    setActiveProvider((prev) =>
      activeProviderDirtyRef.current ? prev : settings.provider
    )
    setProviderDrafts(queryInitialProviderDrafts(settings))
    setMaxTurns(settings.maxTurns)
    setFullAccess(settings.fullAccess)
    setThinkingEnabled(settings.thinkingEnabled)
    setCustomProviders(settings.customProviders ?? [])
  }, [loaded, settings])

  const handleSave = async (): Promise<void> => {
    const activeDraft = providerDrafts[activeProvider]
    if (!activeDraft?.apiKey?.trim()) {
      message.warning('当前选用供应商需配置 API Key')
      return
    }
    setSaving(true)
    try {
      await postSettings(
        queryModelApiSavePatch({
          activeProvider,
          drafts: providerDrafts,
          settings,
          maxTurns,
          fullAccess,
          thinkingEnabled,
          customProviders
        })
      )
      activeProviderDirtyRef.current = false
      message.success('设置已保存')
    } catch (err) {
      message.error(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleAddCustomProvider = async (provider: CustomModelProvider): Promise<void> => {
    const nextProviders = [...customProviders, provider]
    setAddProviderOpen(false)
    setCustomProviders(nextProviders)
    setProviderDrafts((prev) => ({
      ...prev,
      [provider.id]: {
        apiKey: '',
        baseUrl: provider.defaultBaseUrl,
        model: provider.defaultModel
      }
    }))
    skipSyncRef.current = true
    try {
      await postSettings({ customProviders: nextProviders })
      message.success(`已添加供应商「${provider.label}」`)
    } catch {
      skipSyncRef.current = false
      setCustomProviders(customProviders)
      message.error('添加供应商失败，请重试')
    }
  }

  const handleDeleteCustomProvider = async (providerId: ModelProvider): Promise<void> => {
    if (!queryIsCustomModelProvider(providerId)) return
    const target = customProviders.find((item) => item.id === providerId)
    if (!target) return

    const nextProviders = queryRemoveCustomProvider(customProviders, providerId)
    setCustomProviders(nextProviders)
    setProviderDrafts((prev) => {
      const next = { ...prev }
      delete next[providerId]
      return next
    })
    if (activeProvider === providerId) {
      setActiveProvider(settings.provider === providerId ? 'dashscope' : settings.provider)
    }

    const deletingSelected = activeProvider === providerId
    if (!deletingSelected) {
      skipSyncRef.current = true
    }

    try {
      await postSettings({ customProviders: nextProviders })
      message.success(`已删除供应商「${target.label}」`)
    } catch {
      skipSyncRef.current = false
      setCustomProviders(customProviders)
      message.error('删除供应商失败，请重试')
    }
  }

  const handleConfirmDelete = (providerId: ModelProvider, label: string): void => {
    Modal.confirm({
      title: `删除供应商「${label}」？`,
      content: '多模型连接中若引用该供应商，将自动回退到默认供应商。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => handleDeleteCustomProvider(providerId)
    })
  }

  const editingProviderMeta = providerOptions.find((item) => item.value === editingProvider)
  const editingDraft: ProviderFormDraft = editingProvider
    ? (providerDrafts[editingProvider] ?? {
      apiKey: '',
      baseUrl: editingProviderMeta?.defaultBaseUrl ?? '',
      model: editingProviderMeta?.defaultModel ?? ''
    })
    : { apiKey: '', baseUrl: '', model: '' }

  if (!loaded) {
    return (
      <div className={cardStyles.loading}>
        <Spin />
        <Text type="secondary">正在加载本机配置…</Text>
      </div>
    )
  }

  return (
    <div className={styles.panel}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarText}>
          <Title level={5} className={styles.title}>
            模型与 API
          </Title>
          <Text type="secondary" className={styles.desc}>
            内置百炼 / DeepSeek，也可添加自定义 OpenAI 兼容网关；点击卡片编辑凭证
          </Text>
        </div>
        <Space wrap>
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={() => setAddProviderOpen(true)}
          >
            添加供应商
          </Button>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            loading={saving}
            onClick={() => void handleSave()}
          >
            保存设置
          </Button>
        </Space>
      </div>

      <div className={cardStyles.grid}>
        {providerOptions.map((option, index) => {
          const draft = providerDrafts[option.value] ?? {
            apiKey: '',
            baseUrl: option.defaultBaseUrl,
            model: option.defaultModel
          }
          const isActive = activeProvider === option.value
          const isCustom = queryIsCustomModelProvider(option.value)
          const configured = Boolean(draft.apiKey.trim())

          return (
            <Card
              key={option.value}
              variant="borderless"
              className={`${cardStyles.card} ${isActive ? cardStyles.cardActive : ''}`}
              style={{ '--card-index': index } as CSSProperties}
            >
              <div className={cardStyles.cardHead}>
                <div className={cardStyles.cardTitleBlock}>
                  <Text className={cardStyles.cardTitle} ellipsis={{ tooltip: option.label }}>
                    {option.label}
                  </Text>
                  <div className={cardStyles.tagRow}>
                    {isActive ? <Tag className={cardStyles.primaryTag}>当前选用</Tag> : null}
                    {isCustom ? <Tag className={cardStyles.mutedTag}>自定义</Tag> : null}
                    <Tag className={configured ? cardStyles.successTag : cardStyles.neutralTag}>
                      {configured ? '已配置' : '未配置'}
                    </Tag>
                  </div>
                </div>
                <div className={cardStyles.cardActions}>
                  {!isActive ? (
                    <Tooltip title="设为当前选用">
                      <Button
                        type="text"
                        size="small"
                        className={cardStyles.actionBtn}
                        icon={<StarOutlined />}
                        aria-label={`将 ${option.label} 设为当前选用`}
                        onClick={() => setActiveProvider(option.value)}
                      />
                    </Tooltip>
                  ) : null}
                  <Tooltip title="编辑凭证">
                    <Button
                      type="text"
                      size="small"
                      className={cardStyles.actionBtn}
                      icon={<EditOutlined />}
                      aria-label={`编辑 ${option.label}`}
                      onClick={() => setEditingProvider(option.value)}
                    />
                  </Tooltip>
                  {isCustom ? (
                    <Tooltip title="删除供应商">
                      <Button
                        type="text"
                        danger
                        size="small"
                        className={cardStyles.actionBtn}
                        icon={<DeleteOutlined />}
                        aria-label={`删除 ${option.label}`}
                        onClick={() => handleConfirmDelete(option.value, option.label)}
                      />
                    </Tooltip>
                  ) : null}
                </div>
              </div>

              <div className={cardStyles.cardBody}>
                <div className={cardStyles.metaRow}>
                  <Text type="secondary" className={cardStyles.metaLabel}>
                    API Key
                  </Text>
                  <Text
                    className={`${cardStyles.metaValue} ${!configured ? cardStyles.metaValueMuted : ''}`}
                    ellipsis={{ tooltip: configured ? queryMaskApiKey(draft.apiKey) : '未配置' }}
                  >
                    {queryMaskApiKey(draft.apiKey)}
                  </Text>
                </div>
                <div className={cardStyles.metaRow}>
                  <Text type="secondary" className={cardStyles.metaLabel}>
                    Base URL
                  </Text>
                  <Text
                    className={cardStyles.metaValue}
                    ellipsis={{ tooltip: draft.baseUrl || option.defaultBaseUrl }}
                  >
                    {draft.baseUrl || option.defaultBaseUrl}
                  </Text>
                </div>
                <div className={cardStyles.metaRow}>
                  <Text type="secondary" className={cardStyles.metaLabel}>
                    默认模型
                  </Text>
                  <Text
                    className={cardStyles.metaValue}
                    ellipsis={{ tooltip: draft.model || option.defaultModel }}
                  >
                    {draft.model || option.defaultModel}
                  </Text>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <div className={styles.runtimeSection}>
        <div className={styles.runtimeHeader}>
          <Title level={5} className={styles.title}>
            运行参数
          </Title>
          <Text type="secondary" className={styles.desc}>
            Agent 全局行为偏好，与具体供应商无关
          </Text>
        </div>
        <div className={styles.runtimeGrid}>
          <Card variant="borderless" className={styles.runtimeCard}>
            <span className={styles.runtimeIcon}>
              <ThunderboltOutlined />
            </span>
            <div className={styles.runtimeContent}>
              <span className={styles.runtimeTitle}>最大工具轮次</span>
              <Text type="secondary" className={styles.runtimeDesc}>
                单次任务允许 Agent 连续调用工具的上限
              </Text>
            </div>
            <div className={styles.runtimeControl}>
              <InputNumber
                min={5}
                max={100}
                value={maxTurns}
                onChange={(v) => setMaxTurns(Number(v) || 40)}
              />
            </div>
          </Card>

          <Card variant="borderless" className={styles.runtimeCard}>
            <span className={styles.runtimeIcon}>
              <ToolOutlined />
            </span>
            <div className={styles.runtimeContent}>
              <span className={styles.runtimeTitle}>完全访问</span>
              <Text type="secondary" className={styles.runtimeDesc}>
                允许更广泛的本机操作，仅在你信任当前任务时开启
              </Text>
            </div>
            <div className={styles.runtimeControl}>
              <Switch checked={fullAccess} onChange={setFullAccess} />
            </div>
          </Card>

          <Card variant="borderless" className={styles.runtimeCard}>
            <span className={styles.runtimeIcon}>
              <BulbOutlined />
            </span>
            <div className={styles.runtimeContent}>
              <span className={styles.runtimeTitle}>思考模式</span>
              <Text type="secondary" className={styles.runtimeDesc}>
                允许部分模型输出 thinking / reasoning 过程（DeepSeek 可能影响多轮工具调用）
              </Text>
            </div>
            <div className={styles.runtimeControl}>
              <Switch checked={thinkingEnabled} onChange={setThinkingEnabled} />
            </div>
          </Card>
        </div>
      </div>

      <div className={styles.footerHint}>
        <RobotOutlined />
        <span>新设置将在下一条 Agent 消息中生效</span>
      </div>

      <EditProviderCredentialsModal
        open={Boolean(editingProvider)}
        provider={editingProvider}
        providerLabel={editingProviderMeta?.label ?? ''}
        initialValues={editingDraft}
        customProviders={customProviders}
        onCancel={() => setEditingProvider(null)}
        onSubmit={(values) => {
          if (!editingProvider) return
          setProviderDrafts((prev) => ({
            ...prev,
            [editingProvider]: values
          }))
          setEditingProvider(null)
        }}
      />

      <AddModelProviderModal
        open={addProviderOpen}
        onCancel={() => setAddProviderOpen(false)}
        onSubmit={handleAddCustomProvider}
      />
    </div>
  )
}
