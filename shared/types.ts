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
  /** 本地音视频 → media:// URL，供聊天内联播放 */
  queryLocalMediaUrl: 'query:local-media-url',
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
  /** 业务系统：读取工作流运行记录（含 context） */
  queryWorkflowRuns: 'query:workflow-runs',
  queryLatestWorkflowRunBySession: 'query:workflow-run:by-session',
  // 事件推送（main → renderer）
  onAgentEvent: 'event:agent',
  onBrowserFrame: 'event:browser-frame',
  onScheduleUpdate: 'event:schedule-update',
  /** 在系统文件管理器中显示本地路径 */
  postRevealPath: 'post:reveal-path'
} as const

export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels]

/** 应用设置（本地 JSON 缓存） */
export type BuiltInModelProvider = 'dashscope' | 'deepseek' | 'openai_compatible'
/** 用户自定义 OpenAI 兼容供应商，持久化 id 以 custom: 前缀区分内置项 */
export type CustomModelProviderId = `custom:${string}`
export type ModelProvider = BuiltInModelProvider | CustomModelProviderId

/** 用户添加的 OpenAI 兼容模型供应商元数据 */
export interface CustomModelProvider {
  id: CustomModelProviderId
  /** 展示名称，如「月之暗面」「MiniMax」 */
  label: string
  /** API Key 表单项标签；自定义供应商固定为「API Key」 */
  apiKeyLabel: string
  /** 默认 OpenAI 兼容 Base URL */
  defaultBaseUrl: string
  /** 拉取 /models 失败时的兜底模型 id */
  defaultModel: string
  /**
   * 模型列表完整获取地址（如 https://api.example.com/v1/models）。
   * 为空时回退为 `{defaultBaseUrl}/models`。
   */
  modelsUrl?: string
}

/** 模型能力标签：助手按任务自动选型时使用 */
export type ModelCapability = 'chat' | 'reasoning' | 'vision' | 'longContext' | 'creative'

/**
 * 一条可复用的模型连接（供应商 + Key + 模型）。
 * 为什么：全能助手需为编剧/视频/通用等角色配置不同模型，而非全局单模型。
 */
export interface ModelConnection {
  id: string
  /** 用户可见名称，如「百炼 Qwen Plus」 */
  label: string
  provider: ModelProvider
  apiKey: string
  baseUrl: string
  model: string
  /** 能力标签，助手自动选型时优先匹配 */
  capabilities: ModelCapability[]
}

/**
 * 角色 / 媒体任务 → 模型连接 id。
 * 未映射时回退 defaultConnectionId 或首个连接。
 * 注：字面量与 AgentRoleName 对齐，避免循环引用提前依赖。
 */
export type ModelRoleKey =
  | 'supervisor'
  | 'general'
  | 'researcher'
  | 'writer'
  | 'publisher'
  | 'scriptwriter'
  | 'videographer'
  | 'editor'
  | 'script'
  | 'storyboard'
  | 'video'
  | 'default'

export type RoleModelMap = Partial<Record<ModelRoleKey, string>>

export interface AppSettings {
  /**
   * @deprecated 兼容旧单模型字段；归一化后同步到 connections[0]
   */
  provider: ModelProvider
  /** @deprecated 见 connections */
  apiKey: string
  /** @deprecated 见 connections */
  baseUrl: string
  /** @deprecated 见 connections */
  model: string
  /** 多模型连接列表；至少应有一条默认连接 */
  connections: ModelConnection[]
  /** 默认连接 id；缺省取 connections[0] */
  defaultConnectionId: string
  /** 角色/任务 → 连接映射 */
  roleModelMap: RoleModelMap
  /** 完全访问：跳过部分敏感确认（发布前仍建议确认） */
  fullAccess: boolean
  /** Agent 最大工具轮次 */
  maxTurns: number
  /** 登录系统后自动启动应用 */
  launchAtLogin: boolean
  /** 用户自定义模型供应商列表 */
  customProviders: CustomModelProvider[]
}

