import { DEFAULT_ROLE_PROMPT_OVERRIDES, type ModelCapability, type ModelRoleKey } from '@shared/types'

/** 能力标签选项 — 连接编辑弹窗与卡片展示共用 */
export const CAPABILITY_OPTIONS: { value: ModelCapability; label: string }[] = [
  { value: 'chat', label: '对话' },
  { value: 'reasoning', label: '推理' },
  { value: 'vision', label: '视觉' },
  { value: 'longContext', label: '长上下文' },
  { value: 'creative', label: '创作' }
]

/** 角色 / 任务元信息 — 卡片展示与编辑弹窗共用 */
export const ROLE_TASK_META: {
  value: ModelRoleKey
  label: string
  /** 卡片摘要与弹窗说明 */
  description: string
}[] = [
  {
    value: 'general',
    label: '通用助手',
    description: '闲聊、问答、单步工具与通用任务编排'
  },
  {
    value: 'researcher',
    label: '调研员',
    description: '热点调研、素材收集与配图路径汇总'
  },
  {
    value: 'writer',
    label: '撰稿人',
    description: '基于调研结果撰写标题、正文与话题标签'
  },
  {
    value: 'publisher',
    label: '发布员',
    description: '按成稿与配图完成小红书 / 抖音渠道发布'
  },
  {
    value: 'scriptwriter',
    label: '编剧',
    description: '创意脚本、分镜拆分与提示词精细化'
  },
  {
    value: 'videographer',
    label: '视频制作',
    description: '场景素材生成、T2I / I2V 渲染与校验'
  },
  {
    value: 'editor',
    label: '剪辑师',
    description: '音画对齐、粗剪拼接与成片导出'
  },
  {
    value: 'script',
    label: '剧本任务',
    description: '独立剧本生成任务使用的模型连接'
  },
  {
    value: 'storyboard',
    label: '分镜任务',
    description: '独立分镜生成任务使用的模型连接'
  },
  {
    value: 'video',
    label: '视频任务',
    description: '独立视频生成任务使用的模型连接'
  }
]

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
