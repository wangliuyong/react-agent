import {
  MODEL_PROVIDER_OPTIONS,
  queryIsCustomModelProvider,
  queryModelOptionDisplayLabel,
  queryModelOptions,
  queryProviderOption,
  queryRemoveCustomProvider,
  type AppSettings,
  type CustomModelProvider,
  type ModelProvider
} from '@shared/types'
import { useSettingsStore } from '../../hooks/useSettingsStore'
import { ChannelStatusPanel } from '../ChannelStatusPanel'
import { ModelConnectionsPanel } from '../ModelConnectionsPanel'
import { AddModelProviderModal } from '../AddModelProviderModal'
import styles from './SettingsPage.module.css'
import {
  queryProviderSwitchFormValues,
  querySettingsFormValues,
  querySettingsMainFormPatch,
  queryShouldSyncSettingsForm,
  type ProviderFormDraftMap
} from './settingsFormSync'
import { useProviderModels } from '../../hooks/useProviderModels'
import { queryProviderModelsStatusHint } from '../../hooks/providerModelsShared'
import { BASE_URL_RULES, MODEL_RULES, PROVIDER_RULES } from './settingsValidation'

const { Title, Paragraph, Text } = Typography

/** 设置分类 Tab — 对齐技能市场 Segmented 信息架构 */
type SettingsTab = 'model' | 'connections' | 'app' | 'channels'

const SETTINGS_TAB_OPTIONS: { label: string; value: SettingsTab }[] = [
  { label: '模型与 API', value: 'model' },
  { label: '多模型连接', value: 'connections' },
  { label: '应用与启动', value: 'app' },
  { label: '渠道状态', value: 'channels' }
]

