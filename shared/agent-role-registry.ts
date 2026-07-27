/**
 * 内置与自定义 Agent 角色注册表（设置页、路由、工具注入共用）。
 */
import type { AppSettings, CustomAgentRole, ModelRoleKey } from './types'

/** 设置页「角色卡片」中的内置项（不可删除） */
export const BUILTIN_ROLE_TASK_IDS = [
  'general',
  'researcher',
  'writer',
  'publisher',
  'scriptwriter',
  'videographer',
  'editor',
  'script',
  'storyboard',
  'video'
] as const satisfies readonly ModelRoleKey[]

export type BuiltinRoleTaskId = (typeof BUILTIN_ROLE_TASK_IDS)[number]

/** 聊天管线内置角色（不含 supervisor；不含 script/storyboard/video 媒体任务） */
export const BUILTIN_CHAT_PIPELINE_ROLE_IDS = [
  'general',
  'researcher',
  'writer',
  'publisher',
  'scriptwriter',
  'videographer',
  'editor'
] as const satisfies readonly ModelRoleKey[]

const BUILTIN_ROLE_TASK_SET = new Set<string>(BUILTIN_ROLE_TASK_IDS)

/** 设置页角色卡片是否为内置（内置不可删除） */
export function queryIsBuiltinRoleTask(roleId: string): boolean {
  return BUILTIN_ROLE_TASK_SET.has(roleId)
}

/** 自定义角色 id 前缀约定 */
export const CUSTOM_AGENT_ROLE_PREFIX = 'custom_'

export function queryIsCustomAgentRoleId(roleId: string): boolean {
  return roleId.startsWith(CUSTOM_AGENT_ROLE_PREFIX)
}

/** 从展示名生成唯一 custom_* id */
export function queryPostCustomAgentRoleId(
  label: string,
  existingIds: Iterable<string>
): CustomAgentRole['id'] {
  const used = new Set(existingIds)
  const base = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32)
  const stem = base || 'role'
  let candidate = `${CUSTOM_AGENT_ROLE_PREFIX}${stem}`
  let n = 2
  while (used.has(candidate)) {
    candidate = `${CUSTOM_AGENT_ROLE_PREFIX}${stem}_${n}`
    n += 1
  }
  return candidate as CustomAgentRole['id']
}

export function queryCustomAgentRole(
  roles: CustomAgentRole[] | undefined,
  id: string
): CustomAgentRole | undefined {
  return roles?.find((r) => r.id === id)
}

export function queryCustomAgentRoleIds(settings: Pick<AppSettings, 'customAgentRoles'>): string[] {
  return (settings.customAgentRoles ?? []).map((r) => r.id)
}

/** 归一化用户保存的自定义角色列表 */
export function queryNormalizeCustomAgentRoles(raw: unknown): CustomAgentRole[] {
  if (!Array.isArray(raw)) return []
  const out: CustomAgentRole[] = []
  const seen = new Set<string>()
  const now = Date.now()
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    let id = String(row.id ?? '').trim()
    if (!queryIsCustomAgentRoleId(id)) {
      id = queryPostCustomAgentRoleId(String(row.label ?? 'role'), seen)
    }
    if (!id || seen.has(id)) continue
    const label = String(row.label ?? id).trim() || id
    const description = String(row.description ?? '').trim()
    const systemPrompt = String(row.systemPrompt ?? '').trim()
    if (!systemPrompt) continue
    let toolWhitelist: string[] | null = null
    if (row.toolWhitelist === null) {
      toolWhitelist = null
    } else if (Array.isArray(row.toolWhitelist)) {
      const names = row.toolWhitelist.map((t) => String(t).trim()).filter(Boolean)
      toolWhitelist = names
    }
    const createdAt = Number(row.createdAt) || now
    const updatedAt = Number(row.updatedAt) || createdAt
    seen.add(id)
    out.push({
      id: id as CustomAgentRole['id'],
      label,
      description,
      systemPrompt,
      toolWhitelist,
      createdAt,
      updatedAt
    })
  }
  return out
}

/** 删除自定义角色时，清理关联设置字段 */
export function queryPruneRoleSettingsForDeletedRole(
  roleId: string,
  patch: {
    roleModelMap: Record<string, string | undefined>
    rolePromptOverrides: Record<string, string | undefined>
    roleToolWhitelistOverrides: Record<string, string[] | null | undefined>
  }
): void {
  delete patch.roleModelMap[roleId]
  delete patch.rolePromptOverrides[roleId]
  delete patch.roleToolWhitelistOverrides[roleId]
}

export interface RoleTaskCardMeta {
  value: ModelRoleKey
  label: string
  description: string
  /** 内置不可删；自定义可删 */
  builtin: boolean
}

/** 设置页角色卡片列表：内置 + 用户自定义 */
export function queryRoleTaskCardMetaList(
  settings: Pick<AppSettings, 'customAgentRoles'>
): RoleTaskCardMeta[] {
  const builtin: RoleTaskCardMeta[] = [
    {
      value: 'general',
      label: '通用助手',
      description: '闲聊、问答、单步工具与通用任务编排',
      builtin: true
    },
    {
      value: 'researcher',
      label: '调研员',
      description: '热点调研、素材收集与配图路径汇总',
      builtin: true
    },
    {
      value: 'writer',
      label: '撰稿人',
      description: '基于调研结果撰写标题、正文与话题标签',
      builtin: true
    },
    {
      value: 'publisher',
      label: '发布员',
      description: '按成稿与配图完成小红书 / 抖音渠道发布',
      builtin: true
    },
    {
      value: 'scriptwriter',
      label: '编剧',
      description: '创意脚本、分镜拆分与提示词精细化',
      builtin: true
    },
    {
      value: 'videographer',
      label: '视频制作',
      description: '场景素材生成、T2I / I2V 渲染与校验',
      builtin: true
    },
    {
      value: 'editor',
      label: '剪辑师',
      description: '音画对齐、粗剪拼接与成片导出',
      builtin: true
    },
    {
      value: 'script',
      label: '剧本任务',
      description: '独立剧本生成任务使用的模型连接',
      builtin: true
    },
    {
      value: 'storyboard',
      label: '分镜任务',
      description: '独立分镜生成任务使用的模型连接',
      builtin: true
    },
    {
      value: 'video',
      label: '视频任务',
      description: '独立视频生成任务使用的模型连接',
      builtin: true
    }
  ]
  const custom: RoleTaskCardMeta[] = (settings.customAgentRoles ?? []).map((r) => ({
    value: r.id as ModelRoleKey,
    label: r.label,
    description: r.description || '用户自定义聊天角色',
    builtin: false
  }))
  return [...builtin, ...custom]
}

/** 角色展示名（内置 + 自定义） */
export function queryAgentRoleLabel(
  role: string,
  settings?: Pick<AppSettings, 'customAgentRoles'>
): string {
  if (role === 'supervisor') return '调度器'
  const card = queryRoleTaskCardMetaList(settings ?? { customAgentRoles: [] }).find(
    (c) => c.value === role
  )
  if (card) return card.label
  const custom = queryCustomAgentRole(settings?.customAgentRoles, role)
  return custom?.label ?? role
}

/** 是否可在设置中维护工具注入（聊天管线内置 + 自定义） */
export function queryIsToolConfigurableRole(
  role: ModelRoleKey,
  settings: Pick<AppSettings, 'customAgentRoles'>
): boolean {
  if (queryIsCustomAgentRoleId(role)) return true
  return (BUILTIN_CHAT_PIPELINE_ROLE_IDS as readonly string[]).includes(role)
}
