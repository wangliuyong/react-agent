/**
 * Agent 产出资产：扫描 artifacts / videos 目录，支持单删与一键清空。
 * 所有写操作均校验路径落在白名单根目录内，防止越权删除。
 */
import { readdirSync, statSync, unlinkSync, rmSync, existsSync, readFileSync } from 'fs'
import { join, resolve, relative, sep } from 'path'
import type {
  AgentAssetKind,
  AgentAssetMutationResult,
  AgentAssetRecord,
  AgentAssetZone,
  QueryAgentAssetsOptions
} from '../../../shared/agent-assets'
import { queryAgentAssetKind } from '../../../shared/agent-assets'
import { getArtifactsDir, getVideosDir } from './paths'

/** 允许管理的根目录（绝对路径，已 normalize） */
function queryAllowedRoots(): string[] {
  return [resolve(getArtifactsDir()), resolve(getVideosDir())]
}

/** 判断绝对路径是否在白名单根目录下 */
export function queryIsAllowedAssetPath(filePath: string): boolean {
  const normalized = resolve(String(filePath ?? '').trim())
  if (!normalized) return false
  return queryAllowedRoots().some(
    (root) => normalized === root || normalized.startsWith(`${root}${sep}`)
  )
}

/** 根据相对 videos 子路径推断分区 */
function queryZoneFromPath(absPath: string, artifactsRoot: string, videosRoot: string): AgentAssetZone {
  const normalized = resolve(absPath)
  if (normalized.startsWith(`${artifactsRoot}${sep}`) || normalized === artifactsRoot) {
    return 'artifacts'
  }
  const rel = relative(videosRoot, normalized).replace(/\\/g, '/')
  if (rel.startsWith('scenes/')) return 'videos/scenes'
  if (rel.startsWith('projects/')) return 'videos/projects'
  return 'videos/other'
}

/** 递归扫描目录下的所有文件 */
function walkFiles(dir: string, out: string[]): void {
  if (!existsSync(dir)) return
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return
  }
  for (const name of entries) {
    const full = join(dir, name)
    let st
    try {
      st = statSync(full)
    } catch {
      continue
    }
    if (st.isDirectory()) {
      walkFiles(full, out)
    } else if (st.isFile()) {
      out.push(full)
    }
  }
}

/**
 * 列举 Agent 生成的全部本地文件。
 * 覆盖 artifacts/ 与 videos/（含 scenes、projects 子目录）。
 */
export function queryAgentAssets(options?: QueryAgentAssetsOptions): AgentAssetRecord[] {
  const artifactsRoot = resolve(getArtifactsDir())
  const videosRoot = resolve(getVideosDir())
  const kindFilter = options?.kind ?? 'all'

  const files: string[] = []
  walkFiles(artifactsRoot, files)
  walkFiles(videosRoot, files)

  const records: AgentAssetRecord[] = files.map((filePath) => {
    const st = statSync(filePath)
    const name = filePath.split(/[/\\]/).pop() ?? filePath
    return {
      path: filePath,
      name,
      size: st.size,
      mtime: st.mtime.toISOString(),
      kind: queryAgentAssetKind(name),
      zone: queryZoneFromPath(filePath, artifactsRoot, videosRoot)
    }
  })

  const filtered =
    kindFilter === 'all' ? records : records.filter((r) => r.kind === kindFilter)

  // 默认按修改时间倒序（最新在前）
  return filtered.sort((a, b) => b.mtime.localeCompare(a.mtime))
}

/** 删除单个资产文件 */
export function postDeleteAgentAsset(filePath: string): AgentAssetMutationResult {
  const normalized = resolve(String(filePath ?? '').trim())
  if (!queryIsAllowedAssetPath(normalized)) {
    throw new Error('不允许删除该路径')
  }
  if (!existsSync(normalized)) {
    return { ok: true, deletedCount: 0 }
  }
  const st = statSync(normalized)
  if (!st.isFile()) {
    throw new Error('仅支持删除文件')
  }
  unlinkSync(normalized)
  return { ok: true, deletedCount: 1 }
}

/**
 * 一键清空全部 Agent 产出（保留根目录结构）。
 * 递归删除 artifacts/ 与 videos/ 下所有文件及空目录，再重建根目录。
 */
export function postClearAgentAssets(): AgentAssetMutationResult {
  const roots = queryAllowedRoots()
  let deletedCount = 0

  for (const root of roots) {
    if (!existsSync(root)) continue
    // 先统计文件数
    const files: string[] = []
    walkFiles(root, files)
    deletedCount += files.length
    // 清空整个目录树后重建
    rmSync(root, { recursive: true, force: true })
  }

  // 重建空目录（paths.ts 的 ensureDir 会在下次访问时创建，此处主动恢复）
  getArtifactsDir()
  getVideosDir()

  return { ok: true, deletedCount }
}

/** 批量删除路径列表 */
export function postDeleteAgentAssets(paths: string[]): AgentAssetMutationResult {
  let deletedCount = 0
  for (const p of paths) {
    const result = postDeleteAgentAsset(p)
    deletedCount += result.deletedCount
  }
  return { ok: true, deletedCount }
}

const TEXT_PREVIEW_MAX_BYTES = 512_000

/** 读取文本类资产预览（大小受限，路径白名单） */
export function queryAgentAssetTextPreview(filePath: string): string | null {
  const normalized = resolve(String(filePath ?? '').trim())
  if (!queryIsAllowedAssetPath(normalized) || !existsSync(normalized)) return null
  const st = statSync(normalized)
  if (!st.isFile() || st.size > TEXT_PREVIEW_MAX_BYTES) return null
  try {
    return readFileSync(normalized, 'utf-8')
  } catch {
    return null
  }
}

export type { AgentAssetKind, AgentAssetRecord }
