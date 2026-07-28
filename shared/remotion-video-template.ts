/**
 * Remotion 视频生产模版：由内置技能（resources/skills/remotion-template-*）声明，
 * 视频页从技能市场读取，禁止在前端写死模版列表。
 */

/** 与列表 Tab 对齐的业务分类 */
export type RemotionVideoTemplateCategory =
  | 'song'
  | 'news'
  | 'product'
  | 'education'
  | 'other'

/** 列表状态（技能 frontmatter 可选声明） */
export type RemotionVideoTemplateStatus = 'draft' | 'rendering' | 'ready' | 'failed'

/**
 * 内置 Player 预览种类。
 * 真实 React Composition 仍由前端 registry 按 kind 挂载；技能只声明 kind，不写死组件。
 */
export type RemotionVideoPreviewKind = 'hot-news-wide' | 'hot-news-vertical'

/** 从 SKILL.md 解析出的模版卡片数据 */
export interface RemotionVideoTemplate {
  /** 技能目录 id，如 remotion-template-hot-news */
  id: string
  /** 展示标题（frontmatter name） */
  title: string
  description: string
  category: RemotionVideoTemplateCategory
  status: RemotionVideoTemplateStatus
  accent: string
  durationSec: number
  compositionId: string
  /** 技能文件 mtime */
  updatedAt: number
  /** 相对技能根的模版目录，默认 template */
  templateDir: string
  /** 技能内是否包含可拼装的 template 源码 */
  hasTemplateCode: boolean
  /** 画幅提示：hot-news-wide / hot-news-vertical */
  previewKind?: RemotionVideoPreviewKind
}

const CATEGORIES = new Set<RemotionVideoTemplateCategory>([
  'song',
  'news',
  'product',
  'education',
  'other'
])

const STATUSES = new Set<RemotionVideoTemplateStatus>([
  'draft',
  'rendering',
  'ready',
  'failed'
])

const PREVIEW_KINDS = new Set<RemotionVideoPreviewKind>([
  'hot-news-wide',
  'hot-news-vertical'
])

/** 是否为 Remotion 视频模版技能 id */
export function queryIsRemotionVideoTemplateSkillId(id: string): boolean {
  return id.startsWith('remotion-template-')
}

/**
 * 从 SKILL.md 原文解析模版元数据。
 * 要求 frontmatter 含 `remotionVideoTemplate: true`（或省略时靠目录前缀判定）。
 * @param hasTemplateCode 由调用方根据磁盘是否存在 template/manifest.json 传入
 */
export function queryRemotionVideoTemplateFromSkillMd(
  skillId: string,
  raw: string,
  updatedAt: number,
  hasTemplateCode = false
): RemotionVideoTemplate | null {
  if (!queryIsRemotionVideoTemplateSkillId(skillId) && !/remotionVideoTemplate:\s*true/.test(raw)) {
    return null
  }

  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!match) return null

  const frontmatter = match[1]
  const fields = queryParseFrontmatterScalars(frontmatter)

  // 显式 false 时跳过；缺省时若 id 为 remotion-template-* 仍视为模版
  if (fields.remotionVideoTemplate === 'false') return null
  if (
    fields.remotionVideoTemplate !== 'true' &&
    !queryIsRemotionVideoTemplateSkillId(skillId)
  ) {
    return null
  }

  const title = (fields.name || skillId).trim()
  const description = (fields.description || '').trim()
  const categoryRaw = (fields.category || 'other').trim() as RemotionVideoTemplateCategory
  const category = CATEGORIES.has(categoryRaw) ? categoryRaw : 'other'
  const statusRaw = (fields.status || 'ready').trim() as RemotionVideoTemplateStatus
  const status = STATUSES.has(statusRaw) ? statusRaw : 'ready'
  const accent = (fields.accent || '#5b8def').trim()
  const durationSec = Math.max(1, Number.parseInt(fields.durationSec || '15', 10) || 15)
  const compositionId = (fields.compositionId || 'Main').trim() || 'Main'
  const previewRaw = (fields.previewKind || '').trim() as RemotionVideoPreviewKind
  const previewKind = PREVIEW_KINDS.has(previewRaw) ? previewRaw : undefined
  const templateDir = (fields.templateDir || 'template').trim() || 'template'

  return {
    id: skillId,
    title,
    description,
    category,
    status,
    accent,
    durationSec,
    compositionId,
    updatedAt,
    templateDir,
    hasTemplateCode,
    previewKind
  }
}

/** 解析 frontmatter 中的简单标量（含 description: >- 块） */
function queryParseFrontmatterScalars(frontmatter: string): Record<string, string> {
  const fields: Record<string, string> = {}

  const descBlock = frontmatter.match(
    /description:\s*(?:>-|>\||>)\s*\r?\n([\s\S]*?)(?:\r?\n[a-zA-Z_]|$)/
  )
  if (descBlock) {
    fields.description = descBlock[1]
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .join(' ')
  }

  for (const line of frontmatter.split('\n')) {
    const m = line.match(/^([a-zA-Z][a-zA-Z0-9_]*)\s*:\s*(.+)$/)
    if (!m) continue
    const key = m[1]
    let value = m[2].trim()
    if (value.startsWith('>') && key === 'description') continue
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (key === 'description' && fields.description) continue
    fields[key] = value
  }

  return fields
}
