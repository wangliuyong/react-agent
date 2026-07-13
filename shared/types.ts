/**
 * 主进程 ↔ 渲染进程共享类型与 IPC 通道名。
 * 放在 shared/ 避免两端各自维护一份契约。
 */

/** IPC 通道：读操作用 query*，写操作用 post*（与项目命名约定一致） */
export const IpcChannels = {
  // 设置
  querySettings: 'query:settings',
  postSettings: 'post:settings',
  // 会话
  querySessions: 'query:sessions',
  querySession: 'query:session',
  postSession: 'post:session',
  postDeleteSession: 'post:session:delete',
  // 发布计划
  queryPublishPlans: 'query:publish-plans',
  queryPublishPlan: 'query:publish-plan',
  postPublishPlan: 'post:publish-plan',
  postDeletePublishPlan: 'post:publish-plan:delete',
  // 定时任务
  queryScheduledTasks: 'query:scheduled-tasks',
  queryScheduledTask: 'query:scheduled-task',
  postScheduledTask: 'post:scheduled-task',
  postDeleteScheduledTask: 'post:scheduled-task:delete',
  postRunScheduledTask: 'post:scheduled-task:run',
  // Agent
  postAgentChat: 'post:agent:chat',
  postAgentAbort: 'post:agent:abort',
  postAgentContinue: 'post:agent:continue',
  // 浏览器
  queryBrowserStatus: 'query:browser:status',
  postBrowserStart: 'post:browser:start',
  postBrowserClose: 'post:browser:close',
  postBrowserClearProfile: 'post:browser:clear-profile',
  // 发布渠道
  queryPublishChannels: 'query:publish-channels',
  postPublishChannel: 'post:publish-channel',
  postDeletePublishChannel: 'post:publish-channel:delete',
  postInitPublishChannels: 'post:publish-channels:init',
  // 发布渠道登录态
  queryChannelLoginStatuses: 'query:channel-login-statuses',
  postChannelOpenLogin: 'post:channel:open-login',
  // 项目技能（.cursor/skills）
  queryProjectSkills: 'query:project-skills',
  queryProjectSkillDetail: 'query:project-skill-detail',
  postSkillStates: 'post:skill-states',
  postProjectSkill: 'post:project-skill',
  postDeleteProjectSkill: 'post:project-skill:delete',
  querySkillTemplates: 'query:skill-templates',
  postInstallSkillTemplate: 'post:skill-template:install',
  querySkillImportPreview: 'query:skill-import-preview',
  postImportSkillFromUrl: 'post:skill-import-from-url',
  queryLocalImageDataUrl: 'query:local-image-data-url',
  // 事件推送（main → renderer）
  onAgentEvent: 'event:agent',
  onBrowserFrame: 'event:browser-frame',
  onScheduleUpdate: 'event:schedule-update'
} as const

export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels]

/** 应用设置（本地 JSON 缓存） */
export interface AppSettings {
  /** 阿里云百炼 API Key */
  apiKey: string
  /** OpenAI 兼容 baseURL */
  baseUrl: string
  /** 默认模型，如 qwen-plus */
  model: string
  /** 完全访问：跳过部分敏感确认（发布前仍建议确认） */
  fullAccess: boolean
  /** Agent 最大工具轮次 */
  maxTurns: number
}

export const DEFAULT_SETTINGS: AppSettings = {
  apiKey: '',
  baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  model: 'qwen-plus',
  fullAccess: false,
  maxTurns: 40
}

/** 百炼常用模型选项（聊天与设置页共用） */
export interface ModelOption {
  /** OpenAI 兼容接口中的 model 字段 */
  value: string
  /** 展示名称 */
  label: string
  /** 简短说明，用于下拉提示 */
  description?: string
}

