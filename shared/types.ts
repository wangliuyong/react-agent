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
  postAgentResyncRenderer: 'post:agent:resync-renderer',
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
  /** 从会话成功步骤总结技能草稿（LLM + 规则兜底） */
  postSummarizeSkillFromSession: 'post:skill-summarize-from-session',
  queryLocalImageDataUrl: 'query:local-image-data-url',
  /** 本地音视频 → media:// URL，供聊天内联播放 */
  queryLocalMediaUrl: 'query:local-media-url',
  /** 校验本地文件/目录是否存在（产物按钮展示前过滤） */
  queryLocalPathExists: 'query:local-path-exists',
  /** A 股 K 线实时刷新（聊天预览轮询） */
  queryAshareKlineRefresh: 'query:ashare-kline-refresh',
  /** Agent 工具注册表 + 角色注入（设置页只读） */
  queryAgentToolsCatalog: 'query:agent-tools-catalog',
  /** 设置页：列举 Agent 生成的本地文件 */
  queryAgentAssets: 'query:agent-assets',
  /** 设置页：删除单个 Agent 产出文件 */
  postDeleteAgentAsset: 'post:agent-asset:delete',
  /** 设置页：批量删除 Agent 产出文件 */
  postDeleteAgentAssets: 'post:agent-assets:delete-batch',
  /** 设置页：一键清空全部 Agent 产出 */
  postClearAgentAssets: 'post:agent-assets:clear',
  /** 设置页：读取文本类资产预览 */
  queryAgentAssetTextPreview: 'query:agent-asset:text-preview',
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
  onPublishPlansUpdate: 'event:publish-plans-update',
  onAgentRulesUpdate: 'event:agent-rules-update',
  /** 在系统文件管理器中显示本地路径 */
  postRevealPath: 'post:reveal-path',
  /** 在系统默认浏览器中打开本地文件（HTML 等） */
  postOpenLocalFile: 'post:open-local-file'
} as const

export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels]

/** 应用设置（本地 JSON 缓存） */
export type BuiltInModelProvider = 'dashscope' | 'deepseek' | 'ofox' | 'openai_compatible'
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

/** 模型能力标签：助手按任务自动选型时使用。creative = 文生图/图生成视频 */
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
  | `custom_${string}`

export type RoleModelMap = Partial<Record<ModelRoleKey, string>>

/** 用户自定义角色补充说明，追加到内置 system prompt 之后 */
export type RolePromptOverrides = Partial<Record<ModelRoleKey, string>>

/**
 * 聊天多角色管线工具注入覆盖。
 * - 缺省（未配置该角色键）：使用代码内置 ROLE_WHITELIST
 * - null：注入全部已注册工具
 * - string[]：显式白名单（空数组表示不注入任何工具）
 */
export type RoleToolWhitelistOverrides = Partial<Record<ModelRoleKey, string[] | null>>

/** 参与聊天管线、可在设置中维护工具注入的角色（不含 supervisor） */
export const CHAT_PIPELINE_AGENT_ROLES = [
  'general',
  'researcher',
  'writer',
  'publisher',
  'scriptwriter',
  'videographer',
  'editor'
] as const satisfies ReadonlyArray<ModelRoleKey>

/** 是否可在设置页维护工具注入的 ModelRoleKey（含 custom_*） */
export function queryIsChatPipelineRole(role: ModelRoleKey): boolean {
  if (role.startsWith('custom_')) return true
  return (CHAT_PIPELINE_AGENT_ROLES as readonly string[]).includes(role)
}

