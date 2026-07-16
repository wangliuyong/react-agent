/**
 * 主进程 ↔ 渲染进程共享类型与 IPC 通道名。
 * 放在 shared/ 避免两端各自维护一份契约。
 */

/** IPC 通道：读操作用 query*，写操作用 post*（与项目命名约定一致） */
export const IpcChannels = {
  // 设置
  querySettings: 'query:settings',
  postSettings: 'post:settings',
  /** 从当前供应商平台拉取可用模型（OpenAI 兼容 /models） */
  queryProviderModels: 'query:provider-models',
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
  /** 首次启动写入内置发布计划（磁盘为空时） */
  postInitPublishPlans: 'post:publish-plans:init',
  /** 导入缺失的内置发布计划（手动「导入示例」） */
  postImportBuiltinPublishPlans: 'post:publish-plans:import-builtin',
  // 定时任务
  queryScheduledTasks: 'query:scheduled-tasks',
  queryScheduledTask: 'query:scheduled-task',
  postScheduledTask: 'post:scheduled-task',
  postDeleteScheduledTask: 'post:scheduled-task:delete',
  postRunScheduledTask: 'post:scheduled-task:run',
  /** 首次启动写入内置定时任务（磁盘为空时） */
  postInitScheduledTasks: 'post:scheduled-tasks:init',
  /** 导入缺失的内置定时任务（手动「导入示例」） */
  postImportBuiltinScheduledTasks: 'post:scheduled-tasks:import-builtin',
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
  /** 通知渠道测试发送（飞书 Webhook 等） */
  postNotifyChannelTest: 'post:notify-channel:test',
  // 发布渠道登录态
  queryChannelLoginStatuses: 'query:channel-login-statuses',
  postChannelOpenLogin: 'post:channel:open-login',
  // 项目技能（resources/skills）
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
  // Agent 用户规则（持久指令，注入 SYSTEM_PROMPT）
  queryAgentRules: 'query:agent-rules',
  postAgentRule: 'post:agent-rule',
  postDeleteAgentRule: 'post:agent-rule:delete',
  // 工作流编排
  queryWorkflows: 'query:workflows',
  queryWorkflow: 'query:workflow',
  postWorkflow: 'post:workflow',
  postDeleteWorkflow: 'post:workflow:delete',
  postRunWorkflow: 'post:workflow:run',
  postResumeWorkflow: 'post:workflow:resume',
  // 事件推送（main → renderer）
  onAgentEvent: 'event:agent',
  onBrowserFrame: 'event:browser-frame',
  onScheduleUpdate: 'event:schedule-update'
} as const

export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels]

/** 应用设置（本地 JSON 缓存） */
export type ModelProvider = 'dashscope' | 'deepseek'

export interface AppSettings {
  /** 当前模型服务供应商 */
  provider: ModelProvider
  /** 当前供应商的 API Key */
  apiKey: string
  /** OpenAI 兼容 baseURL */
  baseUrl: string
  /** 默认模型，如 qwen-plus */
  model: string
  /** 完全访问：跳过部分敏感确认（发布前仍建议确认） */
  fullAccess: boolean
  /** Agent 最大工具轮次 */
  maxTurns: number
  /** 登录系统后自动启动应用 */
  launchAtLogin: boolean
}

export const DEFAULT_SETTINGS: AppSettings = {
  provider: 'dashscope',
  apiKey: '',
  baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  model: 'qwen-plus',
  fullAccess: false,
  maxTurns: 40,
  launchAtLogin: false
}

/** 模型供应商选项（聊天与设置页共用） */
export interface ModelProviderOption {
  value: ModelProvider
  label: string
  apiKeyLabel: string
  defaultBaseUrl: string
  defaultModel: string
}

export const MODEL_PROVIDER_OPTIONS: ModelProviderOption[] = [
  {
    value: 'dashscope',
    label: '阿里云百炼',
    apiKeyLabel: 'DASHSCOPE API Key',
    defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-plus'
  },
  {
    value: 'deepseek',
    label: 'DeepSeek',
    apiKeyLabel: 'DeepSeek API Key',
    defaultBaseUrl: 'https://api.deepseek.com',
    /** 与平台当前推荐一致；拉取 /models 失败时也用此默认 */
    defaultModel: 'deepseek-v4-flash'
  }
]

/** 可选模型；provider 防止模型被发送到错误的兼容接口。 */
export interface ModelOption {
  provider: ModelProvider
  /** OpenAI 兼容接口中的 model 字段 */
  value: string
  /** 展示名称 */
  label: string
  /** 简短说明，用于下拉提示 */
  description?: string
}

