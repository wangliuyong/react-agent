/**
 * Remotion 模板包共享类型与校验。
 * 主进程 Registry、Agent 工具、渲染层 IPC 共用此契约。
 */

/** 模板来源 */
export type RemotionTemplateOrigin =
  | 'bundled'
  | 'local'
  | 'remote'
  | 'skill-bound'
  | 'from-chat'

/** meta.json 磁盘结构（origin 可在扫描时覆盖） */
export interface RemotionTemplateMeta {
  id: string
  name: string
  description?: string
  origin: RemotionTemplateOrigin
  tags?: string[]
  compositionId?: string
  width?: number
  height?: number
  fps?: number
  durationInFrames?: number
  skillIds?: string[]
  sourceUrl?: string
  sourceSessionId?: string
  createdAt?: string
}

/** Registry 列表项（含磁盘路径与覆盖信息） */
export interface RemotionTemplateSummary extends RemotionTemplateMeta {
  /** 模板包绝对路径 */
  dir: string
  /** 是否存在 Composition.tsx */
  hasComposition: boolean
  /** 是否存在 schema.ts（Studio Props 面板） */
  hasSchema: boolean
  /** 用户目录覆盖了同 id 的内置模板 */
  overridesBundled?: boolean
  /** 预览文件相对路径（preview.webp / preview.mp4） */
  previewFile?: string
}

/** 会话工程活动模板标记 */
export interface RemotionActiveTemplateState {
  templateId: string
  compositionId: string
}

/** apply 入参 */
export interface RemotionApplyTemplateInput {
  sessionId: string
  templateId: string
  /** 覆盖默认 props */
  props?: Record<string, unknown>
  compositionId?: string
  width?: number
  height?: number
  fps?: number
  durationInFrames?: number
}

/** apply 结果 */
export interface RemotionApplyTemplateResult {
  projectDir: string
  templateId: string
  compositionId: string
  entryPoint: string
  propsPath: string
}

/** 从聊天成片存模板入参 */
export interface RemotionSaveTemplateFromChatInput {
  sessionId: string
  name: string
  templateId: string
  tags?: string[]
  /** 成片路径，复制为 preview.mp4 */
  videoPath?: string
  /** 工程目录；缺省为会话 remotion 目录 */
  projectDir?: string
  compositionId?: string
}

/** 模板 id 规则：与技能 id 一致 */
export function isValidRemotionTemplateId(id: string): boolean {
  return /^[a-z0-9-]{1,64}$/.test(id) && !id.startsWith('.') && id !== '_templates'
}

export function validateRemotionTemplateId(id: string): void {
  if (!isValidRemotionTemplateId(id)) {
    throw new Error('模板 id 仅允许小写字母、数字和连字符，长度 1～64，且不可使用保留名')
  }
}

const ORIGINS: RemotionTemplateOrigin[] = [
  'bundled',
  'local',
  'remote',
  'skill-bound',
  'from-chat'
]

/**
 * 校验并规范化 meta.json 对象。
 * 非法时抛错；合法时返回补全默认字段后的 meta。
 */
export function parseRemotionTemplateMeta(
  raw: unknown,
  fallbackOrigin: RemotionTemplateOrigin = 'local'
): RemotionTemplateMeta {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('meta.json 必须是对象')
  }
  const obj = raw as Record<string, unknown>
  const id = String(obj.id ?? '').trim()
  validateRemotionTemplateId(id)
  const name = String(obj.name ?? '').trim()
  if (!name) {
    throw new Error('meta.json 缺少 name')
  }

  const originRaw = String(obj.origin ?? fallbackOrigin).trim() as RemotionTemplateOrigin
  const origin = ORIGINS.includes(originRaw) ? originRaw : fallbackOrigin

  const tags = Array.isArray(obj.tags)
    ? obj.tags.map((t) => String(t).trim()).filter(Boolean)
    : undefined

  const skillIds = Array.isArray(obj.skillIds)
    ? obj.skillIds.map((t) => String(t).trim()).filter(Boolean)
    : undefined

  const num = (v: unknown): number | undefined => {
    if (v == null || v === '') return undefined
    const n = Number(v)
    return Number.isFinite(n) ? n : undefined
  }

  return {
    id,
    name,
    description: obj.description != null ? String(obj.description) : undefined,
    origin,
    tags,
    compositionId: obj.compositionId != null ? String(obj.compositionId).trim() || 'Main' : 'Main',
    width: num(obj.width),
    height: num(obj.height),
    fps: num(obj.fps),
    durationInFrames: num(obj.durationInFrames),
    skillIds,
    sourceUrl: obj.sourceUrl != null ? String(obj.sourceUrl) : undefined,
    sourceSessionId: obj.sourceSessionId != null ? String(obj.sourceSessionId) : undefined,
    createdAt: obj.createdAt != null ? String(obj.createdAt) : undefined
  }
}

/** 会话 props / 活动模板 文件名常量 */
export const REMOTION_INPUT_PROPS_FILE = '.remotion-input-props.json'
export const REMOTION_ACTIVE_TEMPLATE_FILE = '.remotion-active-template.json'
