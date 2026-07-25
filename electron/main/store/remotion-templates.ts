/**
 * Remotion 模板 Registry：扫描内置/用户目录、apply、从聊天存模板、读写 inputProps。
 */

import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync
} from 'fs'
import { basename, dirname, join, relative, resolve } from 'path'
import {
  parseRemotionTemplateMeta,
  REMOTION_ACTIVE_TEMPLATE_FILE,
  REMOTION_INPUT_PROPS_FILE,
  validateRemotionTemplateId,
  type RemotionActiveTemplateState,
  type RemotionApplyTemplateInput,
  type RemotionApplyTemplateResult,
  type RemotionSaveTemplateFromChatInput,
  type RemotionTemplateMeta,
  type RemotionTemplateOrigin,
  type RemotionTemplateSummary
} from '../../shared/remotion-template'
import {
  postInitRemotionProject,
  postWriteRootGenerated,
  queryRemotionProjectDir
} from '../media/remotion-service'
import { getDataRoot } from './paths'
import { queryBundledResourcesRoot, queryWritableResourcesRoot } from './resources'

/** 第三方/存档允许拷贝的扩展名 */
const TEMPLATE_FILE_EXT =
  /\.(ts|tsx|json|css|png|jpg|jpeg|webp|svg|wav|mp3|mp4)$/i

/** 内置模板目录（只读扫描源） */
export function queryBundledRemotionTemplatesDir(): string {
  return join(queryBundledResourcesRoot(), 'remotion', 'templates')
}

/**
 * 用户可写模板目录。
 * 开发环境写入仓库 resources；安装版写入 userData/resources。
 */
export function queryUserRemotionTemplatesDir(): string {
  const dir = join(queryWritableResourcesRoot(), 'remotion', 'templates')
  mkdirSync(dir, { recursive: true })
  return dir
}

/** @deprecated 使用 queryUserRemotionTemplatesDir；保留别名兼容计划命名 */
export function queryRemotionTemplatesDir(): string {
  return queryUserRemotionTemplatesDir()
}

export interface RemotionTemplateFilter {
  tag?: string
  origin?: RemotionTemplateOrigin
  query?: string
}

/** 扫描单个目录下的模板包 */
function scanTemplatesDir(
  root: string,
  fallbackOrigin: RemotionTemplateOrigin
): RemotionTemplateSummary[] {
  if (!existsSync(root)) return []
  const out: RemotionTemplateSummary[] = []

  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name === '_templates') {
      continue
    }
    const dir = join(root, entry.name)
    const metaPath = join(dir, 'meta.json')
    const compositionPath = join(dir, 'Composition.tsx')
    if (!existsSync(metaPath) || !existsSync(compositionPath)) continue

    try {
      const raw = JSON.parse(readFileSync(metaPath, 'utf-8')) as unknown
      const meta = parseRemotionTemplateMeta(raw, fallbackOrigin)
      // 目录名与 id 不一致时以 meta.id 为准，但仍要求可注册
      let previewFile: string | undefined
      if (existsSync(join(dir, 'preview.webp'))) previewFile = 'preview.webp'
      else if (existsSync(join(dir, 'preview.mp4'))) previewFile = 'preview.mp4'

      out.push({
        ...meta,
        origin: fallbackOrigin === 'bundled' ? 'bundled' : meta.origin || fallbackOrigin,
        dir,
        hasComposition: true,
        hasSchema: existsSync(join(dir, 'schema.ts')),
        previewFile
      })
    } catch (err) {
      console.warn(`[remotion-templates] 跳过无效模板 ${dir}:`, err)
    }
  }

  return out
}

/**
 * 合并内置 + 用户模板；同 id 时用户覆盖内置，并标记 overridesBundled。
 */