export const MODEL_OPTIONS: ModelOption[] = [
  { provider: 'dashscope', value: 'qwen-plus', label: 'Qwen Plus', description: '均衡，推荐默认' },
  { provider: 'dashscope', value: 'qwen-max', label: 'Qwen Max', description: '能力最强' },
  {
    provider: 'dashscope',
    value: 'qwen-turbo',
    label: 'Qwen Turbo',
    description: '速度快、成本低'
  },
  { provider: 'dashscope', value: 'qwen-long', label: 'Qwen Long', description: '超长上下文' },
  /**
   * DeepSeek 官方模型（与 GET /models 文档示例一致）：
   * https://api-docs.deepseek.com/zh-cn/api/list-models
   * 聊天/设置优先实时拉取；此处作无 Key / 请求失败时的静态兜底。
   */
  {
    provider: 'deepseek',
    value: 'deepseek-v4-flash',
    label: 'DeepSeek V4 Flash',
    description: '高速推理，推荐默认'
  },
  {
    provider: 'deepseek',
    value: 'deepseek-v4-pro',
    label: 'DeepSeek V4 Pro',
    description: '更强推理能力'
  },
  // 阿里云百炼中的 DeepSeek 模型
  { provider: 'dashscope', value: 'deepseek-v4-flash', label: 'deepseek-v4-flash' },
  { provider: 'dashscope', value: 'deepseek-v4-pro', label: 'deepseek-v4-pro' },
  // Qwen 3.x
  {
    provider: 'dashscope',
    value: 'qwen3.6-flash-2026-04-16',
    label: 'qwen3.6-flash-2026-04-16'
  },
  { provider: 'dashscope', value: 'qwen3.5-ocr', label: 'qwen3.5-ocr' },
  { provider: 'dashscope', value: 'qwen3.6-35b-a3b', label: 'qwen3.6-35b-a3b' },
  {
    provider: 'dashscope',
    value: 'qwen3.7-max-2026-05-17',
    label: 'qwen3.7-max-2026-05-17'
  },
  {
    provider: 'dashscope',
    value: 'qwen3.7-max-2026-06-08',
    label: 'qwen3.7-max-2026-06-08'
  },
  { provider: 'dashscope', value: 'qwen3.7-max-preview', label: 'qwen3.7-max-preview' },
  {
    provider: 'dashscope',
    value: 'qwen3.5-plus-2026-04-20',
    label: 'qwen3.5-plus-2026-04-20'
  },
  { provider: 'dashscope', value: 'qwen3.6-max-preview', label: 'qwen3.6-max-preview' },
  { provider: 'dashscope', value: 'qwen3.7-max', label: 'qwen3.7-max' },
  {
    provider: 'dashscope',
    value: 'qwen3.7-max-2026-05-20',
    label: 'qwen3.7-max-2026-05-20'
  },
  {
    provider: 'dashscope',
    value: 'qwen3.7-plus-2026-05-26',
    label: 'qwen3.7-plus-2026-05-26'
  },
  { provider: 'dashscope', value: 'qwen3.6-flash', label: 'qwen3.6-flash' },
  // GLM
  { provider: 'dashscope', value: 'glm-5.1', label: 'glm-5.1' },
  { provider: 'dashscope', value: 'glm-5.2', label: 'glm-5.2' },
  // Kimi
  {
    provider: 'dashscope',
    value: 'kimi-k2.7-code',
    label: 'kimi-k2.7-code',
    description: '代码能力强'
  },
  { provider: 'dashscope', value: 'kimi-k2.6', label: 'kimi-k2.6' }
]

/** 查询供应商元数据；类型已限制输入，兜底仅用于处理损坏的本地配置。 */
export function queryProviderOption(provider: ModelProvider): ModelProviderOption {
  return (
    MODEL_PROVIDER_OPTIONS.find((option) => option.value === provider) ??
    MODEL_PROVIDER_OPTIONS[0]
  )
}

/** 返回供应商可用模型，避免模型与 Base URL 交叉配置。 */
export function queryModelOptions(provider: ModelProvider): ModelOption[] {
  return MODEL_OPTIONS.filter((option) => option.provider === provider)
}

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
export type TaskItemStatus = 'pending' | 'running' | 'done' | 'failed' | 'skipped'

