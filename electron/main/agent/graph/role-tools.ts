import type { AgentRoleName } from '../../../../shared/types'
import { getAllTools } from '../tools'
import type { AgentTool } from '../tools/types'

/** 各角色工具白名单；general 为全量 */
const ROLE_WHITELIST: Record<Exclude<AgentRoleName, 'supervisor'>, string[] | null> = {
  general: null,
  researcher: [
    'use_skill',
    'fetch_hot_topics',
    'query_weather',
    'query_web_data',
    'fetch_web_images',
    'list_attachments',
    'read_file',
    'update_task_list',
    'browser_navigate',
    'browser_snapshot'
  ],
  writer: ['use_skill', 'update_task_list', 'read_file', 'write_file', 'list_attachments'],
  publisher: [
    'use_skill',
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
    'list_attachments',
    'read_file',
    'write_file',
    'generate_script',
    'generate_storyboard',
    'update_task_list'
  ],
  videographer: [
    'use_skill',
    'read_file',
    'generate_scene_assets',
    'update_task_list',
    'list_attachments'
  ],
  editor: [
    'use_skill',
    'compose_video',
    'notify_message',
    'read_file',
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