export const DEFAULT_CONNECTION_ID = 'conn-default'

/** 内置默认连接 id：Agent 按角色/任务选型时使用 */
export const DEFAULT_CONNECTION_IDS = {
  default: 'conn-default',
  fast: 'conn-fast',
  reason: 'conn-reason',
  creative: 'conn-creative',
  media: 'conn-media'
} as const

const DASHSCOPE_COMPAT_BASE = 'https://dashscope.aliyuncs.com/compatible-mode/v1'

/**
 * 按种子凭证生成一套默认多模型连接。
 * 为什么：Supervisor 按角色路由后，各角色通过 roleModelMap 落到不同模型；
 * 用户可在设置页改模型 / 改映射，也可删减连接。
 */
export function queryBuildDefaultConnections(seed?: {
  apiKey?: string
  provider?: ModelProvider
  baseUrl?: string
}): ModelConnection[] {
  const apiKey = seed?.apiKey?.trim() ?? ''
  const provider = seed?.provider ?? 'dashscope'
  const baseUrl =
    seed?.baseUrl?.trim() ||
    (provider === 'deepseek'
      ? 'https://api.deepseek.com'
      : provider === 'openai_compatible'
        ? 'https://api.openai.com/v1'
        : DASHSCOPE_COMPAT_BASE)

  if (provider === 'deepseek') {
    return [
      {
        id: DEFAULT_CONNECTION_IDS.default,
        label: '通用对话（DeepSeek Flash）',
        provider: 'deepseek',
        apiKey,
        baseUrl,
        model: 'deepseek-v4-flash',
        capabilities: ['chat']
      },
      {
        id: DEFAULT_CONNECTION_IDS.fast,
        label: '路由调度（DeepSeek Flash）',
        provider: 'deepseek',
        apiKey,
        baseUrl,
        model: 'deepseek-v4-flash',
        capabilities: ['chat']
      },
      {
        id: DEFAULT_CONNECTION_IDS.reason,
        label: '调研推理（DeepSeek Pro）',
        provider: 'deepseek',
        apiKey,
        baseUrl,
        model: 'deepseek-v4-pro',
        capabilities: ['reasoning', 'chat']
      },
      {
        id: DEFAULT_CONNECTION_IDS.creative,
        label: '创作编剧（DeepSeek Flash）',
        provider: 'deepseek',
        apiKey,
        baseUrl,
        model: 'deepseek-v4-flash',
        capabilities: ['creative', 'chat']
      },
      // 媒体（万相/TTS）仍走百炼 HTTP，单独留一条空 Key 连接便于用户补填
      {
        id: DEFAULT_CONNECTION_IDS.media,
        label: '媒体生成（百炼 · 万相/TTS）',
        provider: 'dashscope',
        apiKey: '',
        baseUrl: DASHSCOPE_COMPAT_BASE,
        model: 'qwen-plus',
        capabilities: ['vision', 'chat']
      }
    ]
  }

  // 默认：阿里云百炼（与主设置页默认供应商一致）
  return [
    {
      id: DEFAULT_CONNECTION_IDS.default,
      label: '通用对话（Qwen Plus）',
      provider: 'dashscope',
      apiKey,
      baseUrl: baseUrl || DASHSCOPE_COMPAT_BASE,
      model: 'qwen-plus',
      capabilities: ['chat']
    },
    {
      id: DEFAULT_CONNECTION_IDS.fast,
      label: '路由调度（Qwen Turbo）',
      provider: 'dashscope',
      apiKey,
      baseUrl: baseUrl || DASHSCOPE_COMPAT_BASE,
      model: 'qwen-turbo',
      capabilities: ['chat']
    },
    {
      id: DEFAULT_CONNECTION_IDS.reason,
      label: '调研推理（Qwen Max）',
      provider: 'dashscope',
      apiKey,
      baseUrl: baseUrl || DASHSCOPE_COMPAT_BASE,
      model: 'qwen-max',
      capabilities: ['reasoning', 'chat', 'longContext']
    },
    {
      id: DEFAULT_CONNECTION_IDS.creative,
      label: '创作编剧（Qwen Plus）',
      provider: 'dashscope',
      apiKey,
      baseUrl: baseUrl || DASHSCOPE_COMPAT_BASE,
      model: 'qwen-plus',
      capabilities: ['creative', 'chat']
    },
    {
      id: DEFAULT_CONNECTION_IDS.media,
      label: '媒体生成（百炼 · 万相/TTS）',
      provider: 'dashscope',
      apiKey,
      baseUrl: baseUrl || DASHSCOPE_COMPAT_BASE,
      model: 'qwen-plus',
      capabilities: ['vision', 'chat']
    }
  ]
}

