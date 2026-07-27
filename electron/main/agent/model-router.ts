import {
  queryModelConnection,
  queryModelConnectionByCapability,
  type AppSettings,
  type ModelCapability,
  type ModelConnection,
  type ModelRoleKey
} from '../../../shared/types'

/** 合法能力枚举，供 Supervisor / switch_model 校验 */
export const MODEL_CAPABILITIES: readonly ModelCapability[] = [
  'chat',
  'reasoning',
  'vision',
  'longContext',
  'creative'
] as const

/** 长文阈值：超过则倾向 longContext 连接 */
export const LONG_CONTEXT_CHAR_THRESHOLD = 12_000

const IMAGE_EXT_RE = /\.(png|jpe?g|webp|gif|bmp|heic|heif|svg)$/i

const REASONING_RE =
  /推理|分析|证明|调试|排障|根因|算法|复杂度|对比方案|为什么|怎么实现|排查|定位问题/

const CREATIVE_RE =
  /写作|撰稿|文案|剧本|创作|润色|标题|小红书|抖音文案|诗|小说|脚本|分镜|故事/

const VISION_HINT_RE = /看图|识图|识别图片|OCR|截图|图片里|这张图/

/**
 * 校验并规范化 capability 字符串。
 */
export function queryNormalizeModelCapability(value: unknown): ModelCapability | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim() as ModelCapability
  return MODEL_CAPABILITIES.includes(trimmed) ? trimmed : undefined
}

/**
 * 按附件类型、文本长度与关键词推断模型能力。
 * 优先级：vision（附件/看图）→ longContext → reasoning → creative → chat。
 */
export function queryInferModelCapability(
  text: string,
  attachmentPaths: string[] = []
): ModelCapability {
  const hasImageAttachment = attachmentPaths.some((p) => IMAGE_EXT_RE.test(p))
  if (hasImageAttachment || VISION_HINT_RE.test(text)) {
    return 'vision'
  }
  if (text.length >= LONG_CONTEXT_CHAR_THRESHOLD) {
    return 'longContext'
  }
  if (REASONING_RE.test(text)) {
    return 'reasoning'
  }
  if (CREATIVE_RE.test(text)) {
    return 'creative'
  }
  return 'chat'
}

export interface ResolveModelConnectionOptions {
  /** 角色键；无 capability 命中时走 roleModelMap */
  role?: ModelRoleKey
  /** 显式能力；优先按 capabilities 标签选连接 */
  capability?: ModelCapability
}

/**
 * 解析应使用的模型连接。
 * 优先级：
 * 1. 有 role 时：角色映射连接若已具备该 capability（或无 capability）→ 用角色连接
 * 2. 角色连接不具备该 capability 时：优先同供应商具备该能力的连接
 *    （避免 DeepSeek 角色被升级到列表靠前的百炼「文生图」连接）
 * 3. 仅 vision 再全表按 capability 选型（文本角色无识图时改走媒体连接）
 *    creative / reasoning 等文本能力不得跨供应商抢走角色配置
 * 4. 回退角色映射 / defaultConnectionId
 */
export function queryResolveModelConnection(
  settings: AppSettings,
  opts: ResolveModelConnectionOptions = {}
): ModelConnection {
  if (opts.role) {
    const byRole = queryModelConnection(settings, opts.role)
    if (!opts.capability) return byRole
    // 角色连接已具备该能力：坚持角色映射，避免媒体连接抢聊
    if (byRole.apiKey.trim() && byRole.capabilities?.includes(opts.capability)) {
      return byRole
    }
    // 能力升级：优先同供应商（如 DeepSeek 默认 → DeepSeek 创作），勿跨到百炼媒体
    const sameProvider = (settings.connections ?? []).find(
      (c) =>
        c.provider === byRole.provider &&
        c.capabilities?.includes(opts.capability!) &&
        c.apiKey.trim()
    )
    if (sameProvider) return sameProvider

    // 仅 vision 允许跨供应商（DeepSeek 文本角色 → 百炼媒体）
    // 否则 Supervisor 的 creative 会把调研员打到「图生成视频 · dashscope」
    if (opts.capability === 'vision') {
      const byCap = queryModelConnectionByCapability(settings, opts.capability)
      if (byCap.capabilities?.includes(opts.capability) && byCap.apiKey.trim()) {
        return byCap
      }
    }
    return byRole
  }
  if (opts.capability) {
    const byCap = queryModelConnectionByCapability(settings, opts.capability)
    if (byCap.capabilities?.includes(opts.capability) && byCap.apiKey.trim()) {
      return byCap
    }
  }
  return queryModelConnection(settings, 'default')
}

/** Supervisor 路由目标 */
export type SupervisorNextTarget = 'general' | 'content' | 'publish' | 'video'

export interface SupervisorRoute {
  next: SupervisorNextTarget
  capability?: ModelCapability
}