export interface TaskItem {
  id: string
  title: string
  status: TaskItemStatus
  /**
   * parallel / condition 子步的父节点 id。
   * 有值时 UI 可缩进展示；编排引擎用其表达组内子步与阶段的关系。
   */
  parentId?: string
}

/** 会话来源类型：决定侧边栏历史列表图标与归类 */
export type SessionType = 'chat' | 'publish' | 'schedule' | 'workflow'

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
  /**
   * 本子任务结束后额外通知的渠道 id；空数组/缺省表示仅跟随计划级 notifyChannels。
   * 与 channels（发布）分离，避免混选通知渠道。
   */
  notifyChannels?: PublishChannelId[]
  /** 主题标签 */
  topic: string
  /** 是否自动发布 */
  autoPublish: boolean
  /** 给 Agent 的内容说明 / prompt */
  contentPrompt: string
}

/** 发布任务分类：普通=子任务编排；流程=关联已有工作流 */
export type PublishPlanKind = 'normal' | 'workflow'

export interface PublishPlan {
  id: string
  title: string
  description: string
  /**
   * 任务分类。缺省视为 normal（兼容旧数据）。
   * - normal：用 subTasks 编排，保存时镜像为同 id 工作流
   * - workflow：关联一个或多个子流程（workflowIds），保存时编译为串行组合工作流
   */
  kind: PublishPlanKind
  /**
   * kind===workflow 时关联的子流程 id 列表（有序，依次执行）。
   * 兼容旧字段 workflowId：读盘时归一化进本数组。
   */
  workflowIds: string[]
  /** @deprecated 请用 workflowIds；仅兼容旧数据 */
  workflowId?: string
  /**
   * 计划全部子任务结束后汇总通知的渠道 id。
   * 与子任务 notifyChannels 独立：可叠加。
   */
  notifyChannels?: PublishChannelId[]
  subTasks: PublishSubTask[]
  createdAt: number
  updatedAt: number
}

/** 定时任务重复规则 */
export type ScheduleRepeat = 'once' | 'daily' | 'weekly'

/** 定时任务最近一次执行状态 */
export type ScheduleRunStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped'

/** 定时任务触发后的动作类型 */
export type ScheduleActionType = 'publish_plan' | 'custom_prompt' | 'workflow'

/**
 * 定时任务：主进程调度器到点创建会话并执行。
 * publish_plan / workflow 走编排引擎；custom_prompt 走单步 ReAct（非多智能体路由）。
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
  /** 关联发布计划 id（与镜像工作流 id 相同） */
  publishPlanId?: string
  /** 关联通用工作流 id */
  workflowId?: string
  /** 自定义 Agent 指令 */
  customPrompt?: string
  /**
   * 任务成功结束后自动通知的渠道 id（如 feishu），与 actionType 无关。
   * 主进程将最终执行结果转为飞书富文本后推送。
   */
  notifyChannels?: PublishChannelId[]
  lastRunAt?: number
  nextRunAt?: number
  lastRunStatus?: ScheduleRunStatus
  /** 最近一次执行创建的会话，便于跳转查看 */
  lastSessionId?: string
  createdAt: number
  updatedAt: number
}

/** Agent 流式事件（主进程推送到渲染进程） */
/** 多智能体当前角色（可选，供 UI 状态文案） */
export type AgentRoleName =
  | 'supervisor'
  | 'general'
  | 'researcher'
  | 'writer'
  | 'publisher'

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
  | { type: 'agent_role'; sessionId: string; role: AgentRoleName }

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

/** 技能摘要（来自 resources/skills/<id>/SKILL.md） */
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

/** 市场模板摘要（只读，来自内置 resources/skills） */
export interface SkillTemplate {
  id: string
  name: string
  description: string
}

/**
 * 技能链接导入方式：
 * - git_clone / http_download：远程 SKILL.md 目录
 * - json：远端或本地 JSON（单个对象或数组）
 */
export type SkillImportMethod = 'git_clone' | 'http_download' | 'json'

/** JSON 导入预览中的单条技能摘要（不含正文，仅 UI 展示） */
export interface SkillImportJsonItemPreview {
  id: string
  name: string
  description: string
  hasExamples: boolean
}