/** 兼容旧代码：单条默认连接 = 默认套装中的「通用对话」 */
export const DEFAULT_CONNECTION: ModelConnection = queryBuildDefaultConnections()[0]

/**
 * 角色 / 任务 → 默认连接。
 * Agent 图按角色调用 createChatModel(settings, role) 时读取此映射。
 */
export const DEFAULT_ROLE_MODEL_MAP: RoleModelMap = {
  supervisor: DEFAULT_CONNECTION_IDS.fast,
  general: DEFAULT_CONNECTION_IDS.default,
  researcher: DEFAULT_CONNECTION_IDS.reason,
  writer: DEFAULT_CONNECTION_IDS.creative,
  publisher: DEFAULT_CONNECTION_IDS.default,
  scriptwriter: DEFAULT_CONNECTION_IDS.creative,
  videographer: DEFAULT_CONNECTION_IDS.media,
  editor: DEFAULT_CONNECTION_IDS.default,
  script: DEFAULT_CONNECTION_IDS.creative,
  storyboard: DEFAULT_CONNECTION_IDS.creative,
  video: DEFAULT_CONNECTION_IDS.media,
  default: DEFAULT_CONNECTION_IDS.default
}

const DEFAULT_TEMPLATE_IDS = new Set<string>(Object.values(DEFAULT_CONNECTION_IDS))

/**
 * 幂等补齐内置连接模板：保留用户已改动的同 id 连接，补全缺失模板。
 * 若用户已自建非模板连接（多条自定义），则不自动扩容，避免打扰。
 */
export function querySeedDefaultConnections(
  existing: ModelConnection[]
): ModelConnection[] {
  if (existing.length === 0) {
    return queryBuildDefaultConnections()
  }

  const onlyTemplatesOrSingle =
    existing.length === 1 || existing.every((c) => DEFAULT_TEMPLATE_IDS.has(c.id))
  if (!onlyTemplatesOrSingle) {
    return existing
  }

  const primary = existing[0]
  const templates = queryBuildDefaultConnections({
    apiKey: primary.apiKey,
    provider: primary.provider,
    baseUrl: primary.baseUrl
  })
  const byId = new Map(existing.map((c) => [c.id, c]))
  const merged: ModelConnection[] = []

  for (const template of templates) {
    const prev = byId.get(template.id)
    if (prev) {
      // 保留用户改过的 label/model/capabilities；空 Key 时继承主连接 Key（同供应商）
      merged.push({
        ...template,
        ...prev,
        apiKey:
          prev.apiKey.trim() ||
          (prev.provider === primary.provider ? primary.apiKey : prev.apiKey),
        capabilities: prev.capabilities?.length ? prev.capabilities : template.capabilities
      })
      byId.delete(template.id)
    } else {
      merged.push({
        ...template,
        apiKey:
          template.provider === primary.provider
            ? primary.apiKey
            : template.apiKey
      })
    }
  }

  // 追加用户额外保留的同模板套装外连接（理论上 onlyTemplates 时为空）
  for (const leftover of byId.values()) {
    merged.push(leftover)
  }
  return merged
}