export function SettingsPage(): React.ReactElement {
  const settings = useSettingsStore((s) => s.settings)
  const loaded = useSettingsStore((s) => s.loaded)
  const postSettings = useSettingsStore((s) => s.postSettings)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<SettingsTab>('model')
  const [addProviderOpen, setAddProviderOpen] = useState(false)
  const [form] = Form.useForm<AppSettings>()
  const [selectedProvider, setSelectedProvider] = useState<ModelProvider>(settings.provider)
  /** 手动刷新计数，便于用户点击「刷新模型」重拉 */
  const [modelsRefreshToken, setModelsRefreshToken] = useState(0)
  /**
   * 按供应商缓存表单草稿：切换时暂存当前输入，切回时可恢复，
   * 避免「已配置 API Key 被清空」且无法回显。
   */
  const providerDraftsRef = useRef<ProviderFormDraftMap>({})
  /**
   * 添加供应商会立刻持久化 customProviders；
   * 用此标记跳过随后一次全量表单同步，避免冲掉当前未保存的 API Key 等草稿。
   */
  const skipFullFormSyncRef = useRef(false)
  /** 监听草稿密钥与地址，输入后即可拉取平台模型，无需先保存 */
  const watchedApiKey = Form.useWatch('apiKey', form)
  const watchedBaseUrl = Form.useWatch('baseUrl', form)
  const watchedCustomProviders = Form.useWatch('customProviders', form) as
    | CustomModelProvider[]
    | undefined
  const customProviders = watchedCustomProviders ?? settings.customProviders ?? []
  const providerOption = queryProviderOption(selectedProvider, customProviders)

  /** 表单空串时回退已保存设置 / 供应商默认地址，避免打到错误 endpoint */
  const draftApiKey =
    String(watchedApiKey ?? '').trim() || String(settings.apiKey ?? '').trim()
  const draftBaseUrl =
    String(watchedBaseUrl ?? '').trim() ||
    String(settings.baseUrl ?? '').trim() ||
    providerOption.defaultBaseUrl

  const {
    remoteModels,
    loading: modelsLoading,
    error: modelsError
  } = useProviderModels({
    enabled: loaded && tab === 'model',
    provider: selectedProvider,
    apiKey: draftApiKey,
    baseUrl: draftBaseUrl,
    customProviders,
    // 设置页不自动拉 /models，仅「从平台刷新」触发，避免输入 Key 时反复请求
    autoFetch: false,
    refreshToken: modelsRefreshToken
  })

  /**
   * 为什么：供应商切换需要 Form.useForm + setFieldsValue；
   * 但 FormInstance 会保留首次挂载时的值，hydrate 后仅靠 initialValues / remount key 无法可靠回显。
   * 因此在本地配置加载完成后显式写入表单，并同步供应商本地状态。
   */
  useEffect(() => {
    if (!queryShouldSyncSettingsForm(loaded)) return
    // 添加供应商仅更新 customProviders：只回写该字段，保留当前编辑中的凭证草稿
    if (skipFullFormSyncRef.current) {
      skipFullFormSyncRef.current = false
      form.setFieldValue('customProviders', settings.customProviders ?? [])
      return
    }
    const values = querySettingsFormValues(settings)
    setSelectedProvider(values.provider)
    form.setFieldsValue(values)
    // 用本机已保存配置初始化当前供应商草稿，保证切走再切回可回显
    providerDraftsRef.current[values.provider] = {
      apiKey: values.apiKey,
      baseUrl: values.baseUrl,
      model: values.model
    }
  }, [loaded, settings, form])

  const providerSelectOptions = useMemo((): {
    label: string
    value?: ModelProvider
    options?: { value: ModelProvider; label: string }[]
  }[] => {
    const builtIn = MODEL_PROVIDER_OPTIONS.map((option) => ({
      value: option.value,
      label: option.label
    }))
    const custom = customProviders.map((provider) => ({
      value: provider.id,
      label: provider.label
    }))
    if (custom.length === 0) return builtIn
    return [
      { label: '内置供应商', options: builtIn },
      { label: '自定义供应商', options: custom }
    ]
  }, [customProviders])

  const handleProviderChange = (provider: ModelProvider): void => {
    const current = form.getFieldsValue()
    providerDraftsRef.current[selectedProvider] = {
      apiKey: String(current.apiKey ?? ''),
      baseUrl: String(current.baseUrl ?? ''),
      model: String(current.model ?? '')
    }
    const nextValues = queryProviderSwitchFormValues(
      provider,
      { ...settings, customProviders },
      providerDraftsRef.current
    )
    setSelectedProvider(provider)
    form.setFieldsValue(nextValues)
  }

  /**
   * 添加自定义供应商：只登记、不切换当前选用。
   * 立即持久化 customProviders，便于「模型与 API」与「多模型连接」下拉立刻可选。
   */
  const handleAddCustomProvider = async (provider: CustomModelProvider): Promise<void> => {
    const nextProviders = [...customProviders, provider]
    setAddProviderOpen(false)
    form.setFieldValue('customProviders', nextProviders)
    skipFullFormSyncRef.current = true
    try {
      await postSettings({ customProviders: nextProviders })
      message.success(`已添加供应商「${provider.label}」，可在下拉列表中选用`)
    } catch {
      skipFullFormSyncRef.current = false
      form.setFieldValue('customProviders', customProviders)
      message.error('添加供应商失败，请重试')
    }
  }

  /**
   * 删除自定义供应商并立即持久化。
   * 若删除的是当前选用项，由 normalizeSettings 回退默认供应商并全量同步表单；
   * 删除其他项时跳过全量同步，避免冲掉当前未保存草稿。
   */
  const handleDeleteCustomProvider = async (providerId: ModelProvider): Promise<void> => {
    if (!queryIsCustomModelProvider(providerId)) return
    const target = customProviders.find((item) => item.id === providerId)
    if (!target) return

    const nextProviders = queryRemoveCustomProvider(customProviders, providerId)
    const deletingSelected = selectedProvider === providerId
    form.setFieldValue('customProviders', nextProviders)
    delete providerDraftsRef.current[providerId]

    if (!deletingSelected) {
      skipFullFormSyncRef.current = true
    }

    try {
      await postSettings({ customProviders: nextProviders })
      message.success(`已删除供应商「${target.label}」`)
    } catch {
      skipFullFormSyncRef.current = false
      form.setFieldValue('customProviders', customProviders)
      message.error('删除供应商失败，请重试')
    }
  }

  /** 下拉内删除：阻止选中该项，二次确认后删除 */
  const handleConfirmDeleteCustomProvider = (providerId: ModelProvider, label: string): void => {
    Modal.confirm({
      title: `删除供应商「${label}」？`,
      content: '多模型连接中若引用该供应商，将自动回退到默认供应商。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => handleDeleteCustomProvider(providerId)
    })
  }

  const handleSaveSettings = async (values: AppSettings): Promise<void> => {
    setSaving(true)
    try {
      // customProviders 由弹窗写入表单，提交时一并持久化
      await postSettings(
        querySettingsMainFormPatch({
          ...values,
          customProviders
        })
      )
      message.success('设置已保存')
    } finally {
      setSaving(false)
    }
  }

  /** 若用户曾保存自定义 model id，合并进选项避免 Select 显示异常 */
  const modelSelectOptions = useMemo(() => {
    const fromApi = remoteModels != null
    const providerModels = fromApi ? remoteModels : queryModelOptions(selectedProvider)
    const options = providerModels.map((m) => ({
      value: m.value,
      label: queryModelOptionDisplayLabel(m)
    }))
    if (
      selectedProvider === settings.provider &&
      !providerModels.some((m) => m.value === settings.model)
    ) {
      options.unshift({
        value: settings.model,
        label: queryModelOptionDisplayLabel({
          provider: selectedProvider,
          value: settings.model,
          label: settings.model
        })
      })
    }
    return options
  }, [selectedProvider, settings.model, settings.provider, remoteModels])

  const modelListExtra = queryProviderModelsStatusHint({
    apiKey: draftApiKey,
    loading: modelsLoading,
    remoteCount: remoteModels?.length ?? null,
    error: modelsError
  })

  const connectionCount = settings.connections?.length ?? 0
  const tabHint =
    tab === 'model'
      ? '默认兼容服务与运行参数'
      : tab === 'connections'
        ? `${connectionCount || 1} 条连接`
        : tab === 'app'
          ? '本机启动偏好'
          : '发布与通知渠道'

  return (
    <div className={styles.page}>
      {/* 顶栏沿用技能市场的图标、标题与辅助信息结构，保持功能页视觉一致。 */}
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <div className={styles.headerIcon}>
            <SettingOutlined />
          </div>
          <div>
            <div className={styles.titleRow}>
              <Title level={3} className={styles.title}>
                设置
              </Title>
              <span className={styles.versionBadge}>偏好中心</span>
            </div>
            <Paragraph className={styles.desc}>
              配置模型服务、运行参数，并管理本机渠道登录状态
            </Paragraph>
          </div>
        </div>
        <div className={styles.localBadge}>
          <CheckCircleOutlined />
          <span>敏感信息仅存本机</span>
        </div>
      </header>

      {/* 分类栏：Segmented Tab，与技能市场 / 渠道页同构 */}
      <div className={styles.toolbar}>
        <Segmented
          value={tab}
          onChange={(v) => setTab(v as SettingsTab)}
          options={SETTINGS_TAB_OPTIONS}
        />
        <div className={styles.toolbarRight}>
          <span className={styles.resultCount}>{tabHint}</span>
        </div>
      </div>

      <div className={styles.body}>
        {tab === 'model' ? (
          <div className={styles.formCard} key="model">
            {!loaded ? (
              <>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeading}>
                    <span className={styles.cardIcon}>
                      <ApiOutlined />
                    </span>
                    <div>
                      <Title level={4} className={styles.cardTitle}>
                        模型与 API
                      </Title>
                      <Text type="secondary" className={styles.cardDesc}>
                        默认兼容阿里云百炼，也可连接其他 OpenAI 兼容服务
                      </Text>
                    </div>
                  </div>
                </div>
                <div className={styles.formLoading}>
                  <Spin />
                  <Text type="secondary">正在加载本机配置…</Text>
                </div>
              </>
            ) : (
              <Form
                form={form}
                layout="vertical"
                initialValues={settings}
                className={styles.form}
                onFinish={(values) => void handleSaveSettings(values)}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeading}>
                    <span className={styles.cardIcon}>
                      <ApiOutlined />
                    </span>
                    <div>
                      <Title level={4} className={styles.cardTitle}>
                        模型与 API
                      </Title>
                      <Text type="secondary" className={styles.cardDesc}>
                        内置百炼 / DeepSeek，也可添加自定义 OpenAI 兼容网关
                      </Text>
                    </div>
                  </div>
                  <div className={styles.cardActions}>

                    <Button
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      loading={saving}
                      className={styles.saveButton}
                      onClick={() => void form.submit()}
                    >
                      保存设置
                    </Button>

                  </div>
                </div>

                <div className={styles.formGrid}>
                  <Form.Item
                    className={styles.fullWidth}
                    label="模型供应商"
                    name="provider"
                    rules={PROVIDER_RULES}
                  >
                    <div className={styles.providerRow}>
                      <Select
                        className={styles.providerSelect}
                        value={selectedProvider}
                        options={providerSelectOptions}
                        onChange={handleProviderChange}
                        optionRender={(option) => {
                          const value = option.value as ModelProvider
                          const label = String(option.label ?? '')
                          const isCustom = queryIsCustomModelProvider(value)
                          return (
                            <div className={styles.providerOption}>
                              <span className={styles.providerOptionLabel}>{label}</span>
                              {isCustom ? (
                                <Button
                                  type="text"
                                  size="small"
                                  danger
                                  className={styles.providerOptionDelete}
                                  icon={<DeleteOutlined />}
                                  aria-label={`删除供应商 ${label}`}
                                  onClick={(event) => {
                                    event.preventDefault()
                                    event.stopPropagation()
                                    handleConfirmDeleteCustomProvider(value, label)
                                  }}
                                />
                              ) : null}
                            </div>
                          )
                        }}
                      />
                      <Button
                        type="dashed"
                        icon={<PlusOutlined />}
                        className={styles.addProviderBtn}
                        onClick={() => setAddProviderOpen(true)}
                      >
                        添加供应商
                      </Button>
                      {queryIsCustomModelProvider(selectedProvider) ? (
                        <Popconfirm
                          title="确定删除当前自定义供应商？"
                          description="多模型连接中若引用该供应商，将自动回退到默认供应商。"
                          okText="删除"
                          okButtonProps={{ danger: true }}
                          cancelText="取消"
                          onConfirm={() => void handleDeleteCustomProvider(selectedProvider)}
                        >
                          <Button
                            danger
                            icon={<DeleteOutlined />}
                            className={styles.deleteProviderBtn}
                          >
                            删除
                          </Button>
                        </Popconfirm>
                      ) : null}
                    </div>
                  </Form.Item>

                  <Form.Item
                    className={styles.fullWidth}
                    label="API Key"
                    name="apiKey"
                    rules={[{ required: true, message: '请填写 API Key' }]}
                    extra="密钥仅写入本机 Electron userData，不参与任何遥测或同步。"
                  >
                    <Input.Password prefix={<ApiOutlined />} placeholder="sk-..." />
                  </Form.Item>

                  <Form.Item
                    className={styles.fullWidth}
                    label="Base URL"
                    name="baseUrl"
                    rules={BASE_URL_RULES}
                    extra="请输入包含协议的完整服务地址。"
                  >
                    <Input
                      prefix={<GlobalOutlined />}
                      placeholder={providerOption.defaultBaseUrl}
                    />
                  </Form.Item>

                  <Form.Item
                    label={
                      <span className={styles.modelLabelRow}>
                        默认模型
                        <Button
                          type="link"
                          size="small"
                          icon={<ReloadOutlined />}
                          disabled={!draftApiKey || modelsLoading}
                          loading={modelsLoading}
                          onClick={() => setModelsRefreshToken((n) => n + 1)}
                        >
                          从平台刷新
                        </Button>
                      </span>
                    }
                    name="model"
                    rules={MODEL_RULES}
                    extra={modelListExtra}
                  >
                    <Select
                      showSearch
                      optionFilterProp="label"
                      options={modelSelectOptions}
                      placeholder={draftApiKey ? '从平台选择模型' : '先填写 API Key'}
                      loading={modelsLoading}
                      notFoundContent={
                        modelsLoading ? '加载中…' : draftApiKey ? '暂无模型' : '请先填写 API Key'
                      }
                    />
                  </Form.Item>

                  <Form.Item
                    label="最大工具轮次"
                    name="maxTurns"
                    extra="单次任务允许 Agent 连续调用工具的上限。"
                  >
                    <InputNumber min={5} max={100} style={{ width: '100%' }} />
                  </Form.Item>

                  {/* 高权限配置单独成区，避免与普通模型参数混淆。 */}
                  <div className={`${styles.permissionRow} ${styles.fullWidth}`}>
                    <span className={styles.permissionIcon}>
                      <ToolOutlined />
                    </span>
                    <div className={styles.permissionContent}>
                      <Text strong>完全访问</Text>
                      <Text type="secondary">
                        允许 Agent 执行更广泛的本机操作，仅在你信任当前任务时开启
                      </Text>
                    </div>
                    <Form.Item name="fullAccess" valuePropName="checked" noStyle>
                      <Switch />
                    </Form.Item>
                  </div>
                </div>

                <div className={styles.formFooter}>
                  <div className={styles.footerHint}>
                    <RobotOutlined />
                    <span>新设置将在下一条 Agent 消息中生效</span>
                  </div>
                </div>
              </Form>
            )}

            <AddModelProviderModal
              open={addProviderOpen}
              onCancel={() => setAddProviderOpen(false)}
              onSubmit={handleAddCustomProvider}
            />
          </div>
        ) : null}

        {tab === 'connections' ? (
          loaded ? (
            <ModelConnectionsPanel key="connections" />
          ) : (
            <div className={styles.formCard} key="connections-loading">
              <div className={styles.formLoading}>
                <Spin />
                <Text type="secondary">正在加载本机配置…</Text>
              </div>
            </div>
          )
        ) : null}

        {tab === 'app' ? (
          <div className={styles.prefGrid} key="app">
            {/* 偏好项做成技能市场式卡片，一眼可读、一点可改 */}
            <Card variant="borderless" className={styles.prefCard}>
              <div className={styles.prefCardHead}>
                <span className={styles.prefCardIcon}>
                  <PoweroffOutlined />
                </span>
                <Tag className={styles.prefTag}>启动</Tag>
              </div>
              <div className={styles.prefCardBody}>
                <span className={styles.prefCardTitle}>开机自启</span>
                <p className={styles.prefCardDesc}>
                  登录 macOS / Windows 后自动启动灵犀，便于后台定时任务与渠道保持在线
                </p>
              </div>
              <div className={styles.prefCardFooter}>
                <span className={styles.prefCardMeta}>本机偏好 · 即时生效</span>
                <Switch
                  checked={settings.launchAtLogin}
                  disabled={!loaded}
                  onChange={async (checked) => {
                    try {
                      await postSettings({ launchAtLogin: checked })
                      message.success(checked ? '已开启开机自启' : '已关闭开机自启')
                    } catch {
                      message.error('更新开机自启失败，请重试')
                    }
                  }}
                />
              </div>
            </Card>

            <Card variant="borderless" className={styles.prefCard}>
              <div className={styles.prefCardHead}>
                <span className={styles.prefCardIcon}>
                  <RocketOutlined />
                </span>
                <Tag className={styles.prefTagMuted}>应用</Tag>
              </div>
              <div className={styles.prefCardBody}>
                <span className={styles.prefCardTitle}>运行环境</span>
                <p className={styles.prefCardDesc}>
                  配置与密钥仅写入本机 Electron userData，不参与遥测或云端同步
                </p>
              </div>
              <div className={styles.prefCardFooter}>
                <span className={styles.prefCardMeta}>本地优先</span>
                <Tag className={styles.localTag}>已隔离</Tag>
              </div>
            </Card>
          </div>
        ) : null}

        {tab === 'channels' ? <ChannelStatusPanel key="channels" /> : null}
      </div>
    </div>
  )
}
