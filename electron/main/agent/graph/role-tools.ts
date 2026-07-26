import type {
  AgentRoleName,
  AgentRoleToolInjection,
  BuiltinAgentRoleName,
  CustomAgentRole,
  RoleToolWhitelistOverrides
} from '../../../../shared/types'
import {
  queryCustomAgentRole,
  queryIsCustomAgentRoleId
} from '../../../../shared/agent-role-registry'
import { querySettings } from '../../store/settings'
import { getAllTools } from '../tools'
import type { AgentTool } from '../tools/types'

type BuiltinPipelineRole = Exclude<BuiltinAgentRoleName, 'supervisor'>

/**
 * 各角色工具白名单默认值；general 为全量（null）。
 * 用户可在设置 → 角色卡片中覆盖，写入 AppSettings.roleToolWhitelistOverrides。
 */
const ROLE_WHITELIST: Record<BuiltinPipelineRole, string[] | null> = {
  general: null,
  researcher: [
    'use_skill',
    'switch_model',
    'fetch_hot_topics',
    'query_ashare_kline',
    'query_ashare_realtime_analysis',
    'query_weather',
    'query_web_data',
    'fetch_web_images',
    'list_attachments',
    'read_file',
    'update_task_list',
    'browser_navigate',
    'browser_snapshot'
  ],
  writer: [
    'use_skill',
    'switch_model',
    'update_task_list',
    'present_plan_choices',
    'query_web_data',
    'read_file',
    'write_file',
    'generate_image',
    'remotion_init_project',
    'remotion_enable_sfx',
    'remotion_studio',
    'list_attachments'
  ],
  publisher: [
    'use_skill',
    'switch_model',
    'xhs_publish_note',
    'douyin_publish_note',
    'notify_message',
    'browser_navigate',
    'browser_snapshot',
    'browser_click',
    'browser_type',
    'browser_upload',
    'browser_wait',
    'update_task_list',
    'list_attachments'
  ],
  scriptwriter: [
    'use_skill',
    'switch_model',
    'present_plan_choices',
    'query_web_data',
    'fetch_web_images',
    'list_attachments',
    'read_file',
    'write_file',
    'generate_script',
    'generate_storyboard',
    'remotion_init_project',
    'remotion_enable_sfx',
    'remotion_studio',
    'update_task_list'
  ],
  videographer: [
    'use_skill',
    'switch_model',
    'present_plan_choices',
    'query_web_data',
    'read_file',
    'write_file',
    'generate_scene_assets',
    'remotion_init_project',
    'remotion_enable_sfx',
    'remotion_studio',
    'remotion_render',
    'update_task_list',
    'list_attachments'
  ],
  editor: [
    'use_skill',
    'switch_model',
    'query_web_data',
    'compose_video',
    'remotion_enable_sfx',
    'remotion_studio',
    'remotion_render',
    'notify_message',
    'read_file',
    'write_file',
    'update_task_list',
    'list_attachments'
  ]
}

/** 导出内置默认，供设置页「恢复默认」与编辑弹窗回填 */
export function queryDefaultRoleToolWhitelist(
  role: BuiltinPipelineRole
): string[] | null {
  const list = ROLE_WHITELIST[role]
  return list === null ? null : [...list]
}

function queryDefaultToolsForCustomRole(
  def: CustomAgentRole | undefined
): string[] | null {
  if (!def) return null
  if (def.toolWhitelist === null) return null
  if (Array.isArray(def.toolWhitelist)) return [...def.toolWhitelist]
  return null
}

/**
 * 解析某角色最终白名单：用户覆盖优先，否则内置 / 自定义定义。
 * @returns null = 全量；string[] = 显式名单
 */
export function queryResolvedRoleToolWhitelist(
  role: AgentRoleName,
  overrides?: RoleToolWhitelistOverrides,
  customRoles?: CustomAgentRole[]
): string[] | null {
  let map = overrides
  if (map === undefined) {
    try {
      map = querySettings().roleToolWhitelistOverrides ?? {}
    } catch {
      map = {}
    }
  }
  if (Object.prototype.hasOwnProperty.call(map, role)) {
    const override = map[role as keyof typeof map]
    if (override === null) return null
    if (Array.isArray(override)) return [...override]
  }
  if (queryIsCustomAgentRoleId(role)) {
    const roles =
      customRoles ??
      (() => {
        try {
          return querySettings().customAgentRoles ?? []
        } catch {
          return []
        }
      })()
    return queryDefaultToolsForCustomRole(queryCustomAgentRole(roles, role))
  }
  return queryDefaultRoleToolWhitelist(role as BuiltinPipelineRole)
}

/** 按角色过滤 AgentTool；supervisor 无工具。 */
export function queryToolsForRole(
  role: AgentRoleName,
  overrides?: RoleToolWhitelistOverrides,
  customRoles?: CustomAgentRole[]
): AgentTool[] {
  if (role === 'supervisor') return []
  const all = getAllTools()
  const list = queryResolvedRoleToolWhitelist(role, overrides, customRoles)
  if (!list) return all
  const allow = new Set(list)
  return all.filter((t) => allow.has(t.name))
}

/** 按显式白名单过滤（工作流 agent 节点） */
export function queryToolsByWhitelist(whitelist?: string[]): AgentTool[] {
  const all = getAllTools()
  if (!whitelist || whitelist.length === 0) return all
  const allow = new Set(whitelist)
  return all.filter((t) => allow.has(t.name))
}

/**
 * 各角色当前注入的工具名（设置页「工具」Tab / 角色卡片）。
 * general 默认全量；supervisor 始终为空。
 */
export function queryRoleToolInjections(
  overrides?: RoleToolWhitelistOverrides,
  customRoles?: CustomAgentRole[]
): AgentRoleToolInjection[] {
  let map = overrides
  if (map === undefined) {
    try {
      map = querySettings().roleToolWhitelistOverrides ?? {}
    } catch {
      map = {}
    }
  }
  let customs = customRoles
  if (customs === undefined) {
    try {
      customs = querySettings().customAgentRoles ?? []
    } catch {
      customs = []
    }
  }
  const allNames = getAllTools().map((t) => t.name)
  const roles: AgentRoleName[] = [
    'supervisor',
    'general',
    'researcher',
    'writer',
    'publisher',
    'scriptwriter',
    'videographer',
    'editor',
    ...(customs ?? []).map((r) => r.id as AgentRoleName)
  ]

  return roles.map((role) => {
    if (role === 'supervisor') {
      return {
        role,
        mode: 'none' as const,
        toolNames: [],
        defaultToolNames: [],
        customized: false
      }
    }
    const customized = Object.prototype.hasOwnProperty.call(map, role)
    const defaults = queryIsCustomAgentRoleId(role)
      ? queryDefaultToolsForCustomRole(queryCustomAgentRole(customs, role))
      : queryDefaultRoleToolWhitelist(role as BuiltinPipelineRole)
    const list = queryResolvedRoleToolWhitelist(role, map, customs)
    if (!list) {
      return {
        role,
        mode: 'all' as const,
        toolNames: allNames,
        defaultToolNames: defaults,
        customized
      }
    }
    return {
      role,
      mode: 'whitelist' as const,
      toolNames: [...list],
      defaultToolNames: defaults,
      customized
    }
  })
}
