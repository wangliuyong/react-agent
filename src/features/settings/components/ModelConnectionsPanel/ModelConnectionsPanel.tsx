import type { CSSProperties } from 'react'
import {
  DEFAULT_CONNECTION,
  queryModelOptionDisplayLabel,
  queryModelOptions,
  queryProviderOption,
  type ModelCapability,
  type ModelConnection,
  type ModelOption,
  type ModelProvider,
  type ModelRoleKey,
  type RoleModelMap
} from '@shared/types'
import { useSettingsStore } from '../../hooks/useSettingsStore'
import styles from './ModelConnectionsPanel.module.css'

const { Text, Title } = Typography

const CAPABILITY_OPTIONS: { value: ModelCapability; label: string }[] = [
  { value: 'chat', label: '对话' },
  { value: 'reasoning', label: '推理' },
  { value: 'vision', label: '视觉' },
  { value: 'longContext', label: '长上下文' },
  { value: 'creative', label: '创作' }
]

const ROLE_OPTIONS: { value: ModelRoleKey; label: string }[] = [
  { value: 'general', label: '通用助手' },
  { value: 'researcher', label: '调研员' },
  { value: 'writer', label: '撰稿人' },
  { value: 'publisher', label: '发布员' },
  { value: 'scriptwriter', label: '编剧' },
  { value: 'videographer', label: '视频制作' },
  { value: 'editor', label: '剪辑师' },
  { value: 'script', label: '剧本任务' },
  { value: 'storyboard', label: '分镜任务' },
  { value: 'video', label: '视频任务' }
]

const PROVIDER_OPTIONS: { value: ModelProvider; label: string }[] = [
  { value: 'dashscope', label: '阿里云百炼' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'openai_compatible', label: 'OpenAI 兼容' }
]

function queryNewConnectionId(): string {
  return `conn-${Date.now().toString(36)}`
}

/** 同一供应商 + Base URL + Key 共用一份平台模型缓存 */
function queryModelsCacheKey(conn: Pick<ModelConnection, 'provider' | 'baseUrl' | 'apiKey'>): string {
  return `${conn.provider}|${conn.baseUrl.trim()}|${conn.apiKey.trim()}`
}

function querySelectOptions(
  models: ModelOption[],
  currentModel: string,
  provider: ModelProvider
): { value: string; label: string }[] {
  const options = models.map((m) => ({
    value: m.value,
    label: queryModelOptionDisplayLabel(m)
  }))
  if (currentModel && !models.some((m) => m.value === currentModel)) {
    options.unshift({
      value: currentModel,
      label: queryModelOptionDisplayLabel({
        provider,
        value: currentModel,
        label: currentModel
      })
    })
  }
  return options
}

/**
 * 多模型连接与角色映射配置面板。
 * 本地草稿编辑，保存时一次性写入，避免逐键击打 IPC。
 * 模型下拉优先走供应商平台 /models（百炼 / DeepSeek 等）。
 */
