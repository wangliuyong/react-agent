/**
 * 子 Agent 类型目录：内置管线角色 + 用户自定义 custom_* 角色。
 * 放在 agent/subagent 下，避免 store 反向依赖 agent/graph。
 */
import { queryCustomAgentRole, queryIsCustomAgentRoleId } from '../../../../shared/agent-role-registry'
import type {
  BuiltinAgentRoleName,
  ModelRoleKey,
  SubagentDefinition
} from '../../../../shared/types'
import { buildRoleSystemPrompt } from '../graph/prompts'
import { queryDefaultRoleToolWhitelist } from '../graph/role-tools'
import { querySettings } from '../../store/settings'

type BuiltinSubagentRole = Exclude<BuiltinAgentRoleName, 'supervisor'>

/** 可被 task 工具引用的内置子 Agent id → 管线角色 */
const BUILTIN_SUBAGENT_ROLES: Record<string, BuiltinSubagentRole> = {
  general: 'general',
  researcher: 'researcher',
  writer: 'writer',
  publisher: 'publisher',
  scriptwriter: 'scriptwriter',
  videographer: 'videographer',
  editor: 'editor'
}

const BUILTIN_SUBAGENT_LABELS: Record<string, string> = {
  general: '通用助手',
  researcher: '调研',
  writer: '撰稿',
  publisher: '发布',
  scriptwriter: '编剧',
  videographer: '视频制作',
  editor: '剪辑合成'
}

/**
 * 按 agentType 解析子 Agent 定义；未知类型返回 null。
 */
export function querySubagentDefinition(agentType: string): SubagentDefinition | null {
  const settings = querySettings()

  if (queryIsCustomAgentRoleId(agentType)) {
    const custom = queryCustomAgentRole(settings.customAgentRoles, agentType)
    if (!custom) return null
    return {
      id: custom.id,
      name: custom.label,
      systemPrompt: buildRoleSystemPrompt(
        custom.id,
        settings.rolePromptOverrides,
        settings
      ),
      toolAllowlist: custom.toolWhitelist,
      toolDenylist: ['task'],
      modelRole: custom.id as ModelRoleKey
    }
  }

  const role = BUILTIN_SUBAGENT_ROLES[agentType]
  if (!role) return null

  return {
    id: agentType,
    name: BUILTIN_SUBAGENT_LABELS[agentType] ?? agentType,
    systemPrompt: buildRoleSystemPrompt(role, settings.rolePromptOverrides, settings),
    toolAllowlist: queryDefaultRoleToolWhitelist(role),
    toolDenylist: ['task'],
    modelRole: role as ModelRoleKey
  }
}

/** 列出当前可用的子 Agent 类型 id（供系统提示注入） */
export function querySubagentCatalogIds(): string[] {
  const settings = querySettings()
  const customIds = (settings.customAgentRoles ?? []).map((r) => r.id)
  return [...Object.keys(BUILTIN_SUBAGENT_ROLES), ...customIds]
}
