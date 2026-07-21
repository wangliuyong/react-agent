import type { CSSProperties } from 'react'
import {
  DEFAULT_CONNECTION,
  DEFAULT_ROLE_PROMPT_OVERRIDES,
  queryAllProviderOptions,
  queryProviderCredentialsFromSettings,
  querySyncConnectionsProviderCredentials,
  type ModelConnection,
  type ModelRoleKey,
  type RoleModelMap,
  type RolePromptOverrides
} from '@shared/types'
import { useSettingsStore } from '../../hooks/useSettingsStore'
import { EditModelConnectionModal } from '../EditModelConnectionModal'
import { EditRoleTaskModal } from '../EditRoleTaskModal'
import {
  queryCapabilityLabel,
  queryNewConnectionId,
  queryRolePromptPlaceholder,
  ROLE_TASK_META
} from './connectionPanelShared'
import styles from './ModelConnectionsPanel.module.css'

const { Text, Title } = Typography

/**
 * 多模型连接与角色映射配置面板。
 * 卡片仅展示摘要，编辑通过弹窗维护；保存时一次性写入，避免逐键击打 IPC。
 */
export function ModelConnectionsPanel(): React.ReactElement {
  const settings = useSettingsStore((s) => s.settings)
  const postSettings = useSettingsStore((s) => s.postSettings)
  const [saving, setSaving] = useState(false)
  const [connections, setConnections] = useState<ModelConnection[]>(
    querySyncConnectionsProviderCredentials(
      settings.connections?.length ? settings.connections : [{ ...DEFAULT_CONNECTION }],
      settings
    )
  )
  const [defaultConnectionId, setDefaultConnectionId] = useState(
    settings.defaultConnectionId || connections[0]?.id
  )
  const [roleModelMap, setRoleModelMap] = useState<RoleModelMap>(
    settings.roleModelMap ?? {}
  )
  const [rolePromptOverrides, setRolePromptOverrides] = useState<RolePromptOverrides>(
    settings.rolePromptOverrides ?? {}
  )
  const [editingConnection, setEditingConnection] = useState<ModelConnection | null>(null)
  const [editingRole, setEditingRole] = useState<ModelRoleKey | null>(null)

  const providerLabelById = useMemo(() => {
    const map = new Map<string, string>()
    for (const option of queryAllProviderOptions(settings.customProviders ?? [])) {
      map.set(option.value, option.label)
    }
    return map
  }, [settings.customProviders])

  useEffect(() => {
    setConnections(
      querySyncConnectionsProviderCredentials(
        settings.connections?.length ? settings.connections : [{ ...DEFAULT_CONNECTION }],
        settings
      )
    )
    setDefaultConnectionId(settings.defaultConnectionId)
    setRoleModelMap(settings.roleModelMap ?? {})
    setRolePromptOverrides(settings.rolePromptOverrides ?? {})
  }, [
    settings.connections,
    settings.defaultConnectionId,
    settings.roleModelMap,
    settings.rolePromptOverrides,
    settings.apiKey,
    settings.provider,
    settings.baseUrl,
    settings.model,
    settings.customProviders
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
        roleModelMap,
        rolePromptOverrides
      })
      message.success('模型连接已保存')
    } catch (err) {
      message.error(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const queryConnectionLabel = (id?: string): string => {
    if (!id) return '默认连接'
    return connections.find((c) => c.id === id)?.label ?? '默认连接'
  }

  const editingRoleMeta = ROLE_TASK_META.find((item) => item.value === editingRole)

  return (
    <div className={styles.panel}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarText}>
          <Title level={5} className={styles.title}>
            模型连接
          </Title>
          <Text type="secondary" className={styles.desc}>
            Agent 按角色自动选型；请在「模型与 API」中配置凭证，点击卡片或编辑按钮维护连接
          </Text>
        </div>
        <Space wrap>
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={() => {
              const creds = queryProviderCredentialsFromSettings(settings, settings.provider)
              setEditingConnection({
                ...DEFAULT_CONNECTION,
                id: queryNewConnectionId(),
                label: `连接 ${connections.length + 1}`,
                provider: settings.provider,
                apiKey: creds.apiKey,
                baseUrl: creds.baseUrl,
                model: creds.model
              })
            }}
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
          const isDefault = defaultConnectionId === conn.id
          const providerLabel = providerLabelById.get(conn.provider) ?? conn.provider

          return (
            <Card
              key={conn.id}
              variant="borderless"
              className={`${styles.card} ${isDefault ? styles.cardDefault : ''}`}
              style={{ '--card-index': index } as CSSProperties}
            >
              <div className={styles.cardHead}>
                <div className={styles.cardTitleBlock}>
                  <Text className={styles.cardTitle} ellipsis={{ tooltip: conn.label }}>
                    {conn.label}
                  </Text>
                  {/* {isDefault ? <Tag className={styles.defaultTag}>默认</Tag> : null} */}
                </div>
                <div className={styles.cardActions}>
                  {!isDefault ? (
                    <Tooltip title="设为默认">
                      <Button
                        type="text"
                        size="small"
                        className={styles.actionBtn}
                        icon={<StarOutlined />}
                        aria-label={`将 ${conn.label} 设为默认`}
                        onClick={() => setDefaultConnectionId(conn.id)}
                      />
                    </Tooltip>
                  ) : null}
                  <Tooltip title="编辑连接">
                    <Button
                      type="text"
                      size="small"
                      className={styles.actionBtn}
                      icon={<EditOutlined />}
                      aria-label={`编辑 ${conn.label}`}
                      onClick={() => setEditingConnection(conn)}
                    />
                  </Tooltip>
                  <Tooltip title={connections.length <= 1 ? '至少保留一条连接' : '删除连接'}>
                    <Button
                      type="text"
                      danger
                      size="small"
                      className={styles.actionBtn}
                      icon={<DeleteOutlined />}
                      disabled={connections.length <= 1}
                      aria-label={`删除 ${conn.label}`}
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
                  </Tooltip>
                </div>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.metaRow}>
                  <Text type="secondary" className={styles.metaLabel}>
                    供应商
                  </Text>
                  <Text
                    className={styles.metaValue}
                    ellipsis={{ tooltip: providerLabel }}
                  >
                    {providerLabel}
                  </Text>
                </div>
                <div className={styles.metaRow}>
                  <Text type="secondary" className={styles.metaLabel}>
                    模型
                  </Text>
                  <Text
                    className={styles.metaValue}
                    ellipsis={{ tooltip: conn.model || '—' }}
                  >
                    {conn.model || '—'}
                  </Text>
                </div>
                <div className={styles.capabilityRow}>
                  {conn.capabilities.map((cap) => (
                    <Tag key={cap} className={styles.capTag}>
                      {queryCapabilityLabel(cap)}
                    </Tag>
                  ))}
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
            Supervisor 路由到角色后使用对应连接；点击卡片维护角色设定与模型连接
          </Text>
        </div>
        <div className={styles.roleGrid}>
          {ROLE_TASK_META.map((role, index) => {
            const mappedId = roleModelMap[role.value]
            const currentPrompt = rolePromptOverrides[role.value]?.trim() ?? ''
            const defaultPrompt = DEFAULT_ROLE_PROMPT_OVERRIDES[role.value]?.trim() ?? ''
            // 与出厂默认不同才标「已自定义」，避免默认文案也显示自定义标签
            const hasOverride = Boolean(currentPrompt) && currentPrompt !== defaultPrompt

            return (
              <button
                key={role.value}
                type="button"
                className={styles.roleCard}
                style={{ '--card-index': index } as CSSProperties}
                onClick={() => setEditingRole(role.value)}
              >
                <div className={styles.roleCardHead}>
                  <Text className={styles.roleLabel}>{role.label}</Text>
                  <EditOutlined className={styles.roleEditIcon} aria-hidden />
                </div>
                <Text type="secondary" className={styles.roleDesc}>
                  {role.description}
                </Text>
                <div className={styles.roleMeta}>
                  <ClusterOutlined className={styles.roleMetaIcon} aria-hidden />
                  <Text className={styles.roleConnection}>{queryConnectionLabel(mappedId)}</Text>
                </div>
                {hasOverride ? (
                  <Tag className={styles.customPromptTag}>已自定义设定</Tag>
                ) : null}
              </button>
            )
          })}
        </div>
      </div>

      <EditModelConnectionModal
        open={Boolean(editingConnection)}
        connection={editingConnection}
        settings={settings}
        onCancel={() => setEditingConnection(null)}
        onSubmit={(next) => {
          setConnections((prev) => {
            const exists = prev.some((c) => c.id === next.id)
            if (exists) {
              return prev.map((c) => (c.id === next.id ? next : c))
            }
            return [...prev, next]
          })
          if (!defaultConnectionId) {
            setDefaultConnectionId(next.id)
          }
          setEditingConnection(null)
        }}
      />

      <EditRoleTaskModal
        open={Boolean(editingRole)}
        role={editingRole}
        roleLabel={editingRoleMeta?.label ?? ''}
        roleDescription={editingRoleMeta?.description ?? ''}
        connectionId={editingRole ? roleModelMap[editingRole] : undefined}
        promptOverride={editingRole ? rolePromptOverrides[editingRole] : undefined}
        promptPlaceholder={editingRole ? queryRolePromptPlaceholder(editingRole) : undefined}
        connections={connections}
        onCancel={() => setEditingRole(null)}
        onSubmit={({ connectionId, promptOverride }) => {
          if (!editingRole) return
          setRoleModelMap((prev) => {
            const next = { ...prev }
            if (!connectionId) delete next[editingRole]
            else next[editingRole] = connectionId
            return next
          })
          setRolePromptOverrides((prev) => {
            const next = { ...prev }
            // 显式写入空字符串，便于持久化时区分「用户已关闭默认」与「从未配置」
            if (!promptOverride) next[editingRole] = ''
            else next[editingRole] = promptOverride
            return next
          })
          setEditingRole(null)
        }}
      />
    </div>
  )
}