/** 明确要求发布到渠道的表述（不含「创作/热点」等宽泛词） */
const PUBLISH_INTENT_RE =
  /发布到|发布一篇|发布一条|发布笔记|发布图文|发到|发一篇|发一条|发条|帮我发|发小红书|发抖音|上架|投稿|自动发布|创作并发布|写完.*发布|并发布|然后发布|再发布/

/** 明确否定发布 */
const PUBLISH_NEGATE_RE = /不要发布|先不发布|暂不发布|别发布|不要发|先不发/

/** 内容生产（调研/撰稿）但不必然发布 */
const CONTENT_PIPELINE_RE =
  /热点|撰稿|配图|图文|创作|文案|写一篇|写文案|深入解析|小红书|抖音|选题|成稿/

/**
 * 用户是否明确要求发布。否定表述优先（如「不要发布」「先不发」）。
 */
export function queryHasExplicitPublishIntent(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed) return false
  if (PUBLISH_NEGATE_RE.test(trimmed)) return false
  if (PUBLISH_INTENT_RE.test(trimmed)) return true
  // 单独出现「发布」动词（否定句已在上方拦截）
  return /发布/.test(trimmed)
}

/**
 * 解析 Supervisor 输出的 JSON：{"next":"...","capability":"..."}。
 * next 可为管线目标 general/content/publish/video，或已注册的 custom_* 角色 id。
 */
export function queryParseSupervisorRoute(
  text: string,
  customRoleIds: ReadonlySet<string> = new Set()
): {
  nextAgent: string
  pipelineKind: SupervisorNextTarget
  capability?: ModelCapability
} | null {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null
  try {
    const parsed = JSON.parse(jsonMatch[0]) as { next?: unknown; capability?: unknown }
    const nextRaw = typeof parsed.next === 'string' ? parsed.next.trim() : ''
    const capability = queryNormalizeModelCapability(parsed.capability)
    if (customRoleIds.has(nextRaw)) {
      return capability
        ? { nextAgent: nextRaw, pipelineKind: 'general', capability }
        : { nextAgent: nextRaw, pipelineKind: 'general' }
    }
    let pipelineKind: SupervisorNextTarget | undefined
    if (
      nextRaw === 'general' ||
      nextRaw === 'content' ||
      nextRaw === 'publish' ||
      nextRaw === 'video'
    ) {
      pipelineKind = nextRaw
    }
    if (!pipelineKind) return null
    const nextAgent = queryPipelineEntryRole(pipelineKind)
    return capability
      ? { nextAgent, pipelineKind, capability }
      : { nextAgent, pipelineKind }
  } catch {
    return null
  }
}

/**
 * 综合 JSON 解析与关键词兜底，得到下一跳 Agent 节点名。
 */
export function queryResolveSupervisorRoute(
  supervisorText: string,
  userText: string,
  customRoleIds: ReadonlySet<string> = new Set()
): {
  nextAgent: string
  pipelineKind: SupervisorNextTarget
  capability?: ModelCapability
} {
  const parsed = queryParseSupervisorRoute(supervisorText, customRoleIds)
  if (parsed) return parsed
  const inferred = queryInferSupervisorNext(supervisorText, userText)
  const pipelineKind = querySanitizeSupervisorNext(inferred, userText)
  return {
    nextAgent: queryPipelineEntryRole(pipelineKind),
    pipelineKind
  }
}

/**
 * 关键词兜底路由。
 * 注意：热点/撰稿/小红书等只进 content，只有明确「发布/发一篇」才进 publish。
 */
export function queryInferSupervisorNext(
  supervisorText: string,
  userText: string
): SupervisorNextTarget {
  const blob = supervisorText + userText
  if (/剧本|分镜|成片|生成视频|一句话.*视频|短剧|口播视频/.test(blob)) {
    return 'video'
  }
  // 发布意图以用户原文为准，避免 Supervisor 残片误伤
  if (queryHasExplicitPublishIntent(userText)) {
    return 'publish'
  }
  if (CONTENT_PIPELINE_RE.test(userText) || CONTENT_PIPELINE_RE.test(supervisorText)) {
    return 'content'
  }
  return 'general'
}

/**
 * 纠正 Supervisor 误路由：未明确要求发布时，不得进入 publisher 节点。
 */
export function querySanitizeSupervisorNext(
  next: SupervisorNextTarget,
  userText: string
): SupervisorNextTarget {
  if (next !== 'publish') return next
  if (queryHasExplicitPublishIntent(userText)) return 'publish'
  if (CONTENT_PIPELINE_RE.test(userText)) return 'content'
  return 'general'
}

/**
 * 将 Supervisor next 映射到管线入口角色。
 */
export function queryPipelineEntryRole(
  next: SupervisorNextTarget
): 'general' | 'researcher' | 'scriptwriter' {
  if (next === 'publish' || next === 'content') return 'researcher'
  if (next === 'video') return 'scriptwriter'
  return 'general'
}
