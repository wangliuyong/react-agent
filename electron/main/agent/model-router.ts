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
 * 优先级：显式 capability → roleModelMap[role] → defaultConnectionId。
 */
export function queryResolveModelConnection(
  settings: AppSettings,
  opts: ResolveModelConnectionOptions = {}
): ModelConnection {
  if (opts.capability) {
    const byCap = queryModelConnectionByCapability(settings, opts.capability)
    // queryModelConnectionByCapability 无匹配时已回退 default；若命中的连接确实带该能力则采用
    if (byCap.capabilities?.includes(opts.capability) && byCap.apiKey.trim()) {
      return byCap
    }
    // 无带 Key 的能力连接时，继续走角色映射，避免误用空 Key 媒体连接
  }
  if (opts.role) {
    return queryModelConnection(settings, opts.role)
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
 * 容错：允许夹杂其它文本；next 非法时返回 null（由调用方关键词兜底）。
 */
export function queryParseSupervisorRoute(text: string): SupervisorRoute | null {
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null
  try {
    const parsed = JSON.parse(jsonMatch[0]) as { next?: unknown; capability?: unknown }
    const nextRaw = typeof parsed.next === 'string' ? parsed.next.trim() : ''
    let next: SupervisorNextTarget | undefined
    if (
      nextRaw === 'general' ||
      nextRaw === 'content' ||
      nextRaw === 'publish' ||
      nextRaw === 'video'
    ) {
      next = nextRaw
    }
    if (!next) return null
    const capability = queryNormalizeModelCapability(parsed.capability)
    return capability ? { next, capability } : { next }
  } catch {
    return null
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
