import type { SkillUpsertInput } from './types'

/** 与主进程 validateSkillId / 前端 isValidSkillId 保持一致 */
export function isValidSkillImportId(id: string): boolean {
  return /^[a-z0-9-]{1,64}$/.test(id) && !id.startsWith('.') && id !== '_templates'
}

/** 将名称或原始 id 规范为合法技能目录名 */
export function slugifySkillImportId(raw: string): string {
  const slug = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
    .slice(0, 64)
  return slug || `skill-${Date.now()}`
}

/**
 * 解析技能导入 JSON：支持单个对象或数组。
 * 每条需含 content 正文；旧版仅摘要导出（无 content）会明确报错。
 */
export function parseSkillImportJson(raw: string): SkillUpsertInput[] {
  let data: unknown
  try {
    data = JSON.parse(raw) as unknown
  } catch {
    throw new Error('JSON 解析失败，请检查文件内容')
  }

  const items = Array.isArray(data) ? data : [data]
  if (items.length === 0) {
    throw new Error('JSON 为空，至少需要一条技能')
  }

  return items.map((item, index) => normalizeSkillImportItem(item, index))
}

/** 单条归一化为 SkillUpsertInput */
function normalizeSkillImportItem(item: unknown, index: number): SkillUpsertInput {
  const label = `第 ${index + 1} 条`
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    throw new Error(`${label}不是有效的技能对象`)
  }

  const o = item as Record<string, unknown>
  const content = typeof o.content === 'string' ? o.content.trim() : ''
  if (!content) {
    throw new Error(
      `${label}缺少 content 正文（旧版摘要导出无法导入，请先用新版「导出」生成完整 JSON）`
    )
  }

  const name =
    typeof o.name === 'string' && o.name.trim()
      ? o.name.trim()
      : typeof o.id === 'string' && o.id.trim()
        ? o.id.trim()
        : ''
  if (!name) {
    throw new Error(`${label}缺少 name`)
  }

  const description =
    typeof o.description === 'string' && o.description.trim()
      ? o.description.trim()
      : '从 JSON 导入的技能'
  const idSource =
    typeof o.id === 'string' && o.id.trim() ? o.id.trim() : slugifySkillImportId(name)
  const id = slugifySkillImportId(idSource)
  if (!isValidSkillImportId(id)) {
    throw new Error(`${label}技能 id「${id}」格式无效`)
  }

  const examplesRaw = o.examplesContent
  const examplesContent =
    typeof examplesRaw === 'string' && examplesRaw.trim() ? examplesRaw.trim() : undefined

  return {
    id,
    name,
    description,
    content,
    examplesContent
  }
}

/**
 * URL 路径是否像技能 JSON（pathname 以 .json 结尾）。
 * 用于走 JSON 导入分支，跳过 git / SKILL.md 下载。
 */
export function isLikelySkillJsonUrl(url: string): boolean {
  try {
    const pathname = new URL(url.trim()).pathname
    return /\.json$/i.test(pathname)
  } catch {
    return false
  }
}