export function queryRemotionTemplates(
  filter?: RemotionTemplateFilter
): RemotionTemplateSummary[] {
  const bundled = scanTemplatesDir(queryBundledRemotionTemplatesDir(), 'bundled')
  const user = scanTemplatesDir(queryUserRemotionTemplatesDir(), 'local')

  const byId = new Map<string, RemotionTemplateSummary>()
  for (const t of bundled) {
    byId.set(t.id, t)
  }
  for (const t of user) {
    const prev = byId.get(t.id)
    byId.set(t.id, {
      ...t,
      overridesBundled: Boolean(prev && prev.origin === 'bundled')
    })
  }

  let list = [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))

  if (filter?.tag) {
    const tag = filter.tag.toLowerCase()
    list = list.filter((t) => (t.tags ?? []).some((x) => x.toLowerCase() === tag))
  }
  if (filter?.origin) {
    list = list.filter((t) => t.origin === filter.origin)
  }
  if (filter?.query?.trim()) {
    const q = filter.query.trim().toLowerCase()
    list = list.filter(
      (t) =>
        t.id.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        (t.description ?? '').toLowerCase().includes(q) ||
        (t.tags ?? []).some((x) => x.toLowerCase().includes(q))
    )
  }

  return list
}

/** 按 id 查找模板（用户优先） */
export function queryRemotionTemplateById(templateId: string): RemotionTemplateSummary | null {
  return queryRemotionTemplates().find((t) => t.id === templateId) ?? null
}

/** 读取会话工程 inputProps；文件缺失返回 {} */
export function queryRemotionInputProps(projectDir: string): Record<string, unknown> {
  const path = join(projectDir, REMOTION_INPUT_PROPS_FILE)
  if (!existsSync(path)) return {}
  try {
    const raw = JSON.parse(readFileSync(path, 'utf-8')) as unknown
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      return raw as Record<string, unknown>
    }
  } catch {
    // ignore
  }
  return {}
}

/** 写入会话 inputProps（全量覆盖） */
export function postRemotionInputProps(
  projectDir: string,
  props: Record<string, unknown>
): string {
  mkdirSync(projectDir, { recursive: true })
  const path = join(projectDir, REMOTION_INPUT_PROPS_FILE)
  writeFileSync(path, JSON.stringify(props, null, 2), 'utf-8')
  return path
}

/** 读取活动模板标记 */
export function queryRemotionActiveTemplate(
  projectDir: string
): RemotionActiveTemplateState | null {
  const path = join(projectDir, REMOTION_ACTIVE_TEMPLATE_FILE)
  if (!existsSync(path)) return null
  try {
    const raw = JSON.parse(readFileSync(path, 'utf-8')) as RemotionActiveTemplateState
    if (raw?.templateId && raw?.compositionId) return raw
  } catch {
    // ignore
  }
  return null
}

function postCopyDirFiltered(src: string, dest: string): void {
  if (!existsSync(src)) return
  mkdirSync(dest, { recursive: true })
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const from = join(src, entry.name)
    const to = join(dest, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'out' || entry.name === '.git') continue
      postCopyDirFiltered(from, to)
      continue
    }
    if (entry.isFile() && TEMPLATE_FILE_EXT.test(entry.name)) {
      cpSync(from, to)
    }
  }
}

/**
 * 将模板挂载到会话 Remotion 工程：ActiveTemplate + schema + props + Root.generated。
 */
