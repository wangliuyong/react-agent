import type { CSSProperties } from 'react'
import {
  DEFAULT_CONNECTION,
  DEFAULT_ROLE_PROMPT_OVERRIDES,
  queryAllProviderOptions,
  queryIsChatPipelineRole,
  queryProviderCredentialsFromSettings,
  querySyncConnectionsProviderCredentials,
  type AgentRoleToolInjection,
  type CustomAgentRole,
  type ModelConnection,
  type ModelRoleKey,
  type RoleModelMap,
  type RolePromptOverrides,
  type RoleSkillIds,
  type RoleToolWhitelistOverrides
} from '@shared/types'
import {
  queryIsBuiltinRoleTask,
  queryIsCustomAgentRoleId,
  queryPostCustomAgentRoleId,
  queryRoleTaskCardMetaList
} from '@shared/agent-role-registry'
import { useSettingsStore } from '../../hooks/useSettingsStore'
import { useSkillsStore } from '@/features/skills'
import { queryAgentToolsCatalog } from '../../api'
import { AddCustomRoleModal } from '../AddCustomRoleModal'
import { EditModelConnectionModal } from '../EditModelConnectionModal'
import { EditRoleTaskModal } from '../EditRoleTaskModal'
import {
  queryCapabilityLabel,
  queryNewConnectionId,
  queryRolePromptPlaceholder
} from './connectionPanelShared'
import cardStyles from '@/components/entity-card'
import styles from './ModelConnectionsPanel.module.css'

