import { app } from 'electron'
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync
} from 'fs'
import { join } from 'path'
import type {
  ProjectSkill,
  ProjectSkillDetail,
  SkillStates,
  SkillTemplate,
  SkillUpsertInput
} from '../../../shared/types'
import { getDataRoot } from './paths'

/** 技能启用状态持久化路径 */
function getSkillStatesPath(): string {
  return join(getDataRoot(), 'skill-states.json')
}

/**
 * 定位项目根目录（含 .cursor/skills）。
 * dev / 打包后路径不同，按候选路径探测。
 */
export function getProjectRoot(): string {
  const candidates = [process.cwd(), app.getAppPath(), join(__dirname, '../../..')]
  for (const root of candidates) {
    if (existsSync(join(root, '.cursor/skills'))) {
      return root
    }
  }
  return process.cwd()
}

function getSkillsDir(): string {
  return join(getProjectRoot(), '.cursor/skills')
}

/** 内置模板目录（与已安装技能隔离，避免被 queryProjectSkills 扫描） */
function getSkillTemplatesDir(): string {
  const candidates = [
    join(process.cwd(), 'resources/skill-templates'),
    join(getProjectRoot(), 'resources/skill-templates'),
    join(__dirname, '../../../resources/skill-templates')
  ]
  for (const dir of candidates) {
    if (existsSync(dir)) return dir
  }
  return candidates[0]
}

/** 是否为项目内置技能 id */
function isBuiltinSkillId(id: string): boolean {
  return id.startsWith('react-agent-')
}

/** 校验技能目录名：小写、数字、连字符，1～64 字符 */
export function validateSkillId(id: string): void {
  if (!/^[a-z0-9-]{1,64}$/.test(id)) {
    throw new Error('技能 id 仅允许小写字母、数字和连字符，长度 1～64')
  }
  if (id.startsWith('.') || id === '_templates') {
    throw new Error('技能 id 使用了保留名称')
  }
}

/** 解析 SKILL.md 的 YAML frontmatter（轻量，不引入 yaml 依赖） */
function parseSkillMarkdown(raw: string): { name: string; description: string; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!match) {
    return { name: '', description: '', body: raw }
  }

  const frontmatter = match[1]
  const body = match[2].trim()
  let name = ''
  let description = ''

  // 多行 description: >- 或 > 块
  const descBlock = frontmatter.match(
    /description:\s*(?:>-|>\||>)\s*\r?\n([\s\S]*?)(?:\r?\n[a-zA-Z_]|$)/
  )
  if (descBlock) {
    description = descBlock[1]
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .join(' ')
  }

  for (const line of frontmatter.split('\n')) {
    const nameMatch = line.match(/^name:\s*(.+)$/)
    if (nameMatch) {
      name = nameMatch[1].trim()
      continue
    }
    // 单行 description
    if (!description) {
      const descMatch = line.match(/^description:\s*(.+)$/)
      if (descMatch && !descMatch[1].startsWith('>')) {
        description = descMatch[1].trim()
      }
    }
  }

  return { name, description, body }
}

/**
 * 生成 SKILL.md 全文（frontmatter + 正文）。
 * description 使用 >- 多行块，便于含中文与特殊字符。
 */
export function buildSkillMarkdown(name: string, description: string, body: string): string {
  const descLines = description
    .trim()
    .split(/\s+/)
    .reduce<string[]>((lines, word) => {
      const last = lines[lines.length - 1] ?? ''
      if (!last || last.length + word.length + 1 > 72) {
        lines.push(word)
      } else {
        lines[lines.length - 1] = `${last} ${word}`
      }
      return lines
    }, [])
    .map((l) => `  ${l}`)
    .join('\n')

  return `---
name: ${name}
description: >-
${descLines}
---

${body.trim()}
`
}

function readSkillStates(): SkillStates {
  const path = getSkillStatesPath()
  if (!existsSync(path)) return {}
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as SkillStates
  } catch {
    return {}
  }
}

function writeSkillStates(states: SkillStates): void {
  writeFileSync(getSkillStatesPath(), JSON.stringify(states, null, 2), 'utf-8')
}

function toProjectSkill(
  id: string,
  name: string,
  description: string,
  hasExamples: boolean,
  updatedAt: number,
  enabled: boolean
): ProjectSkill {
  return {
    id,
    name,
    description,
    enabled,
    hasExamples,
    updatedAt,
    isBuiltin: isBuiltinSkillId(id)
  }
}

/** 列出项目 .cursor/skills 下全部技能 */
export function queryProjectSkills(): ProjectSkill[] {
  const dir = getSkillsDir()
  if (!existsSync(dir)) return []

  const states = readSkillStates()
  const entries = readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory())

  const skills: ProjectSkill[] = []
  for (const entry of entries) {
    const skillPath = join(dir, entry.name, 'SKILL.md')
    if (!existsSync(skillPath)) continue

    const raw = readFileSync(skillPath, 'utf-8')
    const { name, description } = parseSkillMarkdown(raw)
    const examplesPath = join(dir, entry.name, 'examples.md')
    const stat = statSync(skillPath)

    skills.push(
      toProjectSkill(
        entry.name,
        name || entry.name,
        description,
        existsSync(examplesPath),
        stat.mtimeMs,
        states[entry.name]?.enabled ?? true
      )
    )
  }

  return skills.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
}

