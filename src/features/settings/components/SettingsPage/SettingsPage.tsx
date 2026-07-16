import {
  MODEL_PROVIDER_OPTIONS,
  queryModelOptions,
  queryProviderOption,
  type AppSettings,
  type ModelOption,
  type ModelProvider
} from '@shared/types'
import { useSettingsStore } from '../../hooks/useSettingsStore'
import { ChannelStatusPanel } from '../ChannelStatusPanel'
import styles from './SettingsPage.module.css'
import {
  queryProviderSwitchFormValues,
  querySettingsFormValues,
  queryShouldSyncSettingsForm,
  type ProviderFormDraftMap
} from './settingsFormSync'
import { BASE_URL_RULES, MODEL_RULES, PROVIDER_RULES } from './settingsValidation'

const { Title, Paragraph, Text } = Typography

export function SettingsPage(): React.ReactElement {
  const settings = useSettingsStore((s) => s.settings)
  const loaded = useSettingsStore((s) => s.loaded)
  const postSettings = useSettingsStore((s) => s.postSettings)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm<AppSettings>()
  const [selectedProvider, setSelectedProvider] = useState<ModelProvider>(settings.provider)
  /** DeepSeek 平台动态模型；null 表示使用静态兜底 */
  const [remoteModels, setRemoteModels] = useState<ModelOption[] | null>(null)
  const [modelsLoading, setModelsLoading] = useState(false)
  /**
   * 按供应商缓存表单草稿：切换时暂存当前输入，切回时可恢复，
   * 避免「已配置 API Key 被清空」且无法回显。
   */
  const providerDraftsRef = useRef<ProviderFormDraftMap>({})
  /** 监听草稿密钥与地址，输入后即可拉取平台模型，无需先保存 */
  const watchedApiKey = Form.useWatch('apiKey', form)
  const watchedBaseUrl = Form.useWatch('baseUrl', form)
  const providerOption = queryProviderOption(selectedProvider)

  /**
   * 为什么：供应商切换需要 Form.useForm + setFieldsValue；
   * 但 FormInstance 会保留首次挂载时的值，hydrate 后仅靠 initialValues / remount key 无法可靠回显。
   * 因此在本地配置加载完成后显式写入表单，并同步供应商本地状态。
   */
  useEffect(() => {
    if (!queryShouldSyncSettingsForm(loaded)) return
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

  /**
   * DeepSeek 默认模型列表从平台 /models 拉取；
   * 使用表单草稿 Key / Base URL，便于保存前即可预览可选模型。
   * 防抖避免输入 API Key 时频繁打平台接口。
   */
  useEffect(() => {
    if (!loaded || selectedProvider !== 'deepseek') {
      setRemoteModels(null)
      setModelsLoading(false)
      return
    }

    const apiKey = String(watchedApiKey ?? settings.apiKey).trim()
    const baseUrl = String(watchedBaseUrl ?? settings.baseUrl).trim()
    if (!apiKey) {
      setRemoteModels(null)
      setModelsLoading(false)
      return
    }

    let cancelled = false
    const timer = window.setTimeout(() => {
      setModelsLoading(true)
      void window.api
        .queryProviderModels({ provider: 'deepseek', apiKey, baseUrl })
        .then((models) => {
          if (!cancelled && models.length > 0) setRemoteModels(models)
        })
        .catch(() => {
          if (!cancelled) setRemoteModels(null)
        })
        .finally(() => {
          if (!cancelled) setModelsLoading(false)
        })
    }, 400)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [
    loaded,
    selectedProvider,
    watchedApiKey,
    watchedBaseUrl,
    settings.apiKey,
    settings.baseUrl
  ])

  /** 若用户曾保存自定义 model id，合并进选项避免 Select 显示异常 */
  const modelSelectOptions = useMemo(() => {
    const providerModels = remoteModels ?? queryModelOptions(selectedProvider)
    const options = providerModels.map((m) => ({
      value: m.value,
      label: m.description ? `${m.label} — ${m.description}` : m.label
    }))
    if (
      selectedProvider === settings.provider &&
      !providerModels.some((m) => m.value === settings.model)
    ) {
      options.unshift({ value: settings.model, label: settings.model })
    }
    return options
  }, [selectedProvider, settings.model, settings.provider, remoteModels])

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

      <div className={styles.body}>
        <div className={styles.formCard}>
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
            <Tag className={styles.providerTag}>{providerOption.label}</Tag>
          </div>

          {!loaded ? (
            <div className={styles.formLoading}>
              <Spin />
              <Text type="secondary">正在加载本机配置…</Text>
            </div>
          ) : (
            <Form
              form={form}
              layout="vertical"
              initialValues={settings}
              className={styles.form}
              onFinish={async (values: typeof settings) => {
                setSaving(true)
                try {
                  await postSettings(values)
                  message.success('设置已保存')
                } finally {
                  setSaving(false)
                }
              }}
            >
              <div className={styles.formGrid}>
                <Form.Item label="模型供应商" name="provider" rules={PROVIDER_RULES}>
                  <Select
                    options={MODEL_PROVIDER_OPTIONS.map((option) => ({
                      value: option.value,
                      label: option.label
                    }))}
                    onChange={(provider: ModelProvider) => {
                      // 离开当前供应商前先缓存草稿，切回时才能回显未保存输入
                      const current = form.getFieldsValue()
                      providerDraftsRef.current[selectedProvider] = {
                        apiKey: String(current.apiKey ?? ''),
                        baseUrl: String(current.baseUrl ?? ''),
                        model: String(current.model ?? '')
                      }
                      const nextValues = queryProviderSwitchFormValues(
                        provider,
                        settings,
                        providerDraftsRef.current
                      )
                      setSelectedProvider(provider)
                      form.setFieldsValue(nextValues)
                    }}
                  />
                </Form.Item>

                <Form.Item
                  className={styles.fullWidth}
                  label={providerOption.apiKeyLabel}
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
                  label="默认模型"
                  name="model"
                  rules={MODEL_RULES}
                  extra={
                    selectedProvider === 'deepseek'
                      ? '选项来自 DeepSeek 平台 /models，填写 API Key 后自动刷新'
                      : undefined
                  }
                >
                  <Select
                    showSearch
                    optionFilterProp="label"
                    options={modelSelectOptions}
                    placeholder="选择模型"
                    loading={modelsLoading}
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
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<CheckCircleOutlined />}
                  loading={saving}
                  className={styles.saveButton}
                >
                  保存设置
                </Button>
              </div>
            </Form>
          )}
        </div>

        {/* 应用行为：开机自启独立于模型表单，切换后立即生效 */}
        <div className={`${styles.formCard} ${styles.secondaryCard}`}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeading}>
              <span className={styles.cardIcon}>
                <RocketOutlined />
              </span>
              <div>
                <Title level={4} className={styles.cardTitle}>
                  应用与启动
                </Title>
                <Text type="secondary" className={styles.cardDesc}>
                  控制应用在本机的启动行为
                </Text>
              </div>
            </div>
          </div>

          <div className={styles.generalBody}>
            <div className={styles.permissionRow}>
              <span className={styles.permissionIcon}>
                <PoweroffOutlined />
              </span>
              <div className={styles.permissionContent}>
                <Text strong>开机自启</Text>
                <Text type="secondary">
                  登录 macOS / Windows 后自动启动灵犀，便于后台定时任务与渠道保持在线
                </Text>
              </div>
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
          </div>
        </div>

        <ChannelStatusPanel />
      </div>
    </div>
  )
}
