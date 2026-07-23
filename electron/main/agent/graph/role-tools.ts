import type { AgentRoleName } from '../../../../shared/types'
import { getAllTools } from '../tools'
import type { AgentTool } from '../tools/types'

/** 各角色工具白名单；general 为全量 */
const ROLE_WHITELIST: Record<Exclude<AgentRoleName, 'supervisor'>, string[] | null> = {
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
    'read_file',
    'write_file',
    'generate_image',
    'remotion_init_project',
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
    'list_attachments',
    'read_file',
    'write_file',
    'generate_script',
    'generate_storyboard',
    'remotion_init_project',
    'remotion_studio',
    'update_task_list'
  ],
  videographer: [
    'use_skill',
    'switch_model',
    'present_plan_choices',
    'read_file',
    'write_file',
    'generate_scene_assets',
    'remotion_init_project',
    'remotion_studio',
    'remotion_render',
    'update_task_list',
    'list_attachments'
  ],
  editor: [
    'use_skill',
    'switch_model',
    'compose_video',
    'remotion_studio',
    'remotion_render',
    'notify_message',
    'read_file',
    'write_file',
    'update_task_list',
    'list_attachments'
  ]
}

/** 按角色过滤 AgentTool；supervisor 无工具 */
export function queryToolsForRole(role: AgentRoleName): AgentTool[] {
  if (role === 'supervisor') return []
  const all = getAllTools()
  const list = ROLE_WHITELIST[role]
  if (!list) return all
  return all.filter((t) => list.includes(t.name))
}

/** 按显式白名单过滤（工作流 agent 节点） */
export function queryToolsByWhitelist(whitelist?: string[]): AgentTool[] {
  const all = getAllTools()
  if (!whitelist || whitelist.length === 0) return all
  return all.filter((t) => whitelist.includes(t.name))
}

/**
 * 各角色当前注入的工具名（设置页「工具」Tab 只读展示）。
 * general 的 whitelist 为 null 表示注入全部已注册工具；supervisor 始终为空。
 */
export function queryRoleToolInjections(): Array<{
  role: AgentRoleName
  /** all = 全量注册表；whitelist = 显式名单；none = 无工具 */
  mode: 'all' | 'whitelist' | 'none'
  toolNames: string[]
}> {
  const allNames = getAllTools().map((t) => t.name)
  const roles: AgentRoleName[] = [
    'supervisor',
    'general',
    'researcher',
    'writer',
    'publisher',
    'scriptwriter',
    'videographer',
    'editor'
  ]

  return roles.map((role) => {
    if (role === 'supervisor') {
      return { role, mode: 'none' as const, toolNames: [] }
    }
    const list = ROLE_WHITELIST[role]
    if (!list) {
      return { role, mode: 'all' as const, toolNames: allNames }
    }
    return { role, mode: 'whitelist' as const, toolNames: [...list] }
  })
}
