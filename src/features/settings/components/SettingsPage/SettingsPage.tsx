import {
  MODEL_PROVIDER_OPTIONS,
  queryModelOptions,
  queryProviderOption,
  type AppSettings,
  type ModelProvider
} from '@shared/types'
import { useSettingsStore } from '../../hooks/useSettingsStore'
import { ChannelStatusPanel } from '../ChannelStatusPanel'
import styles from './SettingsPage.module.css'
import { BASE_URL_RULES, MODEL_RULES, PROVIDER_RULES } from './settingsValidation'

const { Title, Paragraph, Text } = Typography

export function SettingsPage(): React.ReactElement {
  const settings = useSettingsStore((s) => s.settings)
  const postSettings = useSettingsStore((s) => s.postSettings)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm<AppSettings>()
  const [selectedProvider, setSelectedProvider] = useState<ModelProvider>(settings.provider)
  const providerOption = queryProviderOption(selectedProvider)

  /** 若用户曾保存自定义 model id，合并进选项避免 Select 显示异常 */
  const modelSelectOptions = useMemo(() => {
    const providerModels = queryModelOptions(selectedProvider)
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
  }, [selectedProvider, settings.model, settings.provider])

  /** hydrate 完成后同步供应商，兼容设置页先于本地配置加载的场景。 */
  useEffect(() => {
    setSelectedProvider(settings.provider)
  }, [settings.provider])

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

          <Form
            form={form}
            layout="vertical"
            key={JSON.stringify(settings)}
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
                    const nextProvider = queryProviderOption(provider)
                    setSelectedProvider(provider)
                    /**
                     * 切换供应商时原子更新地址与模型，并清空旧服务密钥，
                     * 防止把百炼密钥误发给 DeepSeek（反之亦然）。
                     */
                    form.setFieldsValue({
                      provider,
                      apiKey: '',
                      baseUrl: nextProvider.defaultBaseUrl,
                      model: nextProvider.defaultModel
                    })
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

              <Form.Item label="默认模型" name="model" rules={MODEL_RULES}>
                <Select
                  showSearch
                  optionFilterProp="label"
                  options={modelSelectOptions}
                  placeholder="选择模型"
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
        </div>

        <ChannelStatusPanel />
      </div>
    </div>
  )
}