/** 从 URL / JSON 导入技能前的预览信息 */
export interface SkillImportPreview {
  /** 用户输入的原始链接；本地文件导入时可为空字符串 */
  url: string
  /** 大模型或规则引擎判定的导入方式 */
  method: SkillImportMethod
  /** 解析后的 SKILL.md 地址（HTTP 为 URL；Git 为本地探测说明；JSON 为源 URL） */
  skillMdUrl: string
  /** 建议安装目录名（JSON 多条时取第一条） */
  suggestedId: string
  name: string
  description: string
  hasExamples: boolean
  /** 大模型给出的简要理由（可选，便于 UI 展示） */
  reasoning?: string
  /** method=json 时列出将导入的技能摘要 */
  jsonItems?: SkillImportJsonItemPreview[]
}

/** 技能详情（含 Markdown 正文） */
export interface ProjectSkillDetail extends ProjectSkill {
  content: string
  examplesContent?: string
}

/** 技能启用状态：skillId → { enabled } */
export type SkillStates = Record<string, { enabled: boolean }>

/**
 * Agent 用户规则：Always Apply 的持久指令。
 * 与技能分工——规则偏用户偏好/长期约束，技能偏可安装流程知识。
 */
export interface AgentRule {
  id: string
  name: string
  description: string
  /** Markdown 正文，启用时注入 SYSTEM_PROMPT */
  content: string
  enabled: boolean
  createdAt: number
  updatedAt: number
}

/** 规则写入 DTO（不含时间戳，由主进程填充） */
export interface AgentRuleUpsertInput {
  id: string
  name: string
  description: string
  content: string
  enabled: boolean
}

/** 工作流模板种类：通用流程 vs 发布流水线 */
export type WorkflowTemplateKind = 'generic' | 'publish'

/** Agent 子任务节点：走受限 ReAct */
export interface WorkflowAgentNode {
  id: string
  type: 'agent'
  title: string
  prompt: string
  /** 空/缺省 = 使用全部工具 */
  toolWhitelist?: string[]
  outputKeys?: string[]
}

/** 确定性工具节点：参数支持 {{contextKey}} 插值 */
export interface WorkflowToolNode {
  id: string
  type: 'tool'
  title: string
  toolName: string
  argsTemplate: Record<string, unknown>
  outputKeys?: string[]
}

/** 人工确认节点：复用 await_user / continue */
export interface WorkflowAwaitNode {
  id: string
  type: 'await_user'
  title: string
  reason: string
}

/**
 * 并行组：组间串行，组内叶子并行（P0 引擎可先串行展开 children）。
 * children 仅允许 agent / tool / await_user。
 */
export interface WorkflowParallelNode {
  id: string
  type: 'parallel'
  title: string
  children: Array<WorkflowAgentNode | WorkflowToolNode | WorkflowAwaitNode>
}

/** 条件判定模式：表达式（表单/短表达式）或 Agent 选路 */
export type WorkflowConditionMode = 'expression' | 'agent'

/**
 * 表单条件；填写 expression 时优先用短表达式（覆盖 form 字段）。
 * 白名单求值见 shared/evaluate-workflow-condition.ts。
 */
export interface WorkflowConditionWhen {
  expression?: string
  contextKey?: string
  op?: 'eq' | 'neq' | 'truthy' | 'falsy'
  value?: string | number | boolean
}

/**
 * 条件支路：nodes 由画布拓扑编译填入。
 * 边条件模型下每条 case 自带 when；旧 true/false 模型可用节点级 when。
 */
export interface WorkflowConditionCase {
  key: string
  label?: string
  /** 该支路的边条件（表达式求值为真则选中） */
  when?: WorkflowConditionWhen
  nodes: WorkflowLeafNode[]
}

/**
 * 条件分支（XOR）：引擎内部编译产物；画布侧不再编辑此节点，条件在连线上。
 * mode=expression + cases[].when 为现行默认；agent 模式仅兼容旧数据。
 */
export interface WorkflowConditionNode {
  id: string
  type: 'condition'
  title: string
  mode: WorkflowConditionMode
  when?: WorkflowConditionWhen
  prompt?: string
  toolWhitelist?: string[]
  cases: WorkflowConditionCase[]
  defaultKey?: string
}

/** 流程开始（每流程恰好一个；画布不可删） */
export interface WorkflowStartNode {
  id: string
  type: 'start'
  title: string
}

/** 流程结束（每流程恰好一个；画布不可删） */
export interface WorkflowEndNode {
  id: string
  type: 'end'
  title: string
}

export type WorkflowLeafNode = WorkflowAgentNode | WorkflowToolNode | WorkflowAwaitNode
export type WorkflowTerminalNode = WorkflowStartNode | WorkflowEndNode
export type WorkflowNode =
  | WorkflowLeafNode
  | WorkflowParallelNode
  | WorkflowConditionNode
  | WorkflowTerminalNode