/** 读取单个技能详情（含正文与 examples） */
export function queryProjectSkillDetail(id: string): ProjectSkillDetail | null {
  const dir = join(getSkillsDir(), id)
  const skillPath = join(dir, 'SKILL.md')
  if (!existsSync(skillPath)) return null

  const raw = readFileSync(skillPath, 'utf-8')
  const { name, description, body } = parseSkillMarkdown(raw)
  const examplesPath = join(dir, 'examples.md')
  const states = readSkillStates()

  return {
    ...toProjectSkill(
      id,
      name || id,
      description,
      existsSync(examplesPath),
      statSync(skillPath).mtimeMs,
      states[id]?.enabled ?? true
    ),
    content: body,
    examplesContent: existsSync(examplesPath)
      ? readFileSync(examplesPath, 'utf-8').trim()
      : undefined
  }
}

/** 创建或更新技能（写入 .cursor/skills/<id>/） */
export function postProjectSkill(input: SkillUpsertInput): ProjectSkillDetail {
  validateSkillId(input.id)
  if (!input.name.trim()) throw new Error('技能名称不能为空')
  if (!input.description.trim()) throw new Error('技能描述不能为空')
  if (!input.content.trim()) throw new Error('技能正文不能为空')

  const skillDir = join(getSkillsDir(), input.id)
  const skillPath = join(skillDir, 'SKILL.md')
  const examplesPath = join(skillDir, 'examples.md')

  try {
    mkdirSync(skillDir, { recursive: true })
    writeFileSync(
      skillPath,
      buildSkillMarkdown(input.name.trim(), input.description.trim(), input.content),
      'utf-8'
    )

    const examples = input.examplesContent?.trim()
    if (examples) {
      writeFileSync(examplesPath, `${examples}\n`, 'utf-8')
    } else if (existsSync(examplesPath)) {
      unlinkSync(examplesPath)
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(
      `写入技能失败（请确认项目目录 .cursor/skills 可写）：${msg}`
    )
  }

  const detail = queryProjectSkillDetail(input.id)
  if (!detail) throw new Error('技能保存后读取失败')
  return detail
}

/** 删除技能目录 */
export function postDeleteProjectSkill(id: string): void {
  validateSkillId(id)
  const skillDir = join(getSkillsDir(), id)
  if (!existsSync(skillDir)) {
    throw new Error('技能不存在')
  }

  try {
    rmSync(skillDir, { recursive: true, force: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`删除技能失败：${msg}`)
  }

  const states = readSkillStates()
  if (states[id]) {
    delete states[id]
    writeSkillStates(states)
  }
}

/** 列出内置技能模板 */
export function querySkillTemplates(): SkillTemplate[] {
  const dir = getSkillTemplatesDir()
  if (!existsSync(dir)) return []

  const entries = readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory())
  const templates: SkillTemplate[] = []

  for (const entry of entries) {
    const skillPath = join(dir, entry.name, 'SKILL.md')
    if (!existsSync(skillPath)) continue

    const raw = readFileSync(skillPath, 'utf-8')
    const { name, description } = parseSkillMarkdown(raw)
    templates.push({
      id: entry.name,
      name: name || entry.name,
      description
    })
  }

  return templates.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
}

/** 将模板复制安装到 .cursor/skills/<targetId>/ */
export function postInstallSkillTemplate(
  templateId: string,
  targetId?: string
): ProjectSkillDetail {
  const templatesDir = getSkillTemplatesDir()
  const srcDir = join(templatesDir, templateId)
  if (!existsSync(join(srcDir, 'SKILL.md'))) {
    throw new Error('模板不存在')
  }

  const id = targetId?.trim() || templateId
  validateSkillId(id)

  const destDir = join(getSkillsDir(), id)
  if (existsSync(destDir)) {
    throw new Error(`技能 id「${id}」已存在，请更换目标 id`)
  }

  try {
    cpSync(srcDir, destDir, { recursive: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`安装模板失败：${msg}`)
  }

  const detail = queryProjectSkillDetail(id)
  if (!detail) throw new Error('模板安装后读取失败')
  return detail
}

/** 更新技能启用状态 */
export function postSkillStates(states: SkillStates): SkillStates {
  const merged = { ...readSkillStates(), ...states }
  writeSkillStates(merged)
  return merged
}

/**
 * 获取已启用技能的 Markdown 正文，供 Agent SYSTEM_PROMPT 注入。
 * 限制总长度，避免撑爆上下文。
 */
export function queryEnabledSkillPrompt(maxChars = 12000): string {
  const skills = queryProjectSkills().filter((s) => s.enabled)
  if (!skills.length) return ''

  const parts: string[] = []
  let total = 0

  for (const skill of skills) {
    const detail = queryProjectSkillDetail(skill.id)
    if (!detail) continue

    const chunk = `### 技能：${detail.name}\n${detail.description ? `> ${detail.description}\n\n` : ''}${detail.content}`
    if (total + chunk.length > maxChars) {
      parts.push(chunk.slice(0, maxChars - total) + '\n\n...(技能内容已截断)')
      break
    }
    parts.push(chunk)
    total += chunk.length
  }

  return parts.join('\n\n---\n\n')
}