export function postApplyRemotionTemplate(
  input: RemotionApplyTemplateInput
): RemotionApplyTemplateResult {
  const template = queryRemotionTemplateById(input.templateId)
  if (!template) {
    throw new Error(`未找到模板「${input.templateId}」`)
  }

  const compositionId =
    String(input.compositionId ?? template.compositionId ?? 'Main').trim() || 'Main'
  const width = input.width ?? template.width ?? 1920
  const height = input.height ?? template.height ?? 1080
  const fps = input.fps ?? template.fps ?? 30
  const durationInFrames = input.durationInFrames ?? template.durationInFrames ?? 150

  const init = postInitRemotionProject(input.sessionId, {
    compositionId,
    width,
    height,
    fps,
    durationInFrames
  })

  const projectDir = init.projectDir
  const srcDir = join(projectDir, 'src')

  // Composition → ActiveTemplate
  cpSync(join(template.dir, 'Composition.tsx'), join(srcDir, 'ActiveTemplate.tsx'))

  // 可选组件与 schema
  const tplComponents = join(template.dir, 'components')
  if (existsSync(tplComponents)) {
    postCopyDirFiltered(tplComponents, join(srcDir, 'components'))
  }
  const schemaSrc = join(template.dir, 'schema.ts')
  if (existsSync(schemaSrc)) {
    cpSync(schemaSrc, join(srcDir, 'activeSchema.ts'))
  } else if (existsSync(join(srcDir, 'activeSchema.ts'))) {
    rmSync(join(srcDir, 'activeSchema.ts'), { force: true })
  }

  // public 合并
  const tplPublic = join(template.dir, 'public')
  if (existsSync(tplPublic)) {
    postCopyDirFiltered(tplPublic, join(projectDir, 'public'))
  }

  // defaultProps + 用户 props
  let defaultProps: Record<string, unknown> = {}
  const defaultPropsPath = join(template.dir, 'defaultProps.json')
  if (existsSync(defaultPropsPath)) {
    try {
      const raw = JSON.parse(readFileSync(defaultPropsPath, 'utf-8')) as unknown
      if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
        defaultProps = raw as Record<string, unknown>
      }
    } catch {
      defaultProps = {}
    }
  }
  const mergedProps = { ...defaultProps, ...(input.props ?? {}) }
  const propsPath = postRemotionInputProps(projectDir, mergedProps)

  writeFileSync(
    join(projectDir, REMOTION_ACTIVE_TEMPLATE_FILE),
    JSON.stringify(
      { templateId: template.id, compositionId } satisfies RemotionActiveTemplateState,
      null,
      2
    ),
    'utf-8'
  )

  postWriteRootGenerated(projectDir, {
    compositionId,
    width,
    height,
    fps,
    durationInFrames,
    hasSchema: existsSync(join(srcDir, 'activeSchema.ts')),
    defaultProps: mergedProps
  })

  return {
    projectDir,
    templateId: template.id,
    compositionId,
    entryPoint: join(projectDir, 'src', 'index.ts'),
    propsPath
  }
}

/** 从源码收集相对 import 依赖（深度上限） */
function collectRelativeImports(
  entryFile: string,
  projectSrcRoot: string,
  maxDepth: number
): Set<string> {
  const collected = new Set<string>()
  const queue = [{ file: entryFile, depth: 0 }]

  while (queue.length) {
    const { file, depth } = queue.pop()!
    if (depth > maxDepth) continue
    if (!existsSync(file) || collected.has(file)) continue
    collected.add(file)
    if (!/\.(tsx?|jsx?)$/i.test(file)) continue

    const source = readFileSync(file, 'utf-8')
    const re = /from\s+['"](\.[^'"]+)['"]/g
    let m: RegExpExecArray | null
    while ((m = re.exec(source))) {
      const spec = m[1]
      const base = resolve(dirname(file), spec)
      const candidates = [
        base,
        `${base}.ts`,
        `${base}.tsx`,
        `${base}.js`,
        `${base}.jsx`,
        join(base, 'index.ts'),
        join(base, 'index.tsx')
      ]
      for (const c of candidates) {
        if (!existsSync(c) || !statSync(c).isFile()) continue
        const abs = resolve(c)
        // 仅收集 projectSrcRoot 内文件
        if (!abs.startsWith(resolve(projectSrcRoot))) continue
        if (!collected.has(abs)) queue.push({ file: abs, depth: depth + 1 })
        break
      }
    }
  }

  return collected
}

/** 扫描 staticFile('...') 引用 */
function collectStaticFileRefs(srcRoot: string): string[] {
  const refs: string[] = []
  const walk = (dir: string): void => {
    if (!existsSync(dir)) return
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, entry.name)
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules') continue
        walk(p)
        continue
      }
      if (!/\.(tsx?|jsx?)$/i.test(entry.name)) continue
      const text = readFileSync(p, 'utf-8')
      const re = /staticFile\(\s*['"]([^'"]+)['"]\s*\)/g
      let m: RegExpExecArray | null
      while ((m = re.exec(text))) {
        refs.push(m[1])
      }
    }
  }
  walk(srcRoot)
  return refs
}