export const MODEL_OPTIONS: ModelOption[] = [
  { value: 'qwen-plus', label: 'Qwen Plus', description: '均衡，推荐默认' },
  { value: 'qwen-max', label: 'Qwen Max', description: '能力最强' },
  { value: 'qwen-turbo', label: 'Qwen Turbo', description: '速度快、成本低' },
  { value: 'qwen-long', label: 'Qwen Long', description: '超长上下文' },
  // DeepSeek
  { value: 'deepseek-v4-flash', label: 'deepseek-v4-flash' },
  { value: 'deepseek-v4-pro', label: 'deepseek-v4-pro' },
  // Qwen 3.x
  { value: 'qwen3.6-flash-2026-04-16', label: 'qwen3.6-flash-2026-04-16' },
  { value: 'qwen3.5-ocr', label: 'qwen3.5-ocr' },
  { value: 'qwen3.6-35b-a3b', label: 'qwen3.6-35b-a3b' },
  { value: 'qwen3.7-max-2026-05-17', label: 'qwen3.7-max-2026-05-17' },
  { value: 'qwen3.7-max-2026-06-08', label: 'qwen3.7-max-2026-06-08' },
  { value: 'qwen3.7-max-preview', label: 'qwen3.7-max-preview' },
  { value: 'qwen3.5-plus-2026-04-20', label: 'qwen3.5-plus-2026-04-20' },
  { value: 'qwen3.6-max-preview', label: 'qwen3.6-max-preview' },
  { value: 'qwen3.7-max', label: 'qwen3.7-max' },
  { value: 'qwen3.7-max-2026-05-20', label: 'qwen3.7-max-2026-05-20' },
  { value: 'qwen3.7-plus-2026-05-26', label: 'qwen3.7-plus-2026-05-26' },
  { value: 'qwen3.6-flash', label: 'qwen3.6-flash' },
  // GLM
  { value: 'glm-5.1', label: 'glm-5.1' },
  { value: 'glm-5.2', label: 'glm-5.2' },
  // Kimi
  { value: 'kimi-k2.7-code', label: 'kimi-k2.7-code', description: '代码能力强' },
  { value: 'kimi-k2.6', label: 'kimi-k2.6' }
]

/** 根据 model id 取展示名；未知模型回退为原始 id */
export function queryModelLabel(model: string): string {
  return MODEL_OPTIONS.find((m) => m.value === model)?.label ?? model
}

/** 聊天消息角色 */
export type MessageRole = 'user' | 'assistant' | 'system' | 'tool'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  /** tool 调用时的工具名 */
  toolName?: string
  /** 关联 tool_call_id */
  toolCallId?: string
  /** 用户消息附带的本地图片路径 */
  attachmentPaths?: string[]
  createdAt: number
}

/** 任务清单项（对齐截图「任务清单」） */
export type TaskItemStatus = 'pending' | 'running' | 'done' | 'failed'

export interface TaskItem {
  id: string
  title: string
  status: TaskItemStatus
}

/** 会话来源类型：决定侧边栏历史列表图标与归类 */
export type SessionType = 'chat' | 'publish' | 'schedule'

export interface Session {
  id: string
  title: string
  messages: ChatMessage[]
  tasks: TaskItem[]
  /** 会话类型；旧数据缺省时由 querySessionType 推断 */
  type?: SessionType
  /** 累计估算 token（展示用） */
  tokenUsed: number
  createdAt: number
  updatedAt: number
}

import type { PublishChannelId, PublishChannelMeta, PublishChannelUpsertInput } from './publish-channels'

export type { PublishChannelId, PublishChannelMeta, PublishChannelUpsertInput } from './publish-channels'

/** 发布计划子任务 */
export interface PublishSubTask {
  id: string
  title: string
  /** 发布渠道 id 列表，同一子任务可同时发布到多个渠道，见 shared/publish-channels.ts */
  channels: PublishChannelId[]
  /** 主题标签 */
  topic: string
  /** 是否自动发布 */
  autoPublish: boolean
  /** 给 Agent 的内容说明 / prompt */
  contentPrompt: string
}

export interface PublishPlan {
  id: string
  title: string
  description: string
  subTasks: PublishSubTask[]
  createdAt: number
  updatedAt: number
}