/** 归一化用户保存的角色工具白名单覆盖 */
export function queryNormalizeRoleToolWhitelistOverrides(
  raw: unknown
): RoleToolWhitelistOverrides {
  if (!raw || typeof raw !== 'object') return {}
  const out: RoleToolWhitelistOverrides = {}
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    if (!queryIsChatPipelineRole(key as ModelRoleKey)) continue
    if (val === null) {
      out[key as ModelRoleKey] = null
      continue
    }
    if (Array.isArray(val)) {
      const names = val.map((item) => String(item).trim()).filter(Boolean)
      out[key as ModelRoleKey] = names
    }
  }
  return out
}

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
  /** 用户自定义角色补充说明，追加到内置 system prompt */
  rolePromptOverrides: RolePromptOverrides
  /** 用户自定义聊天管线角色工具白名单（相对内置 ROLE_WHITELIST） */
  roleToolWhitelistOverrides: RoleToolWhitelistOverrides
  /** 用户新增的自定义聊天角色（内置角色不可删） */
  customAgentRoles: CustomAgentRole[]
  /** 完全访问：跳过部分敏感确认（发布前仍建议确认） */
  fullAccess: boolean
  /** DeepSeek 等模型的 thinking/推理过程输出开关（影响 reasoning_content 注入） */
  thinkingEnabled: boolean
  /** Agent 最大工具轮次 */
  maxTurns: number
  /** 登录系统后自动启动应用 */
  launchAtLogin: boolean
  /** 用户自定义模型供应商列表 */
  customProviders: CustomModelProvider[]
  /**
   * 按供应商手动维护的模型目录（编码、上下文、规模、类型等）。
   * 与平台 /models 拉取结果合并后用于设置页与连接下拉。
   */
  providerModelCatalog: ProviderModelCatalog
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
/** OfoxAI OpenAI 兼容网关；模型 id 使用 provider/model-name 格式 */
const OFOX_COMPAT_BASE = 'https://api.ofox.io/v1'

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
      : provider === 'ofox'
        ? OFOX_COMPAT_BASE
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
        // 撰稿/编剧走角色映射；creative 能力仅留给文生图/图生成视频连接
        capabilities: ['chat']
      },
      // 媒体（万相/TTS）；creative 供明确文生图/图生成视频时选型
      {
        id: DEFAULT_CONNECTION_IDS.media,
        label: '媒体生成（百炼 · 万相/TTS）',
        provider: 'dashscope',
        apiKey: '',
        baseUrl: DASHSCOPE_COMPAT_BASE,
        model: 'qwen-plus',
        capabilities: ['vision', 'creative']
      }
    ]
  }

  // OfoxAI：统一网关，模型 id 形如 openai/gpt-4o、anthropic/claude-sonnet-4.6
  if (provider === 'ofox') {
    return [
      {
        id: DEFAULT_CONNECTION_IDS.default,
        label: '通用对话（GPT-4o Mini）',
        provider: 'ofox',
        apiKey,
        baseUrl,
        model: 'openai/gpt-4o-mini',
        capabilities: ['chat']
      },
      {
        id: DEFAULT_CONNECTION_IDS.fast,
        label: '路由调度（GPT-4o Mini）',
        provider: 'ofox',
        apiKey,
        baseUrl,
        model: 'openai/gpt-4o-mini',
        capabilities: ['chat']
      },
      {
        id: DEFAULT_CONNECTION_IDS.reason,
        label: '调研推理（Claude Sonnet）',
        provider: 'ofox',
        apiKey,
        baseUrl,
        model: 'anthropic/claude-sonnet-4.6',
        capabilities: ['reasoning', 'chat', 'longContext']
      },
      {
        id: DEFAULT_CONNECTION_IDS.creative,
        label: '创作编剧（GPT-4o）',
        provider: 'ofox',
        apiKey,
        baseUrl,
        model: 'openai/gpt-4o',
        // 撰稿/编剧走角色映射；creative 能力仅留给文生图/图生成视频连接
        capabilities: ['chat', 'vision']
      },
      // 媒体（万相/TTS）；creative 供明确文生图/图生成视频时选型
      {
        id: DEFAULT_CONNECTION_IDS.media,
        label: '媒体生成（百炼 · 万相/TTS）',
        provider: 'dashscope',
        apiKey: '',
        baseUrl: DASHSCOPE_COMPAT_BASE,
        model: 'qwen-plus',
        capabilities: ['vision', 'creative']
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
      // 撰稿/编剧走角色映射；creative 能力仅留给文生图/图生成视频连接
      capabilities: ['chat']
    },
    {
      id: DEFAULT_CONNECTION_IDS.media,
      label: '媒体生成（百炼 · 万相/TTS）',
      provider: 'dashscope',
      apiKey,
      baseUrl: baseUrl || DASHSCOPE_COMPAT_BASE,
      model: 'qwen-plus',
      // vision + creative：识图与明确文生图/图生成视频；勿带 chat，避免对话误选
      capabilities: ['vision', 'creative']
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

/**
 * 各角色 / 任务的默认补充设定，追加到内置 system prompt 之后。
 * 新用户与未自定义角色会采用此文案；用户清空某角色时会写入空字符串以保留「已关闭默认」状态。
 */
export const DEFAULT_ROLE_PROMPT_OVERRIDES: RolePromptOverrides = {
  general:
    '你是一名高级资深的全能桌面 AI 助手，拥有跨领域复杂任务编排与问题诊断经验。善于把模糊需求拆解为清晰步骤，结论先行、表达简洁；不确定时主动追问，绝不编造工具结果或未完成的操作。优先用事实与数据支撑观点，中文回复，语气专业、可靠、亲和。',
  researcher:
    '你是一名高级资深的内容调研员与信息架构师，擅长从热点与网络素材中提炼可落地的选题方向。你只负责调研与汇总，不写终稿、不发布。输出须结构化：选题建议（2～3 条）、核心要点（bullet）、可用配图路径清单；注重来源可信度、差异化角度，避免同质化热点套路。',
  writer:
    '你是一名高级资深的新媒体撰稿人与品牌文案专家，精通小红书与抖音平台调性与传播规律。基于调研素材撰写标题、正文与话题标签；小红书标题≤20 字、正文≤1000 字，抖音标题≤30 字。文风有代入感、信息密度高，每篇须有明显差异，禁止模板化换词。你只撰稿，不调用发布工具。',
  publisher:
    '你是一名高级资深的社媒运营与多渠道发布专家，熟悉小红书、抖音图文发布流程与平台风控。严格以工具返回结果为准，绝不声称发布成功除非工具明确成功。发布前核对标题、正文、配图路径齐全；尊重频次限制与深夜禁发规则；失败时给出可操作的排查与重试建议。',
  scriptwriter:
    '你是一名高级资深的短视频编剧与分镜策划师，擅长将创意扩展为可拍摄的完整剧本与精细化分镜。默认竖版 9:16，4～8 镜、每镜 2～15 秒，叙事起承转合完整。旁白口语化，画面描述具体（主体+场景+动作+运镜+光影），negativePrompt 须防人脸扭曲与肢体崩坏。只完成剧本与分镜落盘，不生成素材、不合成成片。',
  videographer:
    '你是一名高级资深的 AI 视频生成工程师，精通文生图、图生视频与 TTS 旁白管线。你根据上游分镜调用渲染工具，不擅自改写剧本。如实汇报每镜 T2I/I2V/TTS 成败与 manifest 路径；API 异常时说明原因并建议补救，不夸大渲染效果。',
  editor:
    '你是一名高级资深的视频剪辑师与后期统筹，负责多镜素材的音画对齐、粗剪拼接与成片导出。全片须审核叙事连贯、音画同步、无畸形闪烁残留；成片路径以 compose_video 返回为准。保留 manifest 便于二次修改，需要时可通知用户成片已就绪。',
  script:
    '你是一名高级资深的短视频剧本创作者，专注于将用户一句话需求扩展为结构完整、可拍摄的剧本文档。明确主题、受众、时长、画幅与整体风格；情节有起承转合，旁白适合口播，输出可直接供分镜环节使用。',
  storyboard:
    '你是一名高级资深的分镜师与视觉提示词工程师，擅长把剧本拆解为 4～8 个可渲染镜头。每镜须含 visual、narration、durationSec、cameraMotion、style、negativePrompt、aspectRatio；画面描述足够具体以供 AI 生成，镜头间叙事连贯、节奏分明。',
  video:
    '你是一名高级资深的 AI 视听制作专家，负责驱动从场景素材到成片的完整视频生成任务。按 manifest 或分镜顺序推进 T2I/I2V/TTS 与合成，逐步汇报进度与文件路径；失败如实说明，不跳步声称完成。'
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

/**
 * 合并角色设定补充：默认文案打底，用户已填键优先；显式空字符串表示用户关闭该角色默认设定，
 * 且必须保留空字符串写入结果，避免下次启动再次回填默认文案。
 */
export function queryMergeDefaultRolePromptOverrides(
  existing: RolePromptOverrides | undefined
): RolePromptOverrides {
  const next: RolePromptOverrides = { ...DEFAULT_ROLE_PROMPT_OVERRIDES }
  if (!existing) return next

  for (const [role, text] of Object.entries(existing) as [ModelRoleKey, string | undefined][]) {
    const trimmed = String(text ?? '').trim()
    if (trimmed) {
      next[role] = trimmed
    } else if (role in existing) {
      next[role] = ''
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
  rolePromptOverrides: { ...DEFAULT_ROLE_PROMPT_OVERRIDES },
  roleToolWhitelistOverrides: {},
  customAgentRoles: [],
  fullAccess: false,
  thinkingEnabled: false,
  maxTurns: 40,
  launchAtLogin: false,
  customProviders: [],
  providerModelCatalog: {}
}

/**
 * 用户在设置页为某供应商手动登记的一条模型元数据。
 * modelId 与 OpenAI 兼容接口中的 model 字段一致。
 */
export interface ProviderModelRecord {
  /** 列表行稳定 id（编辑/删除用） */
  id: string
  /** 模型编码（API model 字段） */
  modelId: string
  /** 展示名称；为空时回退 modelId */
  displayName?: string
  /** 上下文窗口，如 128K、200000 */
  contextWindow?: string
  /** 参数量 / 规模，如 7B、235B-A22B */
  size?: string
  /** 模型类型文案，如「文本对话」「视觉理解」 */
  category?: string
  /** 补充说明 */
  description?: string
  /** 是否支持 thinking / reasoning 开关 */
  supportsThinking?: boolean
  /** 是否支持视觉输入 */
  supportsVision?: boolean
}

/** 供应商 id → 手动维护的模型列表 */
export type ProviderModelCatalog = Partial<Record<ModelProvider, ProviderModelRecord[]>>

/** 设置页模型类型下拉常用项 */
export const PROVIDER_MODEL_CATEGORY_PRESETS = [
  '文本对话',
  '高速对话',
  '深度推理',
  '视觉理解',
  '长文本',
  '代码',
  '语音',
  '文生图',
  '图生视频',
  '向量嵌入',
  '全模态',
  '通用模型'
] as const

/** 生成模型目录行 id */
export function queryNewProviderModelRecordId(): string {
  const suffix = Math.random().toString(36).slice(2, 8)
  return `pm-${Date.now().toString(36)}-${suffix}`
}

/** 归一化磁盘中的 providerModelCatalog，去重 modelId、剥离空行 */
export function queryNormalizeProviderModelCatalog(raw: unknown): ProviderModelCatalog {
  if (!raw || typeof raw !== 'object') return {}
  const result: ProviderModelCatalog = {}
  for (const [providerKey, list] of Object.entries(raw as Record<string, unknown>)) {
    if (!Array.isArray(list)) continue
    const seen = new Set<string>()
    const records: ProviderModelRecord[] = []
    for (const item of list) {
      if (!item || typeof item !== 'object') continue
      const row = item as Record<string, unknown>
      const modelId = String(row.modelId ?? row.value ?? '').trim()
      if (!modelId || seen.has(modelId)) continue
      seen.add(modelId)
      const displayName = String(row.displayName ?? row.label ?? '').trim()
      const contextWindow = String(row.contextWindow ?? '').trim()
      const size = String(row.size ?? '').trim()
      const category = String(row.category ?? '').trim()
      const description = String(row.description ?? '').trim()
      const id = String(row.id ?? '').trim() || queryNewProviderModelRecordId()
      records.push({
        id,
        modelId,
        ...(displayName ? { displayName } : {}),
        ...(contextWindow ? { contextWindow } : {}),
        ...(size ? { size } : {}),
        ...(category ? { category } : {}),
        ...(description ? { description } : {}),
        ...(row.supportsThinking === true ? { supportsThinking: true } : {}),
        ...(row.supportsVision === true ? { supportsVision: true } : {})
      })
    }
    if (records.length > 0) {
      result[providerKey as ModelProvider] = records
    }
  }
  return result
}

/** 读取某供应商下已登记的模型目录 */
export function queryProviderModelCatalogForProvider(
  catalog: ProviderModelCatalog | undefined,
  provider: ModelProvider
): ProviderModelRecord[] {
  return catalog?.[provider] ?? []
}

/** 将手动登记条目转为下拉用的 ModelOption */
export function queryModelOptionsFromProviderRecords(
  provider: ModelProvider,
  records: ProviderModelRecord[]
): ModelOption[] {
  return records.map((record) => {
    const modelId = record.modelId.trim()
    const metaParts = [
      record.size?.trim(),
      record.contextWindow?.trim() ? `上下文 ${record.contextWindow.trim()}` : ''
    ].filter(Boolean)
    const description =
      record.description?.trim() ||
      (metaParts.length > 0 ? metaParts.join(' · ') : undefined)
    return {
      provider,
      value: modelId,
      label: record.displayName?.trim() || modelId,
      description,
      category: record.category?.trim() || queryModelCategory(modelId)
    }
  })
}

/**
 * 合并多来源模型列表（静态兜底、平台拉取、手动目录），按 modelId 去重，后出现的元数据覆盖前者。
 */
export function queryMergeModelOptionLists(...lists: ModelOption[][]): ModelOption[] {
  const map = new Map<string, ModelOption>()
  for (const list of lists) {
    for (const item of list) {
      const value = item.value.trim()
      if (!value) continue
      const prev = map.get(value)
      map.set(value, prev ? { ...prev, ...item, value } : { ...item, value })
    }
  }
  return Array.from(map.values())
}

/**
 * 聊天输入框模型下拉：仅当前选用供应商的本机登记目录。
 * 不合并平台 /models 与静态全量 MODEL_OPTIONS，与设置页「管理模型」一致。
 */
export function queryChatModelOptionsFromCatalog(
  provider: ModelProvider,
  catalog: ProviderModelCatalog | undefined
): ModelOption[] {
  return queryModelOptionsFromProviderRecords(
    provider,
    queryProviderModelCatalogForProvider(catalog, provider)
  )
}

/** 解析某供应商的完整可选模型（静态 + 手动目录 + 可选远程列表） */
export function queryResolvedModelOptionsForProvider(
  provider: ModelProvider,
  catalog: ProviderModelCatalog | undefined,
  remoteModels?: ModelOption[] | null
): ModelOption[] {
  const manual = queryModelOptionsFromProviderRecords(
    provider,
    queryProviderModelCatalogForProvider(catalog, provider)
  )
  const staticFallback = queryModelOptions(provider)
  const remote = remoteModels ?? []
  return queryMergeModelOptionLists(staticFallback, manual, remote)
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
    apiKeyLabel: 'API Key',
    defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-plus'
  },
  {
    value: 'deepseek',
    label: 'DeepSeek',
    apiKeyLabel: 'API Key',
    defaultBaseUrl: 'https://api.deepseek.com',
    /** 与平台当前推荐一致；拉取 /models 失败时也用此默认 */
    defaultModel: 'deepseek-v4-flash'
  },
  {
    value: 'ofox',
    label: 'OfoxAI',
    apiKeyLabel: 'API Key',
    /** OpenAI 兼容协议：https://api.ofox.io/v1；目录与 https://ofox.io/zh/models 一致 */
    defaultBaseUrl: OFOX_COMPAT_BASE,
    /** 拉取 /models 失败时的兜底；模型 id 需带 provider 前缀 */
    defaultModel: 'openai/gpt-4o-mini',
    modelsUrl: `${OFOX_COMPAT_BASE}/models`
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
 * IPC 拉取平台模型列表的返回结构。
 * 为什么：网络失败时不 reject，避免 Electron 主进程打印未处理 handler 错误。
 */
export interface ProviderModelsFetchResult {
  models: ModelOption[]
  /** 平台请求失败时的说明；成功拉取时为 undefined */
  fetchError?: string
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
  // OfoxAI 等聚合网关：模型 id 形如 openai/gpt-4o、anthropic/claude-sonnet-4.6
  if (/(^|\/)(gpt-|o1|o3|o4|claude|gemini)/.test(id)) {
    return '文本对话'
  }
  return '通用模型'
}

/**
 * 判断模型是否支持 thinking / reasoning_content 开关。
 * 覆盖 DeepSeek 官方、百炼托管 DeepSeek、Qwen3 混合思考等兼容 OpenAI 的模型。
 */
export function queryModelSupportsThinking(model: string): boolean {
  const id = model.trim().toLowerCase()
  if (!id) return false
  if (/deepseek/.test(id)) return true
  if (/(reasoner|reasoning|thinking|r1|qwq)/.test(id)) return true
  if (/^qwen3/.test(id)) return true
  if (/kimi-k2/i.test(id)) return true
  if (/^glm-/.test(id)) return true
  return false
}

/**
 * 按供应商与 thinkingEnabled 生成模型 thinking 参数（写入 ChatOpenAI.modelKwargs）。
 * - DeepSeek 官方 API：thinking.type = enabled | disabled
 * - 百炼 / 兼容网关：enable_thinking = true | false（DeepSeek V4、Qwen3 等）
 */
export function queryThinkingModelKwargs(
  settings: Pick<AppSettings, 'thinkingEnabled'>,
  model: string,
  provider: ModelProvider
): Record<string, unknown> | undefined {
  if (!queryModelSupportsThinking(model)) return undefined

  if (provider === 'deepseek') {
    return {
      thinking: { type: settings.thinkingEnabled ? 'enabled' : 'disabled' }
    }
  }

  // 百炼兼容模式、OpenAI 兼容网关等走 enable_thinking
  return { enable_thinking: settings.thinkingEnabled }
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
  /**
   * OfoxAI 静态兜底（拉取 /models 失败时使用）。
   * 模型命名：provider/model-name，见 https://ofox.io/zh/docs/integrations/openai-sdk
   */
  {
    provider: 'ofox',
    value: 'openai/gpt-4o-mini',
    label: 'GPT-4o Mini',
    description: '高速低成本，推荐默认'
  },
  {
    provider: 'ofox',
    value: 'openai/gpt-4o',
    label: 'GPT-4o',
    description: '均衡多模态'
  },
  {
    provider: 'ofox',
    value: 'anthropic/claude-sonnet-4.6',
    label: 'Claude Sonnet 4.6',
    description: '强推理与长上下文'
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
  return (
    provider === 'dashscope' ||
    provider === 'deepseek' ||
    provider === 'ofox' ||
    provider === 'openai_compatible'
  )
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
 * 聊天向内置连接模板（不含媒体）。
 * 切换「当前选用」供应商时，这些连接应跟 endpoint 对齐，避免 Claude 模型打到 DeepSeek。
 */
const CHAT_TEMPLATE_CONNECTION_IDS = new Set<string>([
  DEFAULT_CONNECTION_IDS.default,
  DEFAULT_CONNECTION_IDS.fast,
  DEFAULT_CONNECTION_IDS.reason,
  DEFAULT_CONNECTION_IDS.creative
])

/**
 * 校验 model id 是否属于当前供应商的 endpoint。
 * - 本机目录 / 静态列表命中 → 允许
 * - OpenAI 兼容与自定义供应商 → 不强制白名单
 * - Ofox 无目录时 → 允许 provider/model 前缀格式
 * - DeepSeek / 百炼 → 严格限制，防止聚合网关模型 id 串到官方 API
 */
export function queryIsModelAllowedForProvider(
  provider: ModelProvider,
  modelId: string,
  catalog?: ProviderModelCatalog
): boolean {
  const id = modelId.trim()
  if (!id) return false
  if (provider === 'openai_compatible' || queryIsCustomModelProvider(provider)) {
    return true
  }

  const fromCatalog = queryChatModelOptionsFromCatalog(provider, catalog)
  if (fromCatalog.some((m) => m.value === id)) return true
  if (queryModelOptions(provider).some((m) => m.value === id)) return true

  const catalogRecords = queryProviderModelCatalogForProvider(catalog, provider)
  if (catalogRecords.length > 0) return false

  if (provider === 'deepseek') {
    return !id.includes('/') && /^deepseek-/.test(id)
  }
  if (provider === 'dashscope') {
    return !id.includes('/')
  }
  if (provider === 'ofox') return id.includes('/')
  return false
}

/**
 * 解析供应商可用的 model；非法时回退到供应商默认模型。
 */
export function queryResolveModelForProvider(
  provider: ModelProvider,
  preferred: string,
  catalog?: ProviderModelCatalog,
  customProviders: CustomModelProvider[] = []
): string {
  const id = preferred.trim()
  if (queryIsModelAllowedForProvider(provider, id, catalog)) return id
  return queryProviderOption(provider, customProviders).defaultModel
}

export interface AlignConnectionsToActiveProviderParams {
  connections: ModelConnection[]
  activeProvider: ModelProvider
  activeCreds: Pick<AppSettings, 'apiKey' | 'baseUrl' | 'model'>
  defaultConnectionId: string
  catalog?: ProviderModelCatalog
  customProviders?: CustomModelProvider[]
}

/**
 * 将默认聊天连接校正到「当前选用」供应商。
 * 为什么：顶层 provider 与 connections 默认行不一致时，聊天下拉选 Ofox 模型仍会打到 DeepSeek。
 */
export function queryAlignConnectionsToActiveProvider(
  params: AlignConnectionsToActiveProviderParams
): {
  connections: ModelConnection[]
  defaultConnectionId: string
  model: string
} {
  const customProviders = params.customProviders ?? []
  const activeProvider = params.activeProvider
  const meta = queryProviderOption(activeProvider, customProviders)
  const apiKey = params.activeCreds.apiKey
  const baseUrl = params.activeCreds.baseUrl.trim() || meta.defaultBaseUrl
  const model = queryResolveModelForProvider(
    activeProvider,
    params.activeCreds.model,
    params.catalog,
    customProviders
  )

  const templates = queryBuildDefaultConnections({
    apiKey,
    provider: activeProvider,
    baseUrl
  })
  const templateById = new Map(templates.map((t) => [t.id, t]))

  let connections = params.connections.map((conn) => {
    if (!CHAT_TEMPLATE_CONNECTION_IDS.has(conn.id)) return conn
    const template = templateById.get(conn.id)
    if (!template) return conn
    // 已是当前选用供应商的内置连接：只校正 model，保留原 apiKey/baseUrl，避免切供应商时冲掉其他 Key
    if (conn.provider === activeProvider) {
      const nextModel =
        conn.id === DEFAULT_CONNECTION_IDS.default
          ? model
          : queryResolveModelForProvider(
              activeProvider,
              conn.model,
              params.catalog,
              customProviders
            )
      return {
        ...conn,
        model: nextModel,
        baseUrl: conn.baseUrl.trim() || baseUrl,
        capabilities: template.capabilities?.length ? template.capabilities : conn.capabilities
      }
    }
    const nextModel =
      conn.id === DEFAULT_CONNECTION_IDS.default
        ? model
        : queryResolveModelForProvider(
            activeProvider,
            template.model,
            params.catalog,
            customProviders
          )
    return {
      ...conn,
      provider: activeProvider,
      apiKey,
      baseUrl,
      model: nextModel,
      capabilities: template.capabilities?.length ? template.capabilities : conn.capabilities
    }
  })

  let defaultConnectionId = params.defaultConnectionId
  const defaultConn = connections.find((c) => c.id === defaultConnectionId)
  if (!defaultConn || defaultConn.provider !== activeProvider) {
    const preferred =
      connections.find((c) => c.id === DEFAULT_CONNECTION_IDS.default) ??
      connections.find((c) => c.provider === activeProvider)
    if (preferred?.provider === activeProvider) {
      defaultConnectionId = preferred.id
    } else {
      const id = `cred-${activeProvider}`
      const existingIdx = connections.findIndex((c) => c.id === id)
      const row: ModelConnection = {
        id,
        label: `${meta.label}（凭证）`,
        provider: activeProvider,
        apiKey,
        baseUrl,
        model,
        capabilities: ['chat']
      }
      if (existingIdx >= 0) connections[existingIdx] = { ...connections[existingIdx], ...row }
      else connections = [...connections, row]
      defaultConnectionId = id
    }
  }

  return { connections, defaultConnectionId, model }
}

/**
 * 聊天栏仅更新 model（或顶层凭证）时，写回与当前选用供应商一致的连接行。
 * 会校验 model 是否属于当前 endpoint，并校正脏的默认连接 provider。
 */
export function querySyncTopLevelModelToConnections(
  current: AppSettings,
  partial: Partial<
    Pick<AppSettings, 'provider' | 'apiKey' | 'baseUrl' | 'model' | 'providerModelCatalog'>
  >
): {
  connections: ModelConnection[]
  defaultConnectionId: string
  model: string
  provider: ModelProvider
} {
  const customProviders = current.customProviders ?? []
  const catalog = partial.providerModelCatalog ?? current.providerModelCatalog
  const activeProvider = partial.provider ?? current.provider
  const aligned = queryAlignConnectionsToActiveProvider({
    connections: current.connections.map((c) => ({ ...c })),
    activeProvider,
    activeCreds: {
      apiKey: partial.apiKey ?? current.apiKey,
      baseUrl: partial.baseUrl ?? current.baseUrl,
      model: partial.model ?? current.model
    },
    defaultConnectionId: current.defaultConnectionId,
    catalog,
    customProviders
  })

  // 仅改 model 时：同供应商兄弟连接保留各自 model，只更新默认连接与顶层
  const connections = aligned.connections.map((conn) => {
    if (conn.id !== aligned.defaultConnectionId) return conn
    return {
      ...conn,
      provider: activeProvider,
      apiKey: partial.apiKey ?? current.apiKey ?? conn.apiKey,
      baseUrl: (partial.baseUrl ?? current.baseUrl ?? conn.baseUrl).trim() || conn.baseUrl,
      model: aligned.model
    }
  })

  return {
    connections,
    defaultConnectionId: aligned.defaultConnectionId,
    model: aligned.model,
    provider: activeProvider
  }
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

/**
 * 主聊天链路将使用的模型连接（与主进程 queryResolveModelConnection role=general 一致）。
 * 为什么：顶层 settings.model 可与 defaultConnection 错位，UI 必须以连接为准展示「正在使用」的模型。
 */
export function queryGeneralChatModelConnection(settings: AppSettings): ModelConnection {
  return queryModelConnection(settings, 'general')
}

/** 聊天输入框 / 设置页「当前选用」卡片应展示的 model id */
export function queryGeneralChatModelId(settings: AppSettings): string {
  const fromConnection = queryGeneralChatModelConnection(settings).model.trim()
  if (fromConnection) return fromConnection
  return settings.model.trim()
}

/**
 * model_switch 事件在状态栏的展示文案：连接名 + 可读模型名，避免只显示「默认」而看不出实际 model。
 */
export function queryModelSwitchDisplayLabel(
  connectionLabel: string,
  model: string
): string {
  const label = connectionLabel.trim()
  const modelId = model.trim()
  if (!modelId) return label
  const modelName = queryModelLabel(modelId)
  if (!label) return modelName
  if (label.includes(modelName) || label.includes(modelId)) return label
  return `${label} · ${modelName}`
}

/** 按能力标签挑选连接；无匹配则回退 queryModelConnection */
export function queryModelConnectionByCapability(
  settings: AppSettings,
  capability: ModelCapability
): ModelConnection {
  const connections = settings.connections ?? []
  // 默认连接已具备该能力时优先，避免列表靠前的媒体/凭证连接抢走通用 chat
  const preferred = queryModelConnection(settings, 'default')
  if (preferred.capabilities?.includes(capability) && preferred.apiKey.trim()) {
    return preferred
  }
  const hit = connections.find((c) => c.capabilities?.includes(capability) && c.apiKey.trim())
  return hit ?? preferred
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

/** 用户确认挂起时的可选方案（await_user / present_plan_choices） */
export interface UserChoiceOption {
  id: string
  label: string
  description?: string
}

/** 用户点击「继续」或「发送并继续」时提交的载荷 */
export interface AgentContinuePayload {
  userInput?: string
  choiceId?: string
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
  /**
   * 模型推理 / Agent 思考过程（流式阶段结束后折叠展示）。
   * 为什么：推理内容与最终回答分离，便于用户理解 Agent 决策路径。
   */
  thinkingContent?: string
  /**
   * 等待用户确认时的元数据（切换会话后恢复确认条与方案按钮）。
   * 由 graph-bridge 在 emitAwaitUser 时写入 assistant 占位消息。
   */
  awaitMeta?: {
    reason: string
    choices?: UserChoiceOption[]
    interruptId?: string
  }
  /**
   * 对用户侧聊天隐藏（仍落盘，供业务上下文 / 调试使用）。
   * 工作流 Agent 步骤注入的内部 prompt 等过程信息不应对终端用户展示。
   */
  hidden?: boolean
  /**
   * Agent 执行失败元数据；有值时聊天时间线渲染为错误卡片（刷新后仍可见）。
   */
  errorMeta?: {
    title?: string
  }
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

/** 子 Agent 上下文模式：隔离仅任务说明；fork 继承父会话消息 */
export type SubagentMode = 'isolated' | 'fork'

export type SubagentRunStatus = 'running' | 'done' | 'failed' | 'aborted'

/** 子 Agent 单次运行元数据（挂在父 Session 上，供 UI 展示） */
export interface SubagentRunMeta {
  runId: string
  parentSessionId: string
  agentType: string
  mode: SubagentMode
  description: string
  status: SubagentRunStatus
  startedAt: number
  finishedAt?: number
  summary?: string
}

/** 子 Agent 类型定义（内置管线角色或 custom_*） */
export interface SubagentDefinition {
  id: string
  name: string
  systemPrompt: string
  /** null = 全部工具；数组 = 白名单；缺省由角色默认决定 */
  toolAllowlist?: string[] | null
  toolDenylist?: string[]
  maxTurns?: number
  modelRole?: ModelRoleKey
}

export interface Session {
  id: string
  title: string
  messages: ChatMessage[]
  tasks: TaskItem[]
  /** 会话类型；旧数据缺省时由 querySessionType 推断 */
  type?: SessionType
  /** 子 Agent 运行记录（仅父会话） */
  subagentRuns?: SubagentRunMeta[]
  /** 累计估算 token（展示用） */
  tokenUsed: number
  createdAt: number
  updatedAt: number
}

import type {
  FeishuNotifyMsgType,
  PublishChannelId,
  PublishChannelMeta,
  PublishChannelUpsertInput
} from './publish-channels'

export type {
  FeishuNotifyMsgType,
  PublishChannelId,
  PublishChannelMeta,
  PublishChannelUpsertInput
} from './publish-channels'

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
export type ScheduleRepeat = 'once' | 'daily' | 'weekdays' | 'weekly'

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
  /** HH:mm，daily / weekdays / weekly 使用（兼容旧数据；新数据以 timesOfDay 为准） */
  timeOfDay: string
  /** 每日/工作日/每周多个执行时刻，HH:mm 数组，升序去重 */
  timesOfDay?: string[]
  /** weekly 时 0=周日 … 6=周六 */
  weekday?: number
  /** once 时执行的 Unix 毫秒时间戳 */
  runAt?: number
  /**
   * 循环任务生效区间起点（Unix 毫秒，含当日）。
   * 仅 daily / weekdays / weekly 使用；未设置表示不限制开始。
   */
  activeFrom?: number
  /**
   * 循环任务生效区间终点（Unix 毫秒，含当日）。
   * 仅 daily / weekdays / weekly 使用；未设置表示不限制结束。
   */
  activeUntil?: number
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
  /**
   * 后台执行：开启时不推送 session_started、不跳转聊天，仅在卡片展示执行中状态。
   * 缺省为 true（兼容旧数据）。
   */
  runInBackground?: boolean
  createdAt: number
  updatedAt: number
}

/** Agent 流式事件（主进程推送到渲染进程） */
/** 多智能体当前角色（可选，供 UI 状态文案） */
export type BuiltinAgentRoleName =
  | 'supervisor'
  | 'general'
  | 'researcher'
  | 'writer'
  | 'publisher'
  | 'scriptwriter'
  | 'videographer'
  | 'editor'

/** 内置角色 + 用户自定义 `custom_*` 角色 */
export type AgentRoleName = BuiltinAgentRoleName | `custom_${string}`

/** 用户自定义聊天角色（可增删；由 Supervisor 路由或单步执行） */
export interface CustomAgentRole {
  /** 固定为 custom_ 前缀的 slug */
  id: `custom_${string}`
  label: string
  description: string
  /** 角色系统说明（Markdown），与内置角色同级 */
  systemPrompt: string
  /** null = 注入全部工具；数组 = 白名单 */
  toolWhitelist: string[] | null
  createdAt: number
  updatedAt: number
}

/** 长耗时工具进度快照（Remotion 渲染等） */
export interface ToolProgressPayload {
  /** 0–100 总体进度 */
  percent: number
  /** 当前阶段标识，如 browser | bundle | render */
  phase: string
  /** 阶段说明，如「打包 Composition」「渲染 45%」 */
  message?: string
}

export type AgentEvent =
  | { type: 'text_delta'; sessionId: string; delta: string }
  /** 模型推理 / Agent 步骤思考过程增量 */
  | { type: 'thinking_delta'; sessionId: string; delta: string }
  /** 本轮推理结束，此后才展示工具调用/正式回答/推进工作流 */
  | { type: 'thinking_complete'; sessionId: string }
  | { type: 'message'; sessionId: string; message: ChatMessage }
  | { type: 'tool_start'; sessionId: string; toolName: string; args: unknown }
  | { type: 'tool_result'; sessionId: string; toolName: string; result: string }
  | { type: 'task_update'; sessionId: string; tasks: TaskItem[] }
  | {
      type: 'await_user'
      sessionId: string
      reason: string
      choices?: UserChoiceOption[]
      interruptId?: string
    }
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
  /** 长耗时工具执行中的进度（如 Remotion 渲染） */
  | {
      type: 'tool_progress'
      sessionId: string
      toolName: string
      progress: ToolProgressPayload
    }
  /** 子 Agent 工具调用进度（不写父 session messages） */
  | {
      type: 'subagent_tool'
      sessionId: string
      runId: string
      toolName: string
      phase: 'start' | 'result'
      result?: string
    }
  | { type: 'subagent_start'; sessionId: string; run: SubagentRunMeta; prompt: string }
  | {
      type: 'subagent_done'
      sessionId: string
      runId: string
      summary: string
      status: SubagentRunStatus
    }

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

/** Agent 工具权限级别（与主进程 ToolPermission 对齐） */
export type AgentToolPermission = 'safe' | 'sensitive' | 'dangerous'

/** 工具源码在仓库中的位置（相对路径 + 行号） */
export interface AgentToolSourceLocation {
  relativePath: string
  startLine: number
  endLine: number
}

/** 设置页工具列表单项（元数据 + 可选源码预览） */
export interface AgentToolCatalogItem {
  name: string
  description: string
  permission: AgentToolPermission
  /** 设置页「使用说明」展示的 Markdown（由主进程生成） */
  usageGuide: string
  /** JSON Schema 风格参数定义 */
  parameters: Record<string, unknown>
  source: AgentToolSourceLocation | null
  /** 抽取的 export const 定义块；读取失败时为 null */
  sourceCode: string | null
}

/** 某角色当前注入的工具集合 */
export interface AgentRoleToolInjection {
  role: AgentRoleName
  /** all = 全量注册表；whitelist = 显式名单；none = 无工具（如 supervisor） */
  mode: 'all' | 'whitelist' | 'none'
  toolNames: string[]
  /** 内置默认：null = 全量；string[] = 默认白名单；supervisor 为 [] */
  defaultToolNames?: string[] | null
  /** 相对内置白名单，用户是否在设置中自定义了注入 */
  customized?: boolean
}

/** 设置页「工具」Tab 聚合数据 */
export interface AgentToolCatalog {
  tools: AgentToolCatalogItem[]
  roleInjections: AgentRoleToolInjection[]
  registeredCount: number
}

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

/** 流程上下文键名：供节点 inputKeys / outputKeys 声明与 {{key}} 插值对齐 */
export type WorkflowContextKey = string

/** Agent 子任务节点：走受限 ReAct */
export interface WorkflowAgentNode {
  id: string
  type: 'agent'
  title: string
  prompt: string
  /** 空/缺省 = 使用全部工具 */
  toolWhitelist?: string[]
  /** 声明需要从上游 context 读取的键；留空则从 prompt 中 {{key}} 自动推断 */
  inputKeys?: WorkflowContextKey[]
  /** 写入 context 的键名，默认 summary */
  outputKeys?: WorkflowContextKey[]
}

/** 确定性工具节点：参数支持 {{contextKey}} 插值 */
export interface WorkflowToolNode {
  id: string
  type: 'tool'
  title: string
  toolName: string
  argsTemplate: Record<string, unknown>
  /** 声明需要从上游 context 读取的键；留空则从 argsTemplate 中 {{key}} 自动推断 */
  inputKeys?: WorkflowContextKey[]
  outputKeys?: WorkflowContextKey[]
}

/** 人工确认节点：复用 await_user / continue；用户补充说明写入 context */
export interface WorkflowAwaitNode {
  id: string
  type: 'await_user'
  title: string
  reason: string
  /** 声明需要从上游 context 读取的键（展示确认文案时可引用） */
  inputKeys?: WorkflowContextKey[]
  /** 用户输入写入 context 的键名，默认 userInput */
  outputKeys?: WorkflowContextKey[]
  /** 可选结构化方案；有值时 UI 展示按钮组 */
  choices?: UserChoiceOption[]
}

/** Toast 级别，对应 Ant Design message */
export type WorkflowToastLevel = 'success' | 'error' | 'warning' | 'info'

/** 通知投递目标：渠道推送 / 应用内 Toast（可多选） */
export type WorkflowNotifyTarget = 'channel' | 'toast'

/**
 * 统一通知节点：可推送到通知渠道（飞书等）和/或应用内 Toast。
 * 上游节点通过 outputKeys 或 @@workflow_ctx@@ 写入 context，正文模板用 {{key}} 引用。
 * targets 缺省视为 ['channel']，兼容旧版仅渠道通知的数据。
 */
export interface WorkflowNotifyNode {
  id: string
  type: 'notify'
  title: string
  /**
   * 通知目标；可同时选渠道与 Toast。
   * 缺省：['channel']（兼容旧数据）。
   */
  targets?: WorkflowNotifyTarget[]
  /** 通知渠道 id，如 feishu；targets 含 channel 时使用 */
  channelId?: string
  /** 推送标题模板，支持 {{contextKey}}（仅渠道） */
  titleTemplate?: string
  /** 正文/展示内容模板，支持 {{contextKey}}；image / share_chat 时可忽略 */
  contentTemplate: string
  /**
   * 飞书消息类型：text / post / image / share_chat。
   * 缺省时由 queryFeishuMsgType 按 richText / 渠道推导。
   */
  msgType?: FeishuNotifyMsgType
  /**
   * @deprecated 请使用 msgType；读盘时 richText=true→post、false→text
   */
  richText?: boolean
  /** 图片消息 image_key；可覆盖渠道 notifyConfig.feishuImageKey */
  imageKey?: string
  /** 群名片 share_chat_id；可覆盖渠道 notifyConfig.feishuShareChatId */
  shareChatId?: string
  /** 发送失败时继续流程（默认 true，对齐发布计划「通知失败可忽略」） */
  failSoft?: boolean
  /** 应用内 Toast 级别；targets 含 toast 时使用，默认 info */
  toastLevel?: WorkflowToastLevel
  /** 声明需要从上游 context 读取的键；留空则从模板中 {{key}} 自动推断 */
  inputKeys?: WorkflowContextKey[]
  /** 可选：将发送结果摘要写入 context */
  outputKeys?: WorkflowContextKey[]
}

/**
 * @deprecated 已合并进 WorkflowNotifyNode（targets 含 toast）；读盘时会归一化为 notify。
 */
export interface WorkflowToastNode {
  id: string
  type: 'toast'
  title: string
  level: WorkflowToastLevel
  /** 展示内容模板，支持 {{contextKey}} */
  contentTemplate: string
  /** 声明需要从上游 context 读取的键；留空则从 contentTemplate 中 {{key}} 自动推断 */
  inputKeys?: WorkflowContextKey[]
  /** 可选：将展示内容写入 context */
  outputKeys?: WorkflowContextKey[]
}

/** 输入节点可采集的用户内容类型 */
export type WorkflowInputKind = 'text' | 'attachment' | 'image' | 'video'

/**
 * 输入节点：流程执行到此处时暂停，采集用户文字/附件/图片/视频并写入 context。
 */
export interface WorkflowInputNode {
  id: string
  type: 'input'
  title: string
  /** 向用户展示的采集说明 */
  prompt: string
  /** 接受的输入类型，至少一种 */
  inputKinds: WorkflowInputKind[]
  inputKeys?: WorkflowContextKey[]
  /** 写入 context 的键名：文字默认 userInput；附件类默认 attachmentPaths */
  outputKeys?: WorkflowContextKey[]
}

/** 输出节点写入磁盘的格式 */
export type WorkflowOutputFormat = 'text' | 'markdown' | 'json' | 'file'

/**
 * 输出节点：将上游 context 内容写入用户指定目录。
 * file 格式时 contentTemplate 应为本地文件路径（支持 {{key}}）。
 */
export interface WorkflowOutputNode {
  id: string
  type: 'output'
  title: string
  /** 输出目录（绝对路径，编辑时可经系统对话框选择） */
  outputDir: string
  outputFormat: WorkflowOutputFormat
  /** 文件名模板，支持 {{key}}；不含扩展名时按 outputFormat 补全 */
  fileNameTemplate?: string
  /** 写入内容模板，支持 {{contextKey}} */
  contentTemplate: string
  /** 声明需要从上游 context 读取的键；留空则从 contentTemplate 自动推断 */
  inputKeys?: WorkflowContextKey[]
  /** 将输出文件路径写入 context，默认 outputPath */
  outputKeys?: WorkflowContextKey[]
}

/**
 * 并行组：组间串行，组内叶子并行（P0 引擎可先串行展开 children）。
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
    | WorkflowInputNode
    | WorkflowOutputNode
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
  | WorkflowInputNode
  | WorkflowOutputNode
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

/**
 * 启动工作流可选参数。
 * silent=true 时仅落盘会话，不推送 session_started，避免打断当前聊天。
 */
export interface RunWorkflowOptions {
  silent?: boolean
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
  ) => Promise<ProviderModelsFetchResult>
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
  postAgentResyncRenderer: () => Promise<void>
  postAgentContinue: (
    sessionId: string,
    payload?: AgentContinuePayload | string
  ) => Promise<void>
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
  /** 从会话成功步骤总结技能草稿，供任务清单「发布到技能市场」预览编辑 */
  postSummarizeSkillFromSession: (sessionId: string) => Promise<SkillUpsertInput>
  queryLocalImageDataUrl: (filePath: string) => Promise<string | null>
  queryLocalMediaUrl: (filePath: string) => Promise<string | null>
  /** 校验本地路径是否存在 */
  queryLocalPathExists: (filePath: string) => Promise<boolean>
  queryAshareKlineRefresh: (req: import('./stock-chart').AshareKlineRefreshRequest) => Promise<import('./stock-chart').StockChartPayload | null>
  /** 设置页：工具注册表 + 源码预览 + 角色注入 */
  queryAgentToolsCatalog: () => Promise<AgentToolCatalog>
  /** 设置页：Agent 产出资产列表 */
  queryAgentAssets: (
    options?: import('./agent-assets').QueryAgentAssetsOptions
  ) => Promise<import('./agent-assets').AgentAssetRecord[]>
  /** 设置页：删除单个 Agent 产出 */
  postDeleteAgentAsset: (filePath: string) => Promise<import('./agent-assets').AgentAssetMutationResult>
  /** 设置页：批量删除 Agent 产出 */
  postDeleteAgentAssets: (filePaths: string[]) => Promise<import('./agent-assets').AgentAssetMutationResult>
  /** 设置页：一键清空全部 Agent 产出 */
  postClearAgentAssets: () => Promise<import('./agent-assets').AgentAssetMutationResult>
  /** 设置页：文本类资产内容预览 */
  queryAgentAssetTextPreview: (filePath: string) => Promise<string | null>
  queryAgentRules: () => Promise<AgentRule[]>
  postAgentRule: (input: AgentRuleUpsertInput) => Promise<AgentRule>
  postDeleteAgentRule: (id: string) => Promise<void>
  queryWorkflows: () => Promise<WorkflowDefinition[]>
  queryWorkflow: (id: string) => Promise<WorkflowDefinition | null>
  postWorkflow: (workflow: WorkflowDefinition) => Promise<WorkflowDefinition>
  postDeleteWorkflow: (id: string) => Promise<void>
  postRunWorkflow: (
    workflowId: string,
    options?: RunWorkflowOptions
  ) => Promise<WorkflowRunStartResult>
  postResumeWorkflow: (runId: string) => Promise<WorkflowRunStartResult>
  /** 业务系统：全部工作流运行实例 */
  queryWorkflowRuns: () => Promise<WorkflowRun[]>
  /** 业务系统：按会话取最近一次工作流运行（含节点 context） */
  queryLatestWorkflowRunBySession: (sessionId: string) => Promise<WorkflowRun | null>
  onAgentEvent: (cb: (event: AgentEvent) => void) => () => void
  onBrowserFrame: (cb: (frame: BrowserFramePayload) => void) => () => void
  onScheduleUpdate: (cb: (tasks: ScheduledTask[]) => void) => () => void
  onPublishPlansUpdate: (cb: (plans: PublishPlan[]) => void) => () => void
  onAgentRulesUpdate: (cb: (rules: AgentRule[]) => void) => () => void
  /** 选择本地图片文件 */
  postSelectImages: () => Promise<string[]>
  /** 选择本地文件夹（流程输出节点等） */
  postSelectDirectory: () => Promise<string | null>
  /** 在系统默认浏览器中打开链接 */
  postOpenExternal: (url: string) => Promise<void>
  /** 在系统文件管理器中显示本地文件（成片/剧本等产物） */
  postRevealPath: (filePath: string) => Promise<{ ok: true } | { ok: false; error: string }>
  /** 在系统默认浏览器中打开本地文件 */
  postOpenLocalFile: (filePath: string) => Promise<{ ok: true } | { ok: false; error: string }>
}

declare global {
  interface Window {
    api: ElectronApi
  }
}