/**
 * 将当前会话 Remotion 工程快照存为用户模板。
 */
export function postSaveRemotionTemplateFromChat(
  input: RemotionSaveTemplateFromChatInput
): RemotionTemplateSummary {
  validateRemotionTemplateId(input.templateId)
  const name = input.name.trim()
  if (!name) throw new Error('模板名称不能为空')

  const expectedDir = queryRemotionProjectDir(input.sessionId)
  const projectDir = resolve(input.projectDir?.trim() || expectedDir)
  if (projectDir !== resolve(expectedDir)) {
    throw new Error('工程目录必须属于当前会话的 Remotion 目录')
  }
  if (!existsSync(join(projectDir, 'src'))) {
    throw new Error('会话 Remotion 工程不存在，请先初始化或渲染')
  }

  const destDir = join(queryUserRemotionTemplatesDir(), input.templateId)
  if (existsSync(destDir)) {
    throw new Error(`模板 id「${input.templateId}」已存在，请更换 id 或先删除旧模板`)
  }

  mkdirSync(destDir, { recursive: true })
  const srcRoot = join(projectDir, 'src')
  const entryCandidates = [
    join(srcRoot, 'ActiveTemplate.tsx'),
    join(srcRoot, 'Composition.tsx')
  ]
  const entry = entryCandidates.find((p) => existsSync(p))
  if (!entry) {
    throw new Error('找不到 ActiveTemplate.tsx 或 Composition.tsx')
  }

  // 入口保存为 Composition.tsx
  cpSync(entry, join(destDir, 'Composition.tsx'))

  const deps = collectRelativeImports(entry, srcRoot, 5)
  for (const file of deps) {
    if (resolve(file) === resolve(entry)) continue
    const rel = relative(srcRoot, file)
    // 仅拷贝相对路径组件（components、lib、theme 等），跳过 Root/index
    if (
      rel.startsWith('Root') ||
      rel.startsWith('index') ||
      rel.startsWith('ActiveTemplate') ||
      rel.startsWith('activeSchema')
    ) {
      continue
    }
    const target = join(destDir, rel)
    mkdirSync(dirname(target), { recursive: true })
    if (TEMPLATE_FILE_EXT.test(file)) {
      cpSync(file, target)
    }
  }

  // schema
  const schemaPath = join(srcRoot, 'activeSchema.ts')
  if (existsSync(schemaPath)) {
    cpSync(schemaPath, join(destDir, 'schema.ts'))
  }

  // public 引用
  const publicDir = join(projectDir, 'public')
  for (const ref of collectStaticFileRefs(srcRoot)) {
    const from = join(publicDir, ref)
    if (existsSync(from) && TEMPLATE_FILE_EXT.test(from)) {
      const to = join(destDir, 'public', ref)
      mkdirSync(dirname(to), { recursive: true })
      cpSync(from, to)
    }
  }

  const props = queryRemotionInputProps(projectDir)
  writeFileSync(join(destDir, 'defaultProps.json'), JSON.stringify(props, null, 2), 'utf-8')

  if (input.videoPath && existsSync(input.videoPath)) {
    cpSync(input.videoPath, join(destDir, 'preview.mp4'))
  }

  const active = queryRemotionActiveTemplate(projectDir)
  const meta: RemotionTemplateMeta = {
    id: input.templateId,
    name,
    description: `从会话 ${input.sessionId} 保存`,
    origin: 'from-chat',
    tags: input.tags?.length ? input.tags : ['from-chat'],
    compositionId: input.compositionId ?? active?.compositionId ?? 'Main',
    sourceSessionId: input.sessionId,
    createdAt: new Date().toISOString()
  }

  // 尝试从 Root.generated 或会话配置读取画幅
  const generatedPath = join(srcRoot, 'Root.generated.tsx')
  if (existsSync(generatedPath)) {
    const g = readFileSync(generatedPath, 'utf-8')
    const w = g.match(/width:\s*(\d+)/)
    const h = g.match(/height:\s*(\d+)/)
    const f = g.match(/fps:\s*(\d+)/)
    const d = g.match(/durationInFrames:\s*(\d+)/)
    if (w) meta.width = Number(w[1])
    if (h) meta.height = Number(h[1])
    if (f) meta.fps = Number(f[1])
    if (d) meta.durationInFrames = Number(d[1])
  }

  writeFileSync(join(destDir, 'meta.json'), JSON.stringify(meta, null, 2), 'utf-8')

  const summary = queryRemotionTemplateById(input.templateId)
  if (!summary) throw new Error('模板保存后读取失败')
  return summary
}