/** 定时任务重复规则 */
export type ScheduleRepeat = 'once' | 'daily' | 'weekly'

/** 定时任务最近一次执行状态 */
export type ScheduleRunStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped'

/** 定时任务触发后的动作类型 */
export type ScheduleActionType = 'publish_plan' | 'custom_prompt'

/**
 * 定时任务：主进程调度器到点自动创建会话并调用 Agent。
 * 与发布工作台共用发布计划 prompt 构建逻辑。
 */
export interface ScheduledTask {
  id: string
  title: string
  description: string
  /** 关闭后调度器跳过，nextRunAt 置空 */
  enabled: boolean
  repeat: ScheduleRepeat
  /** HH:mm，daily / weekly 使用 */
  timeOfDay: string
  /** weekly 时 0=周日 … 6=周六 */
  weekday?: number
  /** once 时执行的 Unix 毫秒时间戳 */
  runAt?: number
  actionType: ScheduleActionType
  /** 关联发布计划 id */
  publishPlanId?: string
  /** 自定义 Agent 指令 */
  customPrompt?: string
  lastRunAt?: number
  nextRunAt?: number
  lastRunStatus?: ScheduleRunStatus
  /** 最近一次执行创建的会话，便于跳转查看 */
  lastSessionId?: string
  createdAt: number
  updatedAt: number
}

/** Agent 流式事件（主进程推送到渲染进程） */
export type AgentEvent =
  | { type: 'text_delta'; sessionId: string; delta: string }
  | { type: 'message'; sessionId: string; message: ChatMessage }
  | { type: 'tool_start'; sessionId: string; toolName: string; args: unknown }
  | { type: 'tool_result'; sessionId: string; toolName: string; result: string }
  | { type: 'task_update'; sessionId: string; tasks: TaskItem[] }
  | { type: 'await_user'; sessionId: string; reason: string }
  | { type: 'browser_open'; sessionId: string; url: string }
  | { type: 'done'; sessionId: string; reason: string }
  | { type: 'error'; sessionId: string; message: string }

export interface BrowserStatus {
  running: boolean
  url: string
  title: string
}

export interface BrowserFramePayload {
  /** JPEG base64（不含 data: 前缀） */
  data: string
  url: string
  title: string
}

/** 渠道登录检测结果 */
export type ChannelLoginState = 'logged_in' | 'logged_out' | 'unsupported' | 'error'

export interface ChannelLoginStatus {
  channelId: PublishChannelId
  state: ChannelLoginState
  /** 检测完成时间戳 */
  checkedAt: number
  /** 补充说明，如错误信息 */
  message?: string
}

export interface AgentChatRequest {
  sessionId: string
  content: string
  /** 附件本地路径（图片等） */
  attachmentPaths?: string[]
}

/** 项目技能摘要（来自 .cursor/skills/<id>/SKILL.md） */
export interface ProjectSkill {
  id: string
  name: string
  description: string
  enabled: boolean
  hasExamples: boolean
  updatedAt: number
  /** 项目内置技能（react-agent-*），删除时 UI 加强提示 */
  isBuiltin?: boolean
}

/** 技能写入 DTO（不含 frontmatter，主进程负责序列化 SKILL.md） */
export interface SkillUpsertInput {
  /** 目录名，小写+连字符 */
  id: string
  name: string
  description: string
  /** SKILL.md 正文（# 标题以下） */
  content: string
  examplesContent?: string
}

/** 市场模板摘要（只读，来自 resources/skill-templates） */
export interface SkillTemplate {
  id: string
  name: string
  description: string
}

/** 技能链接导入方式：Git 仓库克隆 或 HTTP 直链下载 */
export type SkillImportMethod = 'git_clone' | 'http_download'