export function ModelConnectionsPanel(): React.ReactElement {
  const settings = useSettingsStore((s) => s.settings)
  const postSettings = useSettingsStore((s) => s.postSettings)
  const [saving, setSaving] = useState(false)
  const [connections, setConnections] = useState<ModelConnection[]>(
    settings.connections?.length ? settings.connections : [{ ...DEFAULT_CONNECTION }]
  )
  const [defaultConnectionId, setDefaultConnectionId] = useState(
    settings.defaultConnectionId || connections[0]?.id
  )
  const [roleModelMap, setRoleModelMap] = useState<RoleModelMap>(
    settings.roleModelMap ?? {}
  )
  /** cacheKey → 平台模型列表；null 表示拉取失败，回退静态 */
  const [modelsByKey, setModelsByKey] = useState<Record<string, ModelOption[] | null>>({})
  const [loadingKeys, setLoadingKeys] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setConnections(
      settings.connections?.length ? settings.connections : [{ ...DEFAULT_CONNECTION }]
    )
    setDefaultConnectionId(settings.defaultConnectionId)
    setRoleModelMap(settings.roleModelMap ?? {})
  }, [settings.connections, settings.defaultConnectionId, settings.roleModelMap])

  /**
   * 按连接凭证去重后拉取 /models；无 Key 时不请求，下拉用静态兜底。
   */
  useEffect(() => {
    const unique = new Map<string, ModelConnection>()
    for (const conn of connections) {
      if (!conn.apiKey.trim()) continue
      const key = queryModelsCacheKey(conn)
      if (!unique.has(key)) unique.set(key, conn)
    }

    const controllers: Array<() => void> = []
    for (const [cacheKey, conn] of unique) {
      // 已成功或已失败（null）都不再重复打；仅未请求过的 key 才拉
      if (cacheKey in modelsByKey || loadingKeys[cacheKey]) continue

      let cancelled = false
      setLoadingKeys((prev) => ({ ...prev, [cacheKey]: true }))
      const timer = window.setTimeout(() => {
        void window.api
          .queryProviderModels({
            provider: conn.provider,
            apiKey: conn.apiKey,
            baseUrl: conn.baseUrl || queryProviderOption(conn.provider).defaultBaseUrl
          })
          .then((models) => {
            if (!cancelled) {
              setModelsByKey((prev) => ({
                ...prev,
                [cacheKey]: models.length > 0 ? models : null
              }))
            }
          })
          .catch(() => {
            if (!cancelled) {
              setModelsByKey((prev) => ({ ...prev, [cacheKey]: null }))
            }
          })
          .finally(() => {
            if (!cancelled) {
              setLoadingKeys((prev) => ({ ...prev, [cacheKey]: false }))
            }
          })
      }, 350)

      controllers.push(() => {
        cancelled = true
        window.clearTimeout(timer)
      })
    }

    return () => {
      for (const cancel of controllers) cancel()
    }
    // 仅在凭证集合变化时拉取；modelsByKey / loadingKeys 不放入依赖以免循环
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    connections
      .map((c) => `${c.id}:${c.provider}:${c.baseUrl}:${c.apiKey.trim() ? '1' : '0'}:${c.apiKey}`)
      .join('|')
  ])

  const handleSave = async (): Promise<void> => {
    if (connections.length === 0) {
      message.warning('至少保留一条模型连接')
      return
    }
    setSaving(true)
    try {
      await postSettings({
        connections,
        defaultConnectionId: defaultConnectionId || connections[0].id,
        roleModelMap
      })
      message.success('模型连接已保存')
    } catch (err) {
      message.error(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleFieldChange = (
    id: string,
    field: keyof ModelConnection,
    value: unknown
  ): void => {
    setConnections((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c
        const next = { ...c, [field]: value }
        // 切换供应商时同步默认 Base URL，并清掉模型缓存依赖
        if (field === 'provider') {
          const meta = queryProviderOption(value as ModelProvider)
          next.baseUrl = meta.defaultBaseUrl
          next.model = meta.defaultModel
        }
        return next
      })
    )
  }

  return (
    <div className={styles.panel}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarText}>
          <Title level={5} className={styles.title}>
            模型连接
          </Title>
          <Text type="secondary" className={styles.desc}>
            Agent 按角色自动选型；模型列表来自平台 /models，填写 API Key 后自动刷新
          </Text>
        </div>
        <Space wrap>
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={() =>
              setConnections((prev) => [
                ...prev,
                {
                  ...DEFAULT_CONNECTION,
                  id: queryNewConnectionId(),
                  label: `连接 ${prev.length + 1}`,
                  apiKey: ''
                }
              ])
            }
          >
            添加连接
          </Button>
          <Button type="primary" loading={saving} onClick={() => void handleSave()}>
            保存连接
          </Button>
        </Space>
      </div>

      <div className={styles.grid}>
        {connections.map((conn, index) => {
          const cacheKey = queryModelsCacheKey(conn)
          const remote = conn.apiKey.trim() ? modelsByKey[cacheKey] : null
          const modelOptions = querySelectOptions(
            remote ?? queryModelOptions(conn.provider),
            conn.model,
            conn.provider
          )
          const modelsLoading = Boolean(loadingKeys[cacheKey])

          return (
            <Card
              key={conn.id}
              variant="borderless"
              className={styles.card}
              style={{ '--card-index': index } as CSSProperties}
            >
              <div className={styles.cardHead}>
                <Input
                  value={conn.label}
                  onChange={(e) => handleFieldChange(conn.id, 'label', e.target.value)}
                  placeholder="连接名称"
                  className={styles.labelInput}
                />
                <Space size={4}>
                  {defaultConnectionId === conn.id ? (
                    <Tag className={styles.defaultTag}>默认</Tag>
                  ) : (
                    <Button
                      type="link"
                      size="small"
                      onClick={() => setDefaultConnectionId(conn.id)}
                    >
                      设为默认
                    </Button>
                  )}
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    disabled={connections.length <= 1}
                    onClick={() => {
                      setConnections((prev) => {
                        const next = prev.filter((c) => c.id !== conn.id)
                        if (defaultConnectionId === conn.id && next[0]) {
                          setDefaultConnectionId(next[0].id)
                        }
                        return next
                      })
                    }}
                  />
                </Space>
              </div>

              <div className={styles.fields}>
                <div>
                  <Text type="secondary" className={styles.fieldLabel}>
                    供应商
                  </Text>
                  <Select
                    style={{ width: '100%' }}
                    value={conn.provider}
                    options={PROVIDER_OPTIONS}
                    onChange={(v) => handleFieldChange(conn.id, 'provider', v)}
                  />
                </div>
                <div>
                  <Text type="secondary" className={styles.fieldLabel}>
                    模型
                  </Text>
                  <Select
                    showSearch
                    allowClear={false}
                    optionFilterProp="label"
                    style={{ width: '100%' }}
                    value={conn.model || undefined}
                    options={modelOptions}
                    loading={modelsLoading}
                    placeholder={conn.apiKey.trim() ? '从平台选择模型' : '先填写 API Key'}
                    onChange={(v) => handleFieldChange(conn.id, 'model', v)}
                  />
                </div>
                <div className={styles.span2}>
                  <Text type="secondary" className={styles.fieldLabel}>
                    Base URL
                  </Text>
                  <Input
                    value={conn.baseUrl}
                    onChange={(e) => handleFieldChange(conn.id, 'baseUrl', e.target.value)}
                  />
                </div>
                <div className={styles.span2}>
                  <Text type="secondary" className={styles.fieldLabel}>
                    API Key
                  </Text>
                  <Input.Password
                    value={conn.apiKey}
                    onChange={(e) => handleFieldChange(conn.id, 'apiKey', e.target.value)}
                    placeholder="仅存本机"
                  />
                </div>
                <div className={styles.span2}>
                  <Text type="secondary" className={styles.fieldLabel}>
                    能力标签
                  </Text>
                  <Select
                    mode="multiple"
                    style={{ width: '100%' }}
                    value={conn.capabilities}
                    options={CAPABILITY_OPTIONS}
                    onChange={(v) => handleFieldChange(conn.id, 'capabilities', v)}
                  />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <div className={styles.roleSection}>
        <div className={styles.roleHeader}>
          <Title level={5} className={styles.title}>
            角色 / 任务 → 模型
          </Title>
          <Text type="secondary" className={styles.desc}>
            Supervisor 路由到角色后使用对应连接；清空某一项会恢复该角色的推荐映射
          </Text>
        </div>
        <div className={styles.roleGrid}>
          {ROLE_OPTIONS.map((role) => (
            <div key={role.value} className={styles.roleCard}>
              <Text className={styles.roleLabel}>{role.label}</Text>
              <Select
                allowClear
                placeholder="使用默认连接"
                style={{ width: '100%' }}
                value={roleModelMap[role.value]}
                options={connections.map((c) => ({ value: c.id, label: c.label }))}
                onChange={(v) => {
                  setRoleModelMap((prev) => {
                    const next = { ...prev }
                    if (!v) delete next[role.value]
                    else next[role.value] = v
                    return next
                  })
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