/**
 * 合并角色映射：用户已填的键优先；缺失键用默认映射（连接不存在则回退 fallbackId）。
 */
export function queryMergeDefaultRoleModelMap(
  existing: RoleModelMap | undefined,
  connectionIds: Set<string>,
  fallbackId: string
): RoleModelMap {
  const next: RoleModelMap = { ...DEFAULT_ROLE_MODEL_MAP }
  for (const [role, connId] of Object.entries(DEFAULT_ROLE_MODEL_MAP) as [
    ModelRoleKey,
    string
  ][]) {
    if (!connectionIds.has(connId)) {
      next[role] = fallbackId
    }
  }
  if (existing) {
    for (const [role, connId] of Object.entries(existing) as [ModelRoleKey, string][]) {
      if (connId && connectionIds.has(connId)) {
        next[role] = connId
      }
    }
  }
  return next
}

export const DEFAULT_SETTINGS: AppSettings = {
  provider: 'dashscope',
  apiKey: '',
  baseUrl: DASHSCOPE_COMPAT_BASE,
  model: 'qwen-plus',
  connections: queryBuildDefaultConnections(),
  defaultConnectionId: DEFAULT_CONNECTION_ID,
  roleModelMap: { ...DEFAULT_ROLE_MODEL_MAP },
  fullAccess: false,
  maxTurns: 40,
  launchAtLogin: false,
  customProviders: []
}

/** 模型供应商选项（聊天与设置页共用） */
export interface ModelProviderOption {
  value: ModelProvider
  label: string
  apiKeyLabel: string
  defaultBaseUrl: string
  defaultModel: string
  /** 可选：自定义模型列表完整 URL；优先于 Base URL + /models */
  modelsUrl?: string
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
  },
  {
    value: 'openai_compatible',
    label: 'OpenAI 兼容',
    apiKeyLabel: 'API Key',
    defaultBaseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini'
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
  /**
   * 模型类型（文本对话 / 视觉理解 / 语音合成等）。
   * 下拉项优先展示，便于从平台长列表中快速筛选。
   */
  category?: string
}

/**
 * 根据模型 id 推断类型文案。
 * 为什么：百炼 /models 常只返回 id，用命名约定区分对话、视觉、语音、向量等。
 */
export function queryModelCategory(modelId: string): string {
  const id = modelId.trim().toLowerCase()
  if (!id) return '未知'

  if (
    /(^|[-_/])(vl|vision|qvq|ocr|image-understand|visual)([-_/]|$)/.test(id) ||
    id.includes('qwen-vl') ||
    id.includes('qwen2-vl') ||
    id.includes('qwen2.5-vl')
  ) {
    return '视觉理解'
  }
  if (
    /(tts|cosyvoice|speech|audio|asr|paraformer|sambert)/.test(id) ||
    id.includes('qwen-audio')
  ) {
    return '语音'
  }
  if (/(wanx|wan2\.|t2i|text2image|image-synthesis|flux|stable-diffusion)/.test(id)) {
    return '文生图'
  }
  if (/(i2v|image2video|video-generation|animate|kling)/.test(id)) {
    return '图生视频'
  }
  if (/(embedding|text-embedding|bge-)/.test(id)) {
    return '向量嵌入'
  }
  if (/rerank/.test(id)) {
    return '重排序'
  }
  if (/(coder|code)/.test(id)) {
    return '代码'
  }
  if (/math/.test(id)) {
    return '数学'
  }
  if (/omni/.test(id)) {
    return '全模态'
  }
  if (/(long|longcontext)/.test(id)) {
    return '长文本'
  }
  if (
    /(reasoner|reasoning|thinking|r1|qwq)/.test(id) ||
    id.includes('deepseek-r1')
  ) {
    return '深度推理'
  }
  if (/(turbo|flash)/.test(id)) {
    return '高速对话'
  }
  if (/(max|plus|pro|chat)/.test(id) || /^qwen/.test(id) || /^deepseek/.test(id)) {
    return '文本对话'
  }
  return '通用模型'
}

