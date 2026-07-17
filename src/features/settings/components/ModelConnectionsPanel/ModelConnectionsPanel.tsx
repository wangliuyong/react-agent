import type { CSSProperties } from 'react'
import {
  DEFAULT_CONNECTION,
  type ModelCapability,
  type ModelConnection,
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

/**
 * 多模型连接与角色映射配置面板。
 * 本地草稿编辑，保存时一次性写入，避免逐键击打 IPC。
 * 卡片网格气质对齐技能市场。
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

  useEffect(() => {
    setConnections(
      settings.connections?.length ? settings.connections : [{ ...DEFAULT_CONNECTION }]
    )
    setDefaultConnectionId(settings.defaultConnectionId)
    setRoleModelMap(settings.roleModelMap ?? {})
  }, [settings.connections, settings.defaultConnectionId, settings.roleModelMap])

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
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
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
            为不同角色 / 任务绑定不同模型；未映射时使用默认连接
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
        {connections.map((conn, index) => (
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
                <Input
                  value={conn.model}
                  onChange={(e) => handleFieldChange(conn.id, 'model', e.target.value)}
                  placeholder="qwen-plus"
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
        ))}
      </div>

      <div className={styles.roleSection}>
        <div className={styles.roleHeader}>
          <Title level={5} className={styles.title}>
            角色 / 任务 → 模型
          </Title>
          <Text type="secondary" className={styles.desc}>
            未指定时回落到默认连接
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