/** 删除用户模板（不可删仅存在于 bundled 的包） */
export function postDeleteRemotionTemplate(templateId: string): void {
  validateRemotionTemplateId(templateId)
  const dir = join(queryUserRemotionTemplatesDir(), templateId)
  if (!existsSync(dir)) {
    throw new Error(`用户模板「${templateId}」不存在（内置模板不可删除）`)
  }
  rmSync(dir, { recursive: true, force: true })
}

/**
 * 将 Skill 附属 remotion-templates 目录注册到用户模板库（skill-bound）。
 * 已存在同 id 时跳过，不覆盖 from-chat / remote。
 */
export function postRegisterSkillBoundRemotionTemplates(
  skillId: string,
  skillDir: string
): string[] {
  const templatesRoot = join(skillDir, 'remotion-templates')
  if (!existsSync(templatesRoot)) return []

  const installed: string[] = []
  for (const entry of readdirSync(templatesRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const src = join(templatesRoot, entry.name)
    if (!existsSync(join(src, 'meta.json')) || !existsSync(join(src, 'Composition.tsx'))) {
      continue
    }
    let meta: RemotionTemplateMeta
    try {
      meta = parseRemotionTemplateMeta(
        JSON.parse(readFileSync(join(src, 'meta.json'), 'utf-8')) as unknown,
        'skill-bound'
      )
    } catch {
      continue
    }
    const id = meta.id || entry.name
    const dest = join(queryUserRemotionTemplatesDir(), id)
    if (existsSync(dest)) {
      // 已存在则跳过，避免覆盖用户自建
      continue
    }
    mkdirSync(dest, { recursive: true })
    postCopyDirFiltered(src, dest)
    // 强制 origin / skillIds
    const nextMeta: RemotionTemplateMeta = {
      ...meta,
      id,
      origin: 'skill-bound',
      skillIds: Array.from(new Set([...(meta.skillIds ?? []), skillId]))
    }
    writeFileSync(join(dest, 'meta.json'), JSON.stringify(nextMeta, null, 2), 'utf-8')
    installed.push(id)
  }
  return installed
}

/**
 * 删除 Skill 时移除其 skill-bound 模板（仅 origin=skill-bound 且 skillIds 含该 skill）。
 */
export function postRemoveSkillBoundRemotionTemplates(skillId: string): string[] {
  const removed: string[] = []
  for (const t of queryRemotionTemplates({ origin: 'skill-bound' })) {
    if (!(t.skillIds ?? []).includes(skillId)) continue
    if (t.origin !== 'skill-bound') continue
    // 仅删用户目录下的
    const userDir = join(queryUserRemotionTemplatesDir(), t.id)
    if (existsSync(userDir) && resolve(t.dir) === resolve(userDir)) {
      rmSync(userDir, { recursive: true, force: true })
      removed.push(t.id)
    }
  }
  return removed
}

/** 供测试/调试：数据根（勿在渲染层滥用） */
export function queryRemotionTemplatesDataHint(): string {
  return getDataRoot()
}

/** 导出 basename 避免 unused 警告在部分打包器 */
export { basename }
