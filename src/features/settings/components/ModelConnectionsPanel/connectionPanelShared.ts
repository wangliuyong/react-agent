import {
  DEFAULT_ROLE_PROMPT_OVERRIDES,
  type ModelCapability,
  type ModelRoleKey
} from '@shared/types'
import { queryRoleTaskCardMetaList } from '@shared/agent-role-registry'

/** 能力标签选项 — 连接编辑弹窗与卡片展示共用 */
export const CAPABILITY_OPTIONS: { value: ModelCapability; label: string }[] = [
  { value: 'chat', label: '对话' },
  { value: 'reasoning', label: '推理' },
  { value: 'vision', label: '视觉' },
  { value: 'longContext', label: '长上下文' },
  { value: 'creative', label: '创作' }
]

/**
 * 内置角色 / 任务元信息（不含用户自定义）。
 * 完整列表请用 queryRoleTaskCardMetaList(settings)。
 */
export const ROLE_TASK_META = queryRoleTaskCardMetaList({ customAgentRoles: [] }).map(
  ({ value, label, description }) => ({ value, label, description })
)

export function queryCapabilityLabel(cap: ModelCapability): string {
  return CAPABILITY_OPTIONS.find((item) => item.value === cap)?.label ?? cap
}

/** 角色设定补充输入框 placeholder — 与默认设定文案一致，便于用户参考或恢复 */
export function queryRolePromptPlaceholder(role: ModelRoleKey): string {
  return (
    DEFAULT_ROLE_PROMPT_OVERRIDES[role] ??
    '追加角色语气、输出格式或业务偏好；留空则仅使用系统内置说明。'
  )
}

export function queryNewConnectionId(): string {
  return `conn-${Date.now().toString(36)}`
}