/** 画布连线：条件在边上；全无 when/default 的多出线仍为 parallel */
export interface WorkflowCanvasEdge {
  id: string
  source: string
  target: string
  label?: string
  when?: WorkflowConditionWhen
  /** else 兜底；同一 source 最多一条 */
  isDefault?: boolean
  /** @deprecated 旧 condition 画布字段；迁移后清除 */
  branchKey?: string
}

/**
 * 画布布局：节点坐标 + 连线。
 * 编辑以画布为准，保存时编译回 nodes 供引擎执行。
 */
export interface WorkflowCanvas {
  positions: Record<string, { x: number; y: number }>
  edges: WorkflowCanvasEdge[]
}

/** 可编辑、可复用的流程定义 */
export interface WorkflowDefinition {
  id: string
  title: string
  description: string
  templateKind: WorkflowTemplateKind
  nodes: WorkflowNode[]
  /** 拖拽连线画布；缺省时由 nodes 线性/并行结构推导 */
  canvas?: WorkflowCanvas
  createdAt: number
  updatedAt: number
}

export type WorkflowRunStatus =
  | 'pending'
  | 'running'
  | 'awaiting_user'
  | 'success'
  | 'failed'
  | 'aborted'

/** 一次工作流执行实例，绑定 Session 并驱动 TaskItem 进度 */
export interface WorkflowRun {
  id: string
  workflowId: string
  sessionId: string
  status: WorkflowRunStatus
  /** 当前节点 id；parallel 内可为子节点 id */
  cursorNodeId: string | null
  context: Record<string, unknown>
  errorMessage?: string
  createdAt: number
  updatedAt: number
}

/** 启动工作流后的返回：便于前端跳转聊天会话 */
export interface WorkflowRunStartResult {
  run: WorkflowRun
  sessionId: string
}

/** Preload 暴露给 window.api 的类型 */
export interface ElectronApi {
  querySettings: () => Promise<AppSettings>
  postSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>
  /**
   * 从平台拉取当前供应商可用模型。
   * 可传入草稿覆盖（设置页未保存的 Key / Base URL）；失败时由调用方回退静态列表。
   */
  queryProviderModels: (
    override?: Partial<Pick<AppSettings, 'provider' | 'apiKey' | 'baseUrl'>>
  ) => Promise<ModelOption[]>
  querySessions: () => Promise<Session[]>
  querySession: (id: string) => Promise<Session | null>
  postSession: (session: Session) => Promise<Session>
  postDeleteSession: (id: string) => Promise<void>
  queryPublishPlans: () => Promise<PublishPlan[]>
  queryPublishPlan: (id: string) => Promise<PublishPlan | null>
  postPublishPlan: (plan: PublishPlan) => Promise<PublishPlan>
  postDeletePublishPlan: (id: string) => Promise<void>
  postInitPublishPlans: () => Promise<PublishPlan[]>
  postImportBuiltinPublishPlans: () => Promise<PublishPlan[]>
  queryScheduledTasks: () => Promise<ScheduledTask[]>
  queryScheduledTask: (id: string) => Promise<ScheduledTask | null>
  postScheduledTask: (task: ScheduledTask) => Promise<ScheduledTask>
  postDeleteScheduledTask: (id: string) => Promise<void>
  postRunScheduledTask: (id: string) => Promise<ScheduledTask | null>
  postInitScheduledTasks: () => Promise<ScheduledTask[]>
  postImportBuiltinScheduledTasks: () => Promise<ScheduledTask[]>
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
  /** 通知渠道测试发送；ok=false 时带 error，不抛错便于 UI 展示 */
  postNotifyChannelTest: (
    channelId: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>
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
  queryAgentRules: () => Promise<AgentRule[]>
  postAgentRule: (input: AgentRuleUpsertInput) => Promise<AgentRule>
  postDeleteAgentRule: (id: string) => Promise<void>
  queryWorkflows: () => Promise<WorkflowDefinition[]>
  queryWorkflow: (id: string) => Promise<WorkflowDefinition | null>
  postWorkflow: (workflow: WorkflowDefinition) => Promise<WorkflowDefinition>
  postDeleteWorkflow: (id: string) => Promise<void>
  postRunWorkflow: (workflowId: string) => Promise<WorkflowRunStartResult>
  postResumeWorkflow: (runId: string) => Promise<WorkflowRunStartResult>
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