/** 下拉展示：名称 · 类型 — 说明 */
export function queryModelOptionDisplayLabel(option: ModelOption): string {
  const category = option.category || queryModelCategory(option.value)
  const head = `${option.label} · ${category}`
  return option.description ? `${head} — ${option.description}` : head
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

/** 判断是否为内置供应商 */
export function queryIsBuiltInProvider(provider: ModelProvider): provider is BuiltInModelProvider {
  return provider === 'dashscope' || provider === 'deepseek' || provider === 'openai_compatible'
}

/** 生成新的自定义供应商 id */
export function queryNewCustomProviderId(): CustomModelProviderId {
  const suffix = Math.random().toString(36).slice(2, 8)
  return `custom:${Date.now().toString(36)}-${suffix}`
}

/** 是否为用户自定义供应商 id（`custom:` 前缀） */
export function queryIsCustomModelProvider(provider: ModelProvider | string): boolean {
  return String(provider).startsWith('custom:')
}

/**
 * 从列表中移除指定自定义供应商。
 * 内置供应商 id 不会改动列表。
 */
export function queryRemoveCustomProvider(
  customProviders: CustomModelProvider[],
  providerId: ModelProvider | string
): CustomModelProvider[] {
  if (!queryIsCustomModelProvider(providerId)) return customProviders
  return customProviders.filter((item) => item.id !== providerId)
}

/** 归一化磁盘中的自定义供应商列表，过滤损坏项 */
export function queryNormalizeCustomProviders(raw: unknown): CustomModelProvider[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const result: CustomModelProvider[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    const id = String(row.id ?? '').trim()
    if (!id.startsWith('custom:') || seen.has(id)) continue
    const label = String(row.label ?? '').trim()
    if (!label) continue
    seen.add(id)
    const modelsUrl = String(row.modelsUrl ?? '').trim()
    result.push({
      id: id as CustomModelProviderId,
      label,
      // 为什么：自定义供应商统一用「API Key」，不再支持自定义标签
      apiKeyLabel: 'API Key',
      defaultBaseUrl: String(row.defaultBaseUrl ?? '').trim(),
      defaultModel: String(row.defaultModel ?? '').trim() || 'gpt-4o-mini',
      ...(modelsUrl ? { modelsUrl } : {})
    })
  }
  return result
}

/** 合并内置与用户自定义供应商，供设置页与多模型连接下拉使用 */
export function queryAllProviderOptions(
  customProviders: CustomModelProvider[] = []
): ModelProviderOption[] {
  return [
    ...MODEL_PROVIDER_OPTIONS,
    ...customProviders.map((provider) => ({
      value: provider.id,
      label: provider.label,
      apiKeyLabel: provider.apiKeyLabel || 'API Key',
      defaultBaseUrl: provider.defaultBaseUrl,
      defaultModel: provider.defaultModel,
      ...(provider.modelsUrl?.trim() ? { modelsUrl: provider.modelsUrl.trim() } : {})
    }))
  ]
}

/**
 * 查询供应商元数据。
 * 自定义项优先查 customProviders；缺失时回退 OpenAI 兼容模板，避免损坏配置导致白屏。
 */
export function queryProviderOption(
  provider: ModelProvider,
  customProviders: CustomModelProvider[] = []
): ModelProviderOption {
  const builtIn = MODEL_PROVIDER_OPTIONS.find((option) => option.value === provider)
  if (builtIn) return builtIn

  const custom = customProviders.find((item) => item.id === provider)
  if (custom) {
    return {
      value: custom.id,
      label: custom.label,
      apiKeyLabel: custom.apiKeyLabel || 'API Key',
      defaultBaseUrl: custom.defaultBaseUrl,
      defaultModel: custom.defaultModel,
      ...(custom.modelsUrl?.trim() ? { modelsUrl: custom.modelsUrl.trim() } : {})
    }
  }

  if (provider.startsWith('custom:')) {
    const fallbackLabel = provider.slice('custom:'.length) || '自定义供应商'
    return {
      value: provider,
      label: fallbackLabel,
      apiKeyLabel: 'API Key',
      defaultBaseUrl: '',
      defaultModel: 'gpt-4o-mini'
    }
  }

  return MODEL_PROVIDER_OPTIONS[0]
}

/** 返回供应商可用模型，避免模型与 Base URL 交叉配置。 */
export function queryModelOptions(provider: ModelProvider): ModelOption[] {
  return MODEL_OPTIONS.filter((option) => option.provider === provider)
}

/** 根据 model id 取展示名；未知模型回退为原始 id */
export function queryModelLabel(model: string): string {
  return MODEL_OPTIONS.find((m) => m.value === model)?.label ?? model
}

/**
 * 从 settings 解析应使用的模型连接。
 * 优先级：purpose 映射 → defaultConnectionId → connections[0] → 旧单模型字段。
 */
export function queryModelConnection(
  settings: AppSettings,
  purpose?: ModelRoleKey
): ModelConnection {
  const connections =
    settings.connections?.length > 0
      ? settings.connections
      : [
          {
            id: DEFAULT_CONNECTION_ID,
            label: '默认',
            provider: settings.provider,
            apiKey: settings.apiKey,
            baseUrl: settings.baseUrl,
            model: settings.model,
            capabilities: ['chat'] as ModelCapability[]
          }
        ]

  if (purpose && settings.roleModelMap?.[purpose]) {
    const mapped = connections.find((c) => c.id === settings.roleModelMap[purpose])
    if (mapped) return mapped
  }

  const defaultId = settings.defaultConnectionId || connections[0]?.id
  const byDefault = connections.find((c) => c.id === defaultId)
  if (byDefault) return byDefault
  return connections[0]
}

/** 按能力标签挑选连接；无匹配则回退 queryModelConnection */
export function queryModelConnectionByCapability(
  settings: AppSettings,
  capability: ModelCapability
): ModelConnection {
  const connections = settings.connections ?? []
  const hit = connections.find((c) => c.capabilities?.includes(capability) && c.apiKey.trim())
  return hit ?? queryModelConnection(settings, 'default')
}

/**
 * 从设置中解析某供应商已保存的凭证。
 * 优先级：顶层「模型与 API」字段（同 provider）→ 任意同 provider 连接 → 供应商默认地址/模型。
 */
export function queryProviderCredentialsFromSettings(
  settings: Pick<
    AppSettings,
    'provider' | 'apiKey' | 'baseUrl' | 'model' | 'connections' | 'customProviders'
  >,
  provider: ModelProvider
): Pick<AppSettings, 'apiKey' | 'baseUrl' | 'model'> {
  const customProviders = settings.customProviders ?? []
  if (settings.provider === provider) {
    const topKey = settings.apiKey.trim()
    if (topKey) {
      return {
        apiKey: settings.apiKey,
        baseUrl:
          settings.baseUrl.trim() ||
          queryProviderOption(provider, customProviders).defaultBaseUrl,
        model:
          settings.model.trim() || queryProviderOption(provider, customProviders).defaultModel
      }
    }
  }

  const fromConn = settings.connections?.find(
    (conn) => conn.provider === provider && conn.apiKey.trim()
  )
  if (fromConn) {
    const meta = queryProviderOption(provider, customProviders)
    return {
      apiKey: fromConn.apiKey,
      baseUrl: fromConn.baseUrl.trim() || meta.defaultBaseUrl,
      model: fromConn.model.trim() || meta.defaultModel
    }
  }

  const meta = queryProviderOption(provider, customProviders)
  return {
    apiKey: '',
    baseUrl: meta.defaultBaseUrl,
    model: meta.defaultModel
  }
}

/**
 * 按供应商绑定 API Key，并补齐缺失的 baseUrl/model。
 * 用于多模型连接面板与设置归一化，保证与「模型与 API」页凭证一致。
 */
export function querySyncConnectionsProviderCredentials(
  connections: ModelConnection[],
  settings: Pick<
    AppSettings,
    'provider' | 'apiKey' | 'baseUrl' | 'model' | 'connections' | 'customProviders'
  >
): ModelConnection[] {
  const customProviders = settings.customProviders ?? []
  const providerCreds = new Map<ModelProvider, Pick<AppSettings, 'apiKey' | 'baseUrl' | 'model'>>()

  const providerIds = new Set<ModelProvider>([
    ...MODEL_PROVIDER_OPTIONS.map((option) => option.value),
    ...customProviders.map((provider) => provider.id),
    ...connections.map((conn) => conn.provider)
  ])

  for (const provider of providerIds) {
    providerCreds.set(provider, queryProviderCredentialsFromSettings(settings, provider))
  }

  for (const conn of connections) {
    const key = conn.apiKey.trim()
    if (!key) continue
    const meta = queryProviderOption(conn.provider, customProviders)
    providerCreds.set(conn.provider, {
      apiKey: conn.apiKey,
      baseUrl: conn.baseUrl.trim() || meta.defaultBaseUrl,
      model: conn.model.trim() || meta.defaultModel
    })
  }

  return connections.map((conn) => {
    const creds =
      providerCreds.get(conn.provider) ??
      queryProviderCredentialsFromSettings(settings, conn.provider)
    const meta = queryProviderOption(conn.provider, customProviders)
    return {
      ...conn,
      apiKey: conn.apiKey.trim() ? conn.apiKey : creds.apiKey,
      baseUrl: conn.baseUrl.trim() ? conn.baseUrl : creds.baseUrl || meta.defaultBaseUrl,
      model: conn.model.trim() ? conn.model : creds.model || meta.defaultModel
    }
  })
}

/** 聊天消息角色 */
export type MessageRole = 'user' | 'assistant' | 'system' | 'tool'

/** assistant 消息上持久化的 tool_call，供进程重启后冷启动回填模型 */
export interface ChatMessageToolCall {
  id: string
  name: string
  args: Record<string, unknown>
}

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  /** tool 调用时的工具名 */
  toolName?: string
  /** 关联 tool_call_id */
  toolCallId?: string
  /**
   * assistant 发起的 tool_calls。
   * 为什么：仅落盘 content 时重启后无法还原 tool_calls，会与后续 tool 消息断裂。
   */
  toolCalls?: ChatMessageToolCall[]
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
  /** 累计触发执行次数（含定时触发与「立即执行」；旧数据无此字段时由 lastRunAt 推断） */
  runCount?: number
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
  | 'scriptwriter'
  | 'videographer'
  | 'editor'

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
  /** 任务内容驱动换模：当前使用的连接/能力 */
  | {
      type: 'model_switch'
      sessionId: string
      capability: ModelCapability
      model: string
      connectionLabel: string
    }
  /** 任务/流程每次执行新建会话时推送，渲染进程据此在侧边栏展示新对话 */
  | { type: 'session_started'; sessionId: string; session: Session }
  /** 工作流 Toast 节点触发，渲染进程展示 Ant Design message */
  | {
    type: 'workflow_toast'
    sessionId: string
    level: WorkflowToastLevel
    content: string
  }
  /** LLM 调用结束后的 token 累计更新（执行中实时刷新 UI） */
  | { type: 'token_update'; sessionId: string; tokenUsed: number; delta: number }

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

/** Toast 级别，对应 Ant Design message */
export type WorkflowToastLevel = 'success' | 'error' | 'warning' | 'info'

/**
 * 渠道通知节点：从 WorkflowRun.context 插值标题/正文后推送到通知渠道（飞书等）。
 * 上游节点通过 outputKeys 或 @@workflow_ctx@@ 写入 context，正文模板用 {{key}} 引用。
 */
export interface WorkflowNotifyNode {
  id: string
  type: 'notify'
  title: string
  /** 通知渠道 id，如 feishu */
  channelId: string
  /** 推送标题模板，支持 {{contextKey}} */
  titleTemplate?: string
  /** 推送正文模板，支持 {{contextKey}} */
  contentTemplate: string
  /** 飞书 Markdown 富文本 */
  richText?: boolean
  /** 发送失败时继续流程（默认 true，对齐发布计划「通知失败可忽略」） */
  failSoft?: boolean
  /** 可选：将发送结果摘要写入 context */
  outputKeys?: string[]
}

/**
 * 应用内 Toast 节点：流程执行时通过 IPC 触发渲染进程 Ant Design message。
 * 内容同样支持 {{contextKey}} 引用上游返回值。
 */
export interface WorkflowToastNode {
  id: string
  type: 'toast'
  title: string
  level: WorkflowToastLevel
  /** 展示内容模板，支持 {{contextKey}} */
  contentTemplate: string
  /** 可选：将展示内容写入 context */
  outputKeys?: string[]
}

/**
 * 并行组：组间串行，组内叶子并行（P0 引擎可先串行展开 children）。
 * children 仅允许 agent / tool / await_user / notify / toast。
 */
export interface WorkflowParallelNode {
  id: string
  type: 'parallel'
  title: string
  children: Array<
    | WorkflowAgentNode
    | WorkflowToolNode
    | WorkflowAwaitNode
    | WorkflowNotifyNode
    | WorkflowToastNode
  >
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

export type WorkflowLeafNode =
  | WorkflowAgentNode
  | WorkflowToolNode
  | WorkflowAwaitNode
  | WorkflowNotifyNode
  | WorkflowToastNode
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
  queryLocalMediaUrl: (filePath: string) => Promise<string | null>
  queryAgentRules: () => Promise<AgentRule[]>
  postAgentRule: (input: AgentRuleUpsertInput) => Promise<AgentRule>
  postDeleteAgentRule: (id: string) => Promise<void>
  queryWorkflows: () => Promise<WorkflowDefinition[]>
  queryWorkflow: (id: string) => Promise<WorkflowDefinition | null>
  postWorkflow: (workflow: WorkflowDefinition) => Promise<WorkflowDefinition>
  postDeleteWorkflow: (id: string) => Promise<void>
  postRunWorkflow: (workflowId: string) => Promise<WorkflowRunStartResult>
  postResumeWorkflow: (runId: string) => Promise<WorkflowRunStartResult>
  /** 业务系统：全部工作流运行实例 */
  queryWorkflowRuns: () => Promise<WorkflowRun[]>
  /** 业务系统：按会话取最近一次工作流运行（含节点 context） */
  queryLatestWorkflowRunBySession: (sessionId: string) => Promise<WorkflowRun | null>
  onAgentEvent: (cb: (event: AgentEvent) => void) => () => void
  onBrowserFrame: (cb: (frame: BrowserFramePayload) => void) => () => void
  onScheduleUpdate: (cb: (tasks: ScheduledTask[]) => void) => () => void
  /** 选择本地图片文件 */
  postSelectImages: () => Promise<string[]>
  /** 在系统默认浏览器中打开链接 */
  postOpenExternal: (url: string) => Promise<void>
  /** 在系统文件管理器中显示本地文件（成片/剧本等产物） */
  postRevealPath: (filePath: string) => Promise<{ ok: true } | { ok: false; error: string }>
}

declare global {
  interface Window {
    api: ElectronApi
  }
}
