/**
 * 从 GitHub / HTTPS 导入 Remotion 模板包。
 * 复用 skill-import 的 git clone 能力；定位含 meta.json + Composition.tsx 的目录。
 */

import { execFile } from 'child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync
} from 'fs'
import { join } from 'path'
import { promisify } from 'util'
import {
  parseRemotionTemplateMeta,
  validateRemotionTemplateId,
  type RemotionTemplateMeta,
  type RemotionTemplateSummary
} from '../../../shared/remotion-template'
import { getSkillImportTempDir } from './paths'
import {
  queryRemotionTemplateById,
  queryUserRemotionTemplatesDir
} from './remotion-templates'

const execFileAsync = promisify(execFile)
const GIT_CLONE_TIMEOUT_MS = 120_000

/** 模板包允许的文件扩展名 */
const ALLOWED_EXT = /\.(ts|tsx|json|css|png|jpg|jpeg|webp|svg|wav|mp3|mp4)$/i

interface TemplateManifest {
  templates?: Array<{ path: string; id?: string }>
}

function createTempImportDir(prefix: string): string {
  const dir = join(
    getSkillImportTempDir(),
    `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  )
  mkdirSync(dir, { recursive: true })
  return dir
}

function cleanupTempDir(dir: string): void {
  try {
    if (existsSync(dir)) rmSync(dir, { recursive: true, force: true })
  } catch {
    // ignore
  }
}

async function gitCloneRepo(cloneUrl: string, dest: string, branch?: string): Promise<void> {
  const args = ['clone', '--depth', '1']
  if (branch?.trim()) {
    args.push('--branch', branch.trim())
  }
  args.push(cloneUrl, dest)
  try {
    await execFileAsync('git', args, {
      timeout: GIT_CLONE_TIMEOUT_MS,
      maxBuffer: 10 * 1024 * 1024
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`git clone 失败：${msg}`)
  }
}

/** 规范化用户输入的仓库 URL */
function normalizeCloneUrl(input: string): string {
  const url = input.trim()
  if (!url) throw new Error('请输入模板仓库链接')
  if (/^git@/i.test(url) || /^https?:\/\//i.test(url)) return url
  throw new Error('仅支持 http(s) 或 git@ 链接')
}

/** 从 tree 链接提取子路径，如 .../tree/main/templates/brand-intro → templates/brand-intro */
function queryGithubTreeSubpath(url: string): string | undefined {
  const m = url.match(/github\.com\/[^/]+\/[^/]+\/tree\/[^/]+\/(.+?)(?:\/)?$/i)
  return m?.[1]?.replace(/\/$/, '') || undefined
}

function postCopyFiltered(src: string, dest: string): void {
  mkdirSync(dest, { recursive: true })
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const from = join(src, entry.name)
    const to = join(dest, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'out') continue
      postCopyFiltered(from, to)
      continue
    }
    if (entry.isFile() && ALLOWED_EXT.test(entry.name)) {
      cpSync(from, to)
    }
  }
}

function assertValidTemplateDir(dir: string): RemotionTemplateMeta {
  const metaPath = join(dir, 'meta.json')
  const compositionPath = join(dir, 'Composition.tsx')
  if (!existsSync(metaPath) || !existsSync(compositionPath)) {
    throw new Error(`目录缺少 meta.json 或 Composition.tsx：${dir}`)
  }
  return parseRemotionTemplateMeta(
    JSON.parse(readFileSync(metaPath, 'utf-8')) as unknown,
    'remote'
  )
}

function installTemplateDir(sourceDir: string, targetId: string, sourceUrl: string): RemotionTemplateSummary {
  validateRemotionTemplateId(targetId)
  const dest = join(queryUserRemotionTemplatesDir(), targetId)
  if (existsSync(dest)) {
    throw new Error(`模板 id「${targetId}」已存在，请更换目标 id 或先删除`)
  }
  const meta = assertValidTemplateDir(sourceDir)
  postCopyFiltered(sourceDir, dest)
  const nextMeta: RemotionTemplateMeta = {
    ...meta,
    id: targetId,
    origin: 'remote',
    sourceUrl
  }
  writeFileSync(join(dest, 'meta.json'), JSON.stringify(nextMeta, null, 2), 'utf-8')
  if (!existsSync(join(dest, 'defaultProps.json'))) {
    writeFileSync(join(dest, 'defaultProps.json'), '{}', 'utf-8')
  }
  const summary = queryRemotionTemplateById(targetId)
  if (!summary) throw new Error('模板导入后读取失败')
  return summary
}

/** 在克隆根目录查找模板：优先子路径 / manifest / 单模板根 */
function resolveTemplateDirs(repoRoot: string, hintPath?: string): Array<{ dir: string; idHint?: string }> {
  if (hintPath) {
    const dir = join(repoRoot, hintPath)
    if (existsSync(join(dir, 'meta.json'))) {
      return [{ dir, idHint: undefined }]
    }
  }

  const manifestPath = join(repoRoot, 'manifest.json')
  if (existsSync(manifestPath)) {
    try {
      const raw = JSON.parse(readFileSync(manifestPath, 'utf-8')) as TemplateManifest
      const list = raw.templates ?? []
      const found: Array<{ dir: string; idHint?: string }> = []
      for (const item of list) {
        const dir = join(repoRoot, item.path)
        if (existsSync(join(dir, 'meta.json'))) {
          found.push({ dir, idHint: item.id })
        }
      }
      if (found.length) return found
    } catch {
      // fall through
    }
  }

  if (existsSync(join(repoRoot, 'meta.json'))) {
    return [{ dir: repoRoot }]
  }

  // 扫描一级子目录
  const found: Array<{ dir: string; idHint?: string }> = []
  for (const entry of readdirSync(repoRoot, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue
    const dir = join(repoRoot, entry.name)
    if (existsSync(join(dir, 'meta.json')) && existsSync(join(dir, 'Composition.tsx'))) {
      found.push({ dir, idHint: entry.name })
    }
  }
  if (found.length) return found

  throw new Error('克隆成功但未找到 Remotion 模板（需含 meta.json + Composition.tsx 或根 manifest.json）')
}

/**
 * 从 URL 导入一个或多个 Remotion 模板到用户目录。
 * @returns 导入成功的模板摘要列表
 */
export async function postImportRemotionTemplateFromUrl(
  url: string,
  targetId?: string
): Promise<RemotionTemplateSummary[]> {
  const rawUrl = url.trim()
  normalizeCloneUrl(rawUrl)

  let gitUrl = rawUrl
  const treeMatch = gitUrl.match(/^(https?:\/\/github\.com\/[^/]+\/[^/]+)\/tree\//i)
  if (treeMatch) {
    gitUrl = `${treeMatch[1]}.git`
  } else if (/^https?:\/\/github\.com\/[^/]+\/[^/]+\/?$/i.test(gitUrl)) {
    gitUrl = gitUrl.replace(/\/?$/, '.git')
  } else if (/^git@/i.test(gitUrl)) {
    // git@ 保持原样
  } else if (!/\.git$/i.test(gitUrl) && /^https?:\/\//i.test(gitUrl)) {
    gitUrl = `${gitUrl.replace(/\/$/, '')}.git`
  }

  const hintPath = queryGithubTreeSubpath(rawUrl)
  const tempDir = createTempImportDir('remotion-tpl')
  const installed: RemotionTemplateSummary[] = []

  try {
    await gitCloneRepo(gitUrl, tempDir)
    const dirs = resolveTemplateDirs(tempDir, hintPath)

    if (targetId?.trim() && dirs.length > 1) {
      throw new Error('仓库含多个模板，请勿指定单一 targetId，或改用指向单模板子目录的 tree 链接')
    }

    for (const item of dirs) {
      const meta = assertValidTemplateDir(item.dir)
      const id = (targetId?.trim() || item.idHint || meta.id).trim()
      validateRemotionTemplateId(id)
      installed.push(installTemplateDir(item.dir, id, rawUrl))
    }
  } finally {
    cleanupTempDir(tempDir)
  }

  if (!installed.length) {
    throw new Error('未导入任何模板')
  }
  return installed
}