const { Text, Title } = Typography
const { confirm } = Modal

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
  const [roleToolWhitelistOverrides, setRoleToolWhitelistOverrides] =
    useState<RoleToolWhitelistOverrides>(settings.roleToolWhitelistOverrides ?? {})
  const [roleSkillIds, setRoleSkillIds] = useState<RoleSkillIds>(settings.roleSkillIds ?? {})
  const [customAgentRoles, setCustomAgentRoles] = useState<CustomAgentRole[]>(
    settings.customAgentRoles ?? []
  )
  const [roleInjections, setRoleInjections] = useState<AgentRoleToolInjection[]>([])
  const [editingConnection, setEditingConnection] = useState<ModelConnection | null>(null)
  const [editingRole, setEditingRole] = useState<ModelRoleKey | null>(null)
  const [addingRole, setAddingRole] = useState(false)
  const skills = useSkillsStore((s) => s.skills)
  const hydrateSkills = useSkillsStore((s) => s.hydrate)

  const customSkillOptions = useMemo(
    () =>
      skills
        .filter((s) => !s.isBuiltin)
        .map((s) => ({ value: s.id, label: s.name })),
    [skills]
  )

  useEffect(() => {
    void hydrateSkills()
  }, [hydrateSkills])

  const providerLabelById = useMemo(() => {
    const map = new Map<string, string>()
    for (const option of queryAllProviderOptions(settings.customProviders ?? [])) {
      map.set(option.value, option.label)
    }
    return map
  }, [settings.customProviders])

  const injectionByRole = useMemo(() => {
    const map = new Map<string, AgentRoleToolInjection>()
    for (const row of roleInjections) map.set(row.role, row)
    return map
  }, [roleInjections])

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
    setRoleToolWhitelistOverrides(settings.roleToolWhitelistOverrides ?? {})
    setRoleSkillIds(settings.roleSkillIds ?? {})
    setCustomAgentRoles(settings.customAgentRoles ?? [])
  }, [
    settings.connections,
    settings.defaultConnectionId,
    settings.roleModelMap,
    settings.rolePromptOverrides,
    settings.roleToolWhitelistOverrides,
    settings.roleSkillIds,
    settings.customAgentRoles,
    settings.apiKey,
    settings.provider,
    settings.baseUrl,
    settings.model,
    settings.customProviders
  ])

  useEffect(() => {
    let cancelled = false
    void queryAgentToolsCatalog()
      .then((catalog) => {
        if (!cancelled) setRoleInjections(catalog.roleInjections)
      })
      .catch(() => {
        if (!cancelled) setRoleInjections([])
      })
    return () => {
      cancelled = true
    }
  }, [settings.roleToolWhitelistOverrides, settings.customAgentRoles])

  const roleTaskCards = useMemo(
    () => queryRoleTaskCardMetaList({ customAgentRoles }),
    [customAgentRoles]
  )

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
        rolePromptOverrides,
        roleToolWhitelistOverrides,
        roleSkillIds,
        customAgentRoles
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

  const queryRoleToolSummary = (role: ModelRoleKey): string => {
    if (!queryIsChatPipelineRole(role)) return ''
    const customized = Object.prototype.hasOwnProperty.call(roleToolWhitelistOverrides, role)
    const override = roleToolWhitelistOverrides[role]
    if (customized) {
      if (override === null) return '工具：全量（已自定义）'
      return `工具：${override?.length ?? 0} 项（已自定义）`
    }
    const inj = injectionByRole.get(role)
    if (!inj) return '工具：默认'
    if (inj.mode === 'all') return '工具：全量（默认）'
    return `工具：${inj.toolNames.length} 项（默认）`
  }

  const editingRoleMeta = roleTaskCards.find((item) => item.value === editingRole)
  const editingInjection = editingRole ? injectionByRole.get(editingRole) : undefined
  const editingCustomRole = editingRole
    ? customAgentRoles.find((r) => r.id === editingRole)
    : undefined

  const handleDeleteEditingRole = (): void => {
    if (!editingRole || queryIsBuiltinRoleTask(editingRole)) return
    const label = editingRoleMeta?.label ?? editingRole
    confirm({
      title: `删除角色「${label}」？`,
      content: '将移除该自定义角色及其模型映射、工具注入配置。内置角色不可删除。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        const roleId = editingRole
        setCustomAgentRoles((prev) => prev.filter((r) => r.id !== roleId))
        setRoleModelMap((prev) => {
          const next = { ...prev }
          delete next[roleId]
          return next
        })
        setRolePromptOverrides((prev) => {
          const next = { ...prev }
          delete next[roleId]
          return next
        })
        setRoleToolWhitelistOverrides((prev) => {
          const next = { ...prev }
          delete next[roleId]
          return next
        })
        setRoleSkillIds((prev) => {
          const next = { ...prev }
          delete next[roleId]
          return next
        })
        setEditingRole(null)
        message.success('已删除角色（请点击「保存连接」落盘）')
      }
    })
  }

  /** 弹窗展示的「当前生效」名单：优先本地未保存覆盖，否则目录里的解析结果 */
  const queryEditingEffectiveTools = (): string[] | null | undefined => {
    if (!editingRole || !queryIsChatPipelineRole(editingRole)) return undefined
    if (Object.prototype.hasOwnProperty.call(roleToolWhitelistOverrides, editingRole)) {
      return roleToolWhitelistOverrides[editingRole] ?? null
    }
    if (!editingInjection) return null
    if (editingInjection.mode === 'all') return null
    return editingInjection.toolNames
  }

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

      <div className={cardStyles.grid}>
        {connections.map((conn, index) => {
          const isDefault = defaultConnectionId === conn.id
          const providerLabel = providerLabelById.get(conn.provider) ?? conn.provider

          return (
            <Card
              key={conn.id}
              variant="borderless"
              className={`${cardStyles.card} ${isDefault ? cardStyles.cardActive : ''}`}
              style={{ '--card-index': index } as CSSProperties}
            >
              <div className={cardStyles.cardHead}>
                <div className={cardStyles.cardTitleBlock}>
                  <Text className={cardStyles.cardTitle} ellipsis={{ tooltip: conn.label }}>
                    {conn.label}
                  </Text>
                </div>
                <div className={cardStyles.cardActions}>
                  {!isDefault ? (
                    <Tooltip title="设为默认">
                      <Button
                        type="text"
                        size="small"
                        className={cardStyles.actionBtn}
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
                      className={cardStyles.actionBtn}
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
                      className={cardStyles.actionBtn}
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

              <div className={cardStyles.cardBody}>
                <div className={cardStyles.metaRow}>
                  <Text type="secondary" className={cardStyles.metaLabel}>
                    供应商
                  </Text>
                  <Text
                    className={cardStyles.metaValue}
                    ellipsis={{ tooltip: providerLabel }}
                  >
                    {providerLabel}
                  </Text>
                </div>
                <div className={cardStyles.metaRow}>
                  <Text type="secondary" className={cardStyles.metaLabel}>
                    模型
                  </Text>
                  <Text
                    className={cardStyles.metaValue}
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
          <div>
            <Title level={5} className={styles.title}>
              角色 / 任务 → 模型
            </Title>
            <Text type="secondary" className={styles.desc}>
              Supervisor 路由到角色后使用对应连接；可添加自定义角色（内置不可删）
            </Text>
          </div>
          <Button type="dashed" icon={<PlusOutlined />} onClick={() => setAddingRole(true)}>
            添加角色
          </Button>
        </div>
        <div className={styles.roleGrid}>
          {roleTaskCards.map((role, index) => {
            const mappedId = roleModelMap[role.value]
            const currentPrompt = rolePromptOverrides[role.value]?.trim() ?? ''
            const defaultPrompt = DEFAULT_ROLE_PROMPT_OVERRIDES[role.value]?.trim() ?? ''
            const hasOverride = Boolean(currentPrompt) && currentPrompt !== defaultPrompt
            const toolSummary = queryRoleToolSummary(role.value)
            const toolsCustomized = Object.prototype.hasOwnProperty.call(
              roleToolWhitelistOverrides,
              role.value
            )
            const linkedSkills = roleSkillIds[role.value] ?? []

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
                {toolSummary ? (
                  <Text type="secondary" className={styles.roleToolMeta}>
                    {toolSummary}
                  </Text>
                ) : null}
                <div className={styles.roleTags}>
                  {!role.builtin ? (
                    <Tag className={styles.customPromptTag}>自定义角色</Tag>
                  ) : null}
                  {hasOverride ? (
                    <Tag className={styles.customPromptTag}>已自定义设定</Tag>
                  ) : null}
                  {toolsCustomized ? (
                    <Tag className={styles.customPromptTag}>已自定义工具</Tag>
                  ) : null}
                  {linkedSkills.length > 0 ? (
                    <Tag className={styles.customPromptTag}>技能 {linkedSkills.length}</Tag>
                  ) : null}
                </div>
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
        customSystemPrompt={editingCustomRole?.systemPrompt}
        toolWhitelist={queryEditingEffectiveTools()}
        defaultToolWhitelist={
          editingInjection
            ? editingInjection.defaultToolNames === undefined
              ? null
              : editingInjection.defaultToolNames
            : editingCustomRole
              ? editingCustomRole.toolWhitelist
              : null
        }
        toolWhitelistCustomized={Boolean(
          editingRole &&
            Object.prototype.hasOwnProperty.call(roleToolWhitelistOverrides, editingRole)
        )}
        skillIds={editingRole ? roleSkillIds[editingRole] ?? [] : []}
        skillOptions={customSkillOptions}
        connections={connections}
        canDeleteRole={Boolean(editingRole && queryIsCustomAgentRoleId(editingRole))}
        onCancel={() => setEditingRole(null)}
        onDelete={handleDeleteEditingRole}
        onSubmit={({ connectionId, promptOverride, toolWhitelist, skillIds, customSystemPrompt }) => {
          if (!editingRole) return
          setRoleModelMap((prev) => {
            const next = { ...prev }
            if (!connectionId) delete next[editingRole]
            else next[editingRole] = connectionId
            return next
          })
          setRolePromptOverrides((prev) => {
            const next = { ...prev }
            if (!promptOverride) next[editingRole] = ''
            else next[editingRole] = promptOverride
            return next
          })
          if (toolWhitelist !== undefined && queryIsChatPipelineRole(editingRole)) {
            setRoleToolWhitelistOverrides((prev) => {
              const next = { ...prev }
              if (toolWhitelist === 'default') {
                delete next[editingRole]
              } else {
                next[editingRole] = toolWhitelist
              }
              return next
            })
          }
          if (skillIds !== undefined && queryIsChatPipelineRole(editingRole)) {
            setRoleSkillIds((prev) => {
              const next = { ...prev }
              if (!skillIds.length) delete next[editingRole]
              else next[editingRole] = skillIds
              return next
            })
          }
          if (
            customSystemPrompt !== undefined &&
            queryIsCustomAgentRoleId(editingRole)
          ) {
            setCustomAgentRoles((prev) =>
              prev.map((r) =>
                r.id === editingRole
                  ? {
                      ...r,
                      systemPrompt: customSystemPrompt || r.systemPrompt,
                      updatedAt: Date.now()
                    }
                  : r
              )
            )
          }
          setEditingRole(null)
        }}
      />

      <AddCustomRoleModal
        open={addingRole}
        onCancel={() => setAddingRole(false)}
        onSubmit={(payload) => {
          const id = queryPostCustomAgentRoleId(
            payload.label,
            customAgentRoles.map((r) => r.id)
          ) as CustomAgentRole['id']
          const now = Date.now()
          const created: CustomAgentRole = {
            id,
            label: payload.label,
            description: payload.description,
            systemPrompt: payload.systemPrompt,
            toolWhitelist: payload.toolWhitelist,
            createdAt: now,
            updatedAt: now
          }
          setCustomAgentRoles((prev) => [...prev, created])
          setAddingRole(false)
          setEditingRole(id)
          message.success('已添加角色（请点击「保存连接」落盘）')
        }}
      />
    </div>
  )
}