/** 从 URL 导入技能前的预览信息 */
export interface SkillImportPreview {
  /** 用户输入的原始链接 */
  url: string
  /** 大模型或规则引擎判定的导入方式 */
  method: SkillImportMethod
  /** 解析后的 SKILL.md 地址（HTTP 为 URL；Git 为本地探测说明） */
  skillMdUrl: string
  /** 建议安装目录名 */
  suggestedId: string
  name: string
  description: string
  hasExamples: boolean
  /** 大模型给出的简要理由（可选，便于 UI 展示） */
  reasoning?: string
}

/** 技能详情（含 Markdown 正文） */
export interface ProjectSkillDetail extends ProjectSkill {
  content: string
  examplesContent?: string
}

/** 技能启用状态：skillId → { enabled } */
export type SkillStates = Record<string, { enabled: boolean }>

/** Preload 暴露给 window.api 的类型 */
export interface ElectronApi {
  querySettings: () => Promise<AppSettings>
  postSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>
  querySessions: () => Promise<Session[]>
  querySession: (id: string) => Promise<Session | null>
  postSession: (session: Session) => Promise<Session>
  postDeleteSession: (id: string) => Promise<void>
  queryPublishPlans: () => Promise<PublishPlan[]>
  queryPublishPlan: (id: string) => Promise<PublishPlan | null>
  postPublishPlan: (plan: PublishPlan) => Promise<PublishPlan>
  postDeletePublishPlan: (id: string) => Promise<void>
  queryScheduledTasks: () => Promise<ScheduledTask[]>
  queryScheduledTask: (id: string) => Promise<ScheduledTask | null>
  postScheduledTask: (task: ScheduledTask) => Promise<ScheduledTask>
  postDeleteScheduledTask: (id: string) => Promise<void>
  postRunScheduledTask: (id: string) => Promise<ScheduledTask | null>
  postAgentChat: (req: AgentChatRequest) => Promise<void>
  postAgentAbort: (sessionId: string) => Promise<void>
  postAgentContinue: (sessionId: string) => Promise<void>
  queryBrowserStatus: () => Promise<BrowserStatus>
  postBrowserStart: () => Promise<BrowserStatus>
  postBrowserClose: () => Promise<BrowserStatus>
  postBrowserClearProfile: () => Promise<void>
  queryPublishChannels: () => Promise<PublishChannelMeta[]>
  postPublishChannel: (input: PublishChannelUpsertInput) => Promise<PublishChannelMeta>
  postDeletePublishChannel: (id: string) => Promise<void>
  postInitPublishChannels: () => Promise<PublishChannelMeta[]>
  queryChannelLoginStatuses: () => Promise<ChannelLoginStatus[]>
  postChannelOpenLogin: (channelId: string) => Promise<BrowserStatus>
  queryProjectSkills: () => Promise<ProjectSkill[]>
  queryProjectSkillDetail: (id: string) => Promise<ProjectSkillDetail | null>
  postSkillStates: (states: SkillStates) => Promise<SkillStates>
  postProjectSkill: (input: SkillUpsertInput) => Promise<ProjectSkillDetail>
  postDeleteProjectSkill: (id: string) => Promise<void>
  querySkillTemplates: () => Promise<SkillTemplate[]>
  postInstallSkillTemplate: (templateId: string, targetId?: string) => Promise<ProjectSkillDetail>
  querySkillImportPreview: (url: string) => Promise<SkillImportPreview>
  postImportSkillFromUrl: (url: string, targetId?: string) => Promise<ProjectSkillDetail>
  queryLocalImageDataUrl: (filePath: string) => Promise<string | null>
  onAgentEvent: (cb: (event: AgentEvent) => void) => () => void
  onBrowserFrame: (cb: (frame: BrowserFramePayload) => void) => () => void
  onScheduleUpdate: (cb: (tasks: ScheduledTask[]) => void) => () => void
  /** 选择本地图片文件 */
  postSelectImages: () => Promise<string[]>
  /** 在系统默认浏览器中打开链接 */
  postOpenExternal: (url: string) => Promise<void>
}

declare global {
  interface Window {
    api: ElectronApi
  }
}
