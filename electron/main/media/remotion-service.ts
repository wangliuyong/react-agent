/**
 * Remotion 项目初始化、Studio 预览与程序化渲染服务。
 * 使用 @remotion/bundler + @remotion/renderer，避免在 Electron 主进程依赖外部 npx。
 */

import { type ChildProcess, spawn } from 'child_process'
import { app, shell } from 'electron'
import { createRequire } from 'module'
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync
} from 'fs'
import { basename, dirname, join } from 'path'
import type {
  RemotionExportRecord,
  PostEnqueueRemotionExportInput,
  PostUpdateRemotionExportInput
} from '../../../shared/remotion-exports'
import { queryBundledResourcesRoot } from '../store/resources'
import { getVideosDir } from '../store/paths'
import { querySession } from '../store/sessions'
import { queryRemotionSfxWebpackOverride } from './remotion-sfx'
import { queryPatchRootCompositionSource } from './query-patch-root-composition'

const requireFromMain = createRequire(__filename)

/** Remotion 渲染阶段进度 */
export interface RemotionRenderProgress {
  phase: 'browser' | 'bundle' | 'render'
  /** 0–100 总体进度 */
  percent: number
  message?: string
}

/** 渲染画质预设 */
export type RemotionQualityPreset = 'fast' | 'standard' | 'high'

/** 画质预设对应的编码参数 */
const QUALITY_PRESETS: Record<RemotionQualityPreset, { crf: number; concurrency: number }> = {
  /** 快速预览：体积小，速度快，画质一般 */
  fast: { crf: 28, concurrency: 2 },
  /** 标准平衡：默认选项，速度与画质兼顾 */
  standard: { crf: 23, concurrency: 4 },
  /** 高质量：画质好，体积大，渲染慢 */
  high: { crf: 18, concurrency: 6 }
}

export interface RemotionRenderResult {
  ok: boolean
  message: string
  path?: string
  /** 是否复用了同会话已在进行的渲染 */
  reused?: boolean
  /** 错误分类，用于排错提示 */
  errorType?: 'bundle' | 'composition' | 'render' | 'browser' | 'unknown'
}

/** 会话内进行中的渲染任务 */
interface RemotionRenderJob {
  sessionId: string
  compositionId: string
  outputPath: string
  promise: Promise<RemotionRenderResult>
  progressListeners: Set<(progress: RemotionRenderProgress) => void>
  lastProgress?: RemotionRenderProgress
  /** 用于用户取消或会话中止时中断 bundle/render */
  abortController: AbortController
}

/** 会话 → 正在运行的 Studio 进程 */
const studioBySession = new Map<
  string,
  { process: ChildProcess; url: string; projectDir: string }
>()

/** 会话 → 进行中的渲染任务（同一对话同时只允许一个） */
const renderBySession = new Map<string, RemotionRenderJob>()

/** 导出历史落盘路径（与会话工程同级，避免被单次会话目录清理误删） */
function queryExportHistoryPath(): string {
  const dir = join(getVideosDir(), 'remotion')
  mkdirSync(dir, { recursive: true })
  return join(dir, 'exports-history.json')
}

/** 读取导出历史；损坏或缺失时返回空列表 */
function queryLoadExportHistory(): RemotionExportRecord[] {
  const path = queryExportHistoryPath()
  if (!existsSync(path)) return []
  try {
    const raw = JSON.parse(readFileSync(path, 'utf-8')) as unknown
    if (!Array.isArray(raw)) return []
    return raw.filter(
      (item): item is RemotionExportRecord =>
        Boolean(item) &&
        typeof item === 'object' &&
        typeof (item as RemotionExportRecord).id === 'string' &&
        typeof (item as RemotionExportRecord).outputPath === 'string'
    )
  } catch {
    return []
  }
}

/** 持久化导出历史（保留最近 200 条，按更新时间倒序） */
function postSaveExportHistory(records: RemotionExportRecord[]): void {
  const sorted = [...records].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 200)
  writeFileSync(queryExportHistoryPath(), JSON.stringify(sorted, null, 2), 'utf-8')
}

/** 按 id 合并写入一条导出记录 */
function postUpsertExportRecord(
  next: RemotionExportRecord,
  history = queryLoadExportHistory()
): RemotionExportRecord[] {
  const idx = history.findIndex((item) => item.id === next.id)
  if (idx >= 0) {
    history[idx] = { ...history[idx], ...next }
  } else {
    history.push(next)
  }
  postSaveExportHistory(history)
  return history
}

/** 生成导出记录 id：同会话同输出文件视为同一任务 */
function queryExportRecordId(sessionId: string, outputPath: string): string {
  return `${sessionId}:${basename(outputPath)}`
}

/**
 * 按会话同步所有「导出中」记录的进度 / 成片路径。
 * Agent 可能未使用入队时的 fileName，导致 render job id 与入队 id 不一致，必须按 sessionId 对齐。
 */
function postSyncSessionExportingRecords(
  sessionId: string,
  patch: {
    progressPercent?: number
    compositionId?: string
    outputPath?: string
    status?: RemotionExportRecord['status']
    errorMessage?: string
    size?: number
  }
): void {
  const history = queryLoadExportHistory()
  let changed = false
  const now = Date.now()
  for (let i = 0; i < history.length; i++) {
    const item = history[i]
    if (item.sessionId !== sessionId || item.status !== 'exporting') continue
    const next: RemotionExportRecord = {
      ...item,
      updatedAt: now,
      progressPercent: (() => {
        if (patch.progressPercent == null) return item.progressPercent
        return Math.max(patch.progressPercent, item.progressPercent ?? 0)
      })(),
      compositionId: patch.compositionId ?? item.compositionId,
      errorMessage: patch.errorMessage ?? item.errorMessage,
      size: patch.size ?? item.size
    }
    if (patch.outputPath) {
      next.outputPath = patch.outputPath
      next.fileName = basename(patch.outputPath)
      // id 保持入队时的稳定 key，避免列表闪烁/重复
    }
    if (patch.status) {
      next.status = patch.status
      if (patch.status === 'success') next.progressPercent = 100
    }
    history[i] = next
    changed = true
  }
  if (changed) postSaveExportHistory(history)
}

/** 节流：将渲染进度落盘到同会话导出中记录（供列表轮询） */
let lastExportProgressWriteAt = 0
function postThrottleSyncExportProgress(
  sessionId: string,
  progress: RemotionRenderProgress,
  compositionId: string,
  outputPath: string
): void {
  const now = Date.now()
  // 至少每 800ms 写一次，避免频繁刷盘
  if (now - lastExportProgressWriteAt < 800 && progress.percent < 100) return
  lastExportProgressWriteAt = now
  postSyncSessionExportingRecords(sessionId, {
    progressPercent: progress.percent,
    compositionId,
    outputPath
  })
}

/**
 * 扫描会话 out 目录最新 mp4（用于入队 fileName 与实际渲染名不一致时的收口）。
 */
function queryLatestSessionMp4(sessionId: string): { path: string; size: number; mtime: number } | null {
  const outDir = join(queryRemotionProjectDir(sessionId), 'out')
  if (!existsSync(outDir)) return null
  let files: string[]
  try {
    files = readdirSync(outDir)
  } catch {
    return null
  }
  let best: { path: string; size: number; mtime: number } | null = null
  for (const name of files) {
    if (!name.toLowerCase().endsWith('.mp4')) continue
    const full = join(outDir, name)
    try {
      const st = statSync(full)
      if (!st.isFile() || st.size <= 0) continue
      if (!best || st.mtimeMs > best.mtime) {
        best = { path: full, size: st.size, mtime: st.mtimeMs }
      }
    } catch {
      // ignore
    }
  }
  return best
}

/**
 * 调和卡住的「导出中」：无活跃渲染时，若已有成片则标成功；会话已结束且无成片则标失败。
 * 解决渲染进程火忘轮询因刷新中断导致列表永不更新的问题。
 */
function postReconcileExportingRecords(history: RemotionExportRecord[]): RemotionExportRecord[] {
  let changed = false
  const now = Date.now()
  const next = history.map((record) => {
    if (record.status !== 'exporting') return record
    if (renderBySession.has(record.sessionId)) return record

    // 1) 预期路径已有文件
    if (existsSync(record.outputPath)) {
      try {
        const st = statSync(record.outputPath)
        if (st.isFile() && st.size > 0) {
          changed = true
          return {
            ...record,
            status: 'success' as const,
            progressPercent: 100,
            size: st.size,
            updatedAt: now
          }
        }
      } catch {
        // fall through
      }
    }

    // 2) 同会话 out 下已有其它文件名的成片（Agent 未使用指定 outputFileName）
    const latest = queryLatestSessionMp4(record.sessionId)
    if (latest) {
      changed = true
      return {
        ...record,
        status: 'success' as const,
        outputPath: latest.path,
        fileName: basename(latest.path),
        progressPercent: 100,
        size: latest.size,
        updatedAt: now
      }
    }

    // 3) 会话仍活跃（任务进行中或最近有写入）：给准备阶段进度，避免长期卡在 0%
    const session = querySession(record.sessionId)
    if (!session) return record
    const tasks = session.tasks ?? []
    const busy = tasks.some((t) => t.status === 'running' || t.status === 'pending')
    const sessionFresh = now - session.updatedAt < 20_000
    const messages = session.messages ?? []
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant')
    const awaitingRender = Boolean(
      lastAssistant?.awaitMeta?.choices?.some((c) => c.id === 'render')
    )

    if (busy || sessionFresh || awaitingRender) {
      const prep = awaitingRender
        ? Math.max(record.progressPercent ?? 0, 18)
        : Math.max(record.progressPercent ?? 0, busy ? 12 : 6)
      if (prep !== (record.progressPercent ?? 0)) {
        changed = true
        return { ...record, progressPercent: prep, updatedAt: now }
      }
      return record
    }

    // 4) 会话已长时间空闲且无成片：标失败（渲染进程火忘轮询中断后的兜底）
    const idleMs = now - Math.max(record.updatedAt, session.updatedAt)
    if (idleMs > 120_000 && messages.length > 0) {
      const last = messages[messages.length - 1]
      const errMsg =
        last.role === 'assistant' && last.content
          ? last.content.slice(0, 400)
          : '导出未完成（会话已结束且未生成成片）'
      changed = true
      return {
        ...record,
        status: 'failed' as const,
        errorMessage: errMsg,
        updatedAt: now
      }
    }

    return record
  })

  if (changed) postSaveExportHistory(next)
  return changed ? queryLoadExportHistory() : history
}

/**
 * 扫描 remotion 各会话 out 目录下的 mp4，补全历史中尚未登记的成功成片
 * （兼容改造前已导出、或历史文件被清空的情况）。
 */
function queryDiskRemotionMp4Records(
  existingIds: Set<string>
): RemotionExportRecord[] {
  const remotionRoot = join(getVideosDir(), 'remotion')
  if (!existsSync(remotionRoot)) return []

  const discovered: RemotionExportRecord[] = []
  let sessionDirs: string[]
  try {
    sessionDirs = readdirSync(remotionRoot)
  } catch {
    return []
  }

  for (const sessionId of sessionDirs) {
    if (sessionId === 'exports-history.json') continue
    const outDir = join(remotionRoot, sessionId, 'out')
    if (!existsSync(outDir)) continue
    let files: string[]
    try {
      files = readdirSync(outDir)
    } catch {
      continue
    }
    for (const name of files) {
      if (!name.toLowerCase().endsWith('.mp4')) continue
      const outputPath = join(outDir, name)
      const id = queryExportRecordId(sessionId, outputPath)
      if (existingIds.has(id)) continue
      let st
      try {
        st = statSync(outputPath)
      } catch {
        continue
      }
      if (!st.isFile()) continue
      const mtime = st.mtimeMs
      discovered.push({
        id,
        sessionId,
        compositionId: 'Main',
        outputPath,
        fileName: name,
        status: 'success',
        createdAt: mtime,
        updatedAt: mtime,
        size: st.size
      })
    }
  }
  return discovered
}

/**
 * 列举 Remotion 导出：历史（含失败）+ 进行中任务进度 + 磁盘已有 mp4。
 * 供「导出列表」抽屉拉取。
 */
export function queryRemotionExports(): RemotionExportRecord[] {
  // 先调和卡住的导出中记录（刷新后渲染进程轮询可能已中断）
  let history = postReconcileExportingRecords(queryLoadExportHistory())
  const byId = new Map<string, RemotionExportRecord>(history.map((item) => [item.id, item]))

  // 进行中任务：按精确 id + 同 session 的「导出中」记录同步进度
  for (const job of Array.from(renderBySession.values())) {
    const percent = job.lastProgress?.percent ?? 0
    const exactId = queryExportRecordId(job.sessionId, job.outputPath)
    const prevExact = byId.get(exactId)
    byId.set(exactId, {
      id: exactId,
      sessionId: job.sessionId,
      compositionId: job.compositionId,
      outputPath: job.outputPath,
      fileName: basename(job.outputPath),
      status: 'exporting',
      createdAt: prevExact?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
      title: prevExact?.title,
      progressPercent: percent || prevExact?.progressPercent || 0
    })

    for (const record of Array.from(byId.values())) {
      if (record.sessionId !== job.sessionId || record.status !== 'exporting') continue
      if (record.id === exactId) continue
      byId.set(record.id, {
        ...record,
        compositionId: job.compositionId,
        // 展示实际渲染路径，便于打开目录 / 完成后查看
        outputPath: job.outputPath,
        fileName: basename(job.outputPath),
        progressPercent: percent || record.progressPercent || 0,
        updatedAt: Date.now()
      })
    }
  }

  // 磁盘成片补全
  for (const disk of queryDiskRemotionMp4Records(new Set(Array.from(byId.keys())))) {
    byId.set(disk.id, disk)
  }

  // 成功记录补充实时文件大小（文件仍在时）
  for (const record of Array.from(byId.values())) {
    if (record.status !== 'success') continue
    if (!existsSync(record.outputPath)) continue
    try {
      const st = statSync(record.outputPath)
      if (st.isFile()) {
        record.size = st.size
      }
    } catch {
      // 忽略瞬时 IO 错误
    }
  }

  return Array.from(byId.values()).sort((a, b) => b.updatedAt - a.updatedAt)
}

/**
 * 点击「导出视频」时立刻入队：写入「导出中」记录，供导出列表即时可见。
 * 输出路径按会话 remotion/out 目录预计算，与后续 remotion_render 的 outputFileName 对齐。
 */
export function postEnqueueRemotionExport(
  input: PostEnqueueRemotionExportInput
): RemotionExportRecord {
  const fileName = String(input.fileName ?? '').trim() || `remotion-${Date.now()}.mp4`
  const safeName = fileName.toLowerCase().endsWith('.mp4') ? fileName : `${fileName}.mp4`
  const sessionId = String(input.sessionId ?? '').trim()
  if (!sessionId) {
    throw new Error('sessionId 不能为空')
  }
  const compositionId = String(input.compositionId ?? 'Main').trim() || 'Main'
  const outputPath = join(queryRemotionProjectDir(sessionId), 'out', safeName)
  const now = Date.now()
  const id = queryExportRecordId(sessionId, outputPath)
  const history = queryLoadExportHistory()
  const prev = history.find((item) => item.id === id)
  const record: RemotionExportRecord = {
    id,
    sessionId,
    compositionId,
    outputPath,
    fileName: safeName,
    status: 'exporting',
    createdAt: prev?.createdAt ?? now,
    updatedAt: now,
    title: input.title?.trim() || prev?.title,
    progressPercent: 0
  }
  postUpsertExportRecord(record, history)
  return record
}

/** 后台任务回写导出状态（成功 / 失败 / 进度） */
export function postUpdateRemotionExport(
  input: PostUpdateRemotionExportInput
): RemotionExportRecord | null {
  const id = String(input.id ?? '').trim()
  if (!id) return null
  const history = queryLoadExportHistory()
  const prev = history.find((item) => item.id === id)
  if (!prev) return null

  const outputPath = input.outputPath?.trim() || prev.outputPath
  let size = input.size
  if (input.status === 'success' && size == null && existsSync(outputPath)) {
    try {
      size = statSync(outputPath).size
    } catch {
      // ignore
    }
  }

  const next: RemotionExportRecord = {
    ...prev,
    status: input.status,
    outputPath,
    fileName: basename(outputPath),
    updatedAt: Date.now(),
    // 导出中不允许进度回退，避免准备阶段心跳覆盖真实渲染进度
    progressPercent: (() => {
      if (input.status === 'success') return 100
      const incoming = input.progressPercent
      if (incoming == null) return prev.progressPercent
      if (input.status === 'exporting') {
        return Math.max(incoming, prev.progressPercent ?? 0)
      }
      return incoming
    })(),
    errorMessage: input.status === 'failed' ? input.errorMessage?.slice(0, 400) : undefined,
    size: input.status === 'success' ? size : prev.size
  }
  postUpsertExportRecord(next, history)
  return next
}

/** 判断子进程是否仍存活（killed 仅表示主动 kill，需结合 exitCode） */
function queryIsChildAlive(child: ChildProcess): boolean {
  return Boolean(child.pid) && !child.killed && child.exitCode == null
}

/** 会话级 Remotion 工程目录 */
export function queryRemotionProjectDir(sessionId: string): string {
  const dir = join(getVideosDir(), 'remotion', sessionId)
  mkdirSync(dir, { recursive: true })
  return dir
}

export interface RemotionInitConfig {
  compositionId?: string
  width?: number
  height?: number
  fps?: number
  durationInFrames?: number
}

export interface RemotionInitResult {
  projectDir: string
  /** 是否首次从内置模板复制 */
  created: boolean
  compositionId: string
  entryPoint: string
}

/** 将内置 starter 模板复制到会话目录（已存在则跳过复制） */
export function postInitRemotionProject(
  sessionId: string,
  config: RemotionInitConfig = {}
): RemotionInitResult {
  const projectDir = queryRemotionProjectDir(sessionId)
  const marker = join(projectDir, '.remotion-initialized')
  const compositionId = String(config.compositionId ?? 'Main').trim() || 'Main'
  // 默认横版 16:9（1920×1080）；竖版短视频可显式传入 1080×1920
  const width = config.width ?? 1920
  const height = config.height ?? 1080
  const fps = config.fps ?? 30
  const durationInFrames = config.durationInFrames ?? 150
  let created = false

  if (!existsSync(marker)) {
    const starterDir = join(queryBundledResourcesRoot(), 'remotion', 'starter')
    if (!existsSync(join(starterDir, 'src', 'index.ts'))) {
      throw new Error(`内置 Remotion 模板缺失：${starterDir}`)
    }
    cpSync(starterDir, projectDir, { recursive: true })
    writeFileSync(marker, new Date().toISOString(), 'utf-8')
    created = true
  }

  // 每次初始化可更新 Root.tsx 中的画幅/时长（竖版 9:16 等需显式传入 width/height）
  postPatchRootComposition(projectDir, {
    compositionId,
    width,
    height,
    fps,
    durationInFrames
  })

  return {
    projectDir,
    created,
    compositionId,
    entryPoint: join(projectDir, 'src', 'index.ts')
  }
}

/** 更新 Root.tsx 中指定 Composition 的画幅/时长（按 id 定位，避免误改其它 Composition） */
function postPatchRootComposition(
  projectDir: string,
  config: Required<Pick<RemotionInitConfig, 'compositionId' | 'width' | 'height' | 'fps' | 'durationInFrames'>>
): void {
  const rootPath = join(projectDir, 'src', 'Root.tsx')
  if (!existsSync(rootPath)) return

  const rootSource = readFileSync(rootPath, 'utf-8')
  const next = queryPatchRootCompositionSource(rootSource, config)
  if (next !== rootSource) {
    writeFileSync(rootPath, next, 'utf-8')
  }
}

export interface RemotionRenderInput {
  /** 会话 id：用于同会话渲染去重/复用 */
  sessionId: string
  projectDir: string
  compositionId: string
  outputPath: string
  signal?: AbortSignal
  /** 渲染各阶段进度回调（节流后推送 UI） */
  onProgress?: (progress: RemotionRenderProgress) => void
  /** 画质预设，默认 standard */
  quality?: RemotionQualityPreset
  /** 自定义 CRF（0-51，越小画质越好），覆盖 quality 预设 */
  crf?: number
  /** 并发渲染线程数，覆盖 quality 预设 */
  concurrency?: number
}

/**
 * 节流进度推送，避免 IPC 事件过于密集。
 * 总体进度权重：浏览器 0–10%、打包 10–30%、渲染 30–100%。
 */
function createRemotionProgressReporter(
  onProgress?: (progress: RemotionRenderProgress) => void
): (input: RemotionRenderProgress) => void {
  let lastPercent = -1
  let lastPhase = ''

  return (input) => {
    if (!onProgress) return
    if (input.phase === lastPhase && input.percent === lastPercent) return
    lastPhase = input.phase
    lastPercent = input.percent
    onProgress(input)
  }
}

/** 将 Remotion bundler 的 0–100 整数进度映射到总体 10–30% */
function queryBundleOverallPercent(bundlePercent: number): number {
  return 10 + Math.round(Math.max(0, Math.min(100, bundlePercent)) * 0.2)
}

/** 将 Remotion renderMedia 的 0–1 进度映射到总体 30–100% */
function queryRenderOverallPercent(renderRatio: number): number {
  return 30 + Math.round(Math.max(0, Math.min(1, renderRatio)) * 70)
}

export interface RemotionStudioInput {
  sessionId: string
  projectDir: string
  /** 是否用系统浏览器打开 Studio；默认 true */
  openBrowser?: boolean
  signal?: AbortSignal
}

export interface RemotionStudioResult {
  ok: boolean
  message: string
  url?: string
  reused?: boolean
}

/** 解析应用内 @remotion/cli 入口脚本路径 */
function queryRemotionCliPath(): string {
  try {
    return requireFromMain.resolve('@remotion/cli/remotion-cli.js')
  } catch {
    const candidates = [
      join(app.getAppPath(), 'node_modules', '@remotion', 'cli', 'remotion-cli.js'),
      join(__dirname, '../../../node_modules/@remotion/cli/remotion-cli.js')
    ]
    const found = candidates.find((p) => existsSync(p))
    if (found) return found
    throw new Error('找不到 @remotion/cli，请确认已安装 remotion 依赖')
  }
}

/** 从 Studio 进程输出中提取本地预览 URL */
function queryStudioUrlFromOutput(chunk: string): string | null {
  const httpMatch = chunk.match(/https?:\/\/(?:localhost|127\.0\.0\.1):\d+\b/)
  if (httpMatch) return httpMatch[0]
  const portMatch = chunk.match(/(?:Already running on port|Server ready.*?port)\s+(\d+)/i)
  if (portMatch) return `http://localhost:${portMatch[1]}`
  return null
}

/**
 * 启动 Remotion Studio 预览（长驻进程）。
 * 同一会话重复调用时复用已有实例；可选打开系统浏览器。
 */
export async function postStartRemotionStudio(
  input: RemotionStudioInput
): Promise<RemotionStudioResult> {
  const entryPoint = join(input.projectDir, 'src', 'index.ts')
  if (!existsSync(entryPoint)) {
    return {
      ok: false,
      message: `找不到入口 ${entryPoint}，请先调用 remotion_init_project`
    }
  }

  const existing = studioBySession.get(input.sessionId)
  // 进程仍存活则复用；工程目录变更时关掉旧实例再启新的
  if (existing && queryIsChildAlive(existing.process)) {
    if (existing.projectDir === input.projectDir) {
      if (input.openBrowser !== false) {
        await shell.openExternal(existing.url)
      }
      return {
        ok: true,
        reused: true,
        url: existing.url,
        message: `Remotion Studio 已在运行：${existing.url}`
      }
    }
    try {
      existing.process.kill()
    } catch {
      // ignore
    }
    studioBySession.delete(input.sessionId)
  } else if (existing) {
    studioBySession.delete(input.sessionId)
  }

  let cliPath: string
  try {
    cliPath = queryRemotionCliPath()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, message: msg }
  }

  const appRoot = app.getAppPath()
  const nodePathParts = [
    join(appRoot, 'node_modules'),
    process.env.NODE_PATH
  ].filter(Boolean)

  return new Promise((resolve) => {
    let settled = false
    let outputBuf = ''
    const child = spawn(
      process.execPath,
      [cliPath, 'studio', entryPoint, '--no-open'],
      {
        cwd: input.projectDir,
        env: {
          ...process.env,
          ELECTRON_RUN_AS_NODE: '1',
          NODE_PATH: nodePathParts.join(process.platform === 'win32' ? ';' : ':')
        },
        stdio: ['ignore', 'pipe', 'pipe']
      }
    )

    const finish = (result: RemotionStudioResult): void => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve(result)
    }

    const timer = setTimeout(() => {
      if (!settled) {
        child.kill()
        finish({
          ok: false,
          message: '启动 Remotion Studio 超时（60s）。请检查工程代码是否有语法错误。'
        })
      }
    }, 60_000)

    const onChunk = async (buf: Buffer): Promise<void> => {
      const text = buf.toString('utf-8')
      outputBuf += text
      const url = queryStudioUrlFromOutput(text) ?? queryStudioUrlFromOutput(outputBuf)
      if (!url || settled) return

      studioBySession.set(input.sessionId, {
        process: child,
        url,
        projectDir: input.projectDir
      })

      if (input.openBrowser !== false) {
        try {
          await shell.openExternal(url)
        } catch {
          // 打开浏览器失败不阻断工具成功
        }
      }

      finish({
        ok: true,
        reused: false,
        url,
        message: `Remotion Studio 已启动：${url}`
      })
    }

    child.stdout?.on('data', (buf: Buffer) => {
      void onChunk(buf)
    })
    child.stderr?.on('data', (buf: Buffer) => {
      void onChunk(buf)
    })

    child.on('error', (err) => {
      studioBySession.delete(input.sessionId)
      finish({
        ok: false,
        message: `启动 Remotion Studio 失败：${err.message}`
      })
    })

    child.on('exit', (code) => {
      studioBySession.delete(input.sessionId)
      if (!settled) {
        finish({
          ok: false,
          message:
            `Remotion Studio 进程退出（code=${code}）。` +
            `输出：${outputBuf.slice(-800) || '无'}`
        })
      }
    })

    input.signal?.addEventListener('abort', () => {
      child.kill()
      finish({ ok: false, message: 'Studio 启动已取消' })
    })
  })
}

/** 关闭指定会话或全部 Remotion Studio 进程（取消确认 / Agent 中止 / 应用退出时调用） */
export function postStopRemotionStudios(sessionId?: string): void {
  const entries = sessionId
    ? ([[sessionId, studioBySession.get(sessionId)]] as const).filter(
      (row): row is readonly [string, NonNullable<(typeof row)[1]>] => Boolean(row[1])
    )
    : [...studioBySession.entries()]

  for (const [id, entry] of entries) {
    try {
      entry.process.kill()
    } catch {
      // ignore
    }
    studioBySession.delete(id)
  }
}

/**
 * 取消指定会话进行中的 Remotion 渲染任务（含排队中的 job）。
 * 渲染确认弹窗点「取消」或 Agent 中止时调用。
 */
export function postCancelRemotionRenderSession(sessionId: string): void {
  const job = renderBySession.get(sessionId)
  if (!job) return
  try {
    job.abortController.abort()
    // 用户取消视为失败记录，便于导出列表可追溯
    const now = Date.now()
    const id = queryExportRecordId(sessionId, job.outputPath)
    const history = queryLoadExportHistory()
    const prev = history.find((item) => item.id === id)
    postUpsertExportRecord(
      {
        id,
        sessionId,
        compositionId: job.compositionId,
        outputPath: job.outputPath,
        fileName: basename(job.outputPath),
        status: 'failed',
        createdAt: prev?.createdAt ?? now,
        updatedAt: now,
        errorMessage: '用户取消导出',
        progressPercent: job.lastProgress?.percent
      },
      history
    )
  } finally {
    if (renderBySession.get(sessionId) === job) {
      renderBySession.delete(sessionId)
    }
  }
}

/**
 * 打包 Remotion 工程并渲染为 mp4。
 * 同一会话同时只允许一个渲染：若已有进行中的任务则复用其 Promise，并挂接进度回调。
 * 首次渲染会下载 Chromium，可能耗时较长。
 */
export async function postRenderRemotionVideo(
  input: RemotionRenderInput
): Promise<RemotionRenderResult> {
  const existing = renderBySession.get(input.sessionId)
  if (existing) {
    if (input.onProgress) {
      existing.progressListeners.add(input.onProgress)
      if (existing.lastProgress) {
        input.onProgress(existing.lastProgress)
      }
    }
    const result = await existing.promise
    if (input.onProgress) {
      existing.progressListeners.delete(input.onProgress)
    }
    return {
      ...result,
      reused: true,
      message: result.ok
        ? `复用同会话进行中的渲染：${result.path ?? existing.outputPath}`
        : result.message
    }
  }

  const entryPoint = join(input.projectDir, 'src', 'index.ts')
  if (!existsSync(entryPoint)) {
    return {
      ok: false,
      message: `找不到入口 ${entryPoint}，请先调用 remotion_init_project`
    }
  }

  mkdirSync(dirname(input.outputPath), { recursive: true })

  const progressListeners = new Set<(progress: RemotionRenderProgress) => void>()
  if (input.onProgress) {
    progressListeners.add(input.onProgress)
  }

  const jobAbort = new AbortController()
  if (input.signal?.aborted) {
    jobAbort.abort()
  } else if (input.signal) {
    input.signal.addEventListener('abort', () => jobAbort.abort(), { once: true })
  }
  const renderSignal = jobAbort.signal

  const job: RemotionRenderJob = {
    sessionId: input.sessionId,
    compositionId: input.compositionId,
    outputPath: input.outputPath,
    progressListeners,
    abortController: jobAbort,
    promise: Promise.resolve({ ok: false, message: '渲染未启动' })
  }

  // 写入「导出中」历史，供导出列表抽屉即时展示
  const exportId = queryExportRecordId(input.sessionId, input.outputPath)
  const exportStartedAt = Date.now()
  const existingHistory = queryLoadExportHistory()
  const existingSameSession = existingHistory.find(
    (item) => item.sessionId === input.sessionId && item.status === 'exporting'
  )
  postUpsertExportRecord({
    id: existingSameSession?.id ?? exportId,
    sessionId: input.sessionId,
    compositionId: input.compositionId,
    outputPath: input.outputPath,
    fileName: basename(input.outputPath),
    status: 'exporting',
    createdAt: existingSameSession?.createdAt ?? exportStartedAt,
    updatedAt: exportStartedAt,
    title: existingSameSession?.title,
    progressPercent: 0
  })
  // 同会话其它入队记录也对齐到真实输出路径
  postSyncSessionExportingRecords(input.sessionId, {
    progressPercent: 0,
    compositionId: input.compositionId,
    outputPath: input.outputPath
  })

  const broadcastProgress = (progress: RemotionRenderProgress): void => {
    job.lastProgress = progress
    postThrottleSyncExportProgress(
      input.sessionId,
      progress,
      input.compositionId,
      input.outputPath
    )
    for (const listener of Array.from(job.progressListeners)) {
      try {
        listener(progress)
      } catch {
        // 单个监听失败不影响渲染
      }
    }
  }

  const report = createRemotionProgressReporter(broadcastProgress)

  job.promise = (async (): Promise<RemotionRenderResult> => {
    // 解析画质参数
    const qualityPreset = input.quality ?? 'standard'
    const preset = QUALITY_PRESETS[qualityPreset]
    const crf = input.crf ?? preset.crf
    const concurrency = input.concurrency ?? preset.concurrency

    /** 将最终结果写回导出历史（成功含文件大小，失败含错误摘要） */
    const postFinalizeExportRecord = (result: RemotionRenderResult): void => {
      const now = Date.now()
      if (result.ok && result.path) {
        let size: number | undefined
        try {
          if (existsSync(result.path)) {
            size = statSync(result.path).size
          }
        } catch {
          // ignore
        }
        // 精确 id + 同会话所有「导出中」一并收口，避免入队记录永久卡在导出中
        postUpsertExportRecord({
          id: existingSameSession?.id ?? exportId,
          sessionId: input.sessionId,
          compositionId: input.compositionId,
          outputPath: result.path,
          fileName: basename(result.path),
          status: 'success',
          createdAt: existingSameSession?.createdAt ?? exportStartedAt,
          updatedAt: now,
          title: existingSameSession?.title,
          progressPercent: 100,
          size
        })
        postSyncSessionExportingRecords(input.sessionId, {
          status: 'success',
          outputPath: result.path,
          progressPercent: 100,
          size,
          compositionId: input.compositionId
        })
        return
      }
      postUpsertExportRecord({
        id: existingSameSession?.id ?? exportId,
        sessionId: input.sessionId,
        compositionId: input.compositionId,
        outputPath: input.outputPath,
        fileName: basename(input.outputPath),
        status: 'failed',
        createdAt: existingSameSession?.createdAt ?? exportStartedAt,
        updatedAt: now,
        title: existingSameSession?.title,
        errorMessage: result.message.slice(0, 400),
        progressPercent: job.lastProgress?.percent
      })
      postSyncSessionExportingRecords(input.sessionId, {
        status: 'failed',
        errorMessage: result.message.slice(0, 400),
        progressPercent: job.lastProgress?.percent,
        compositionId: input.compositionId
      })
    }

    try {
      report({ phase: 'browser', percent: 0, message: '准备浏览器（首次可能下载）…' })
      console.log(`[remotion] 准备浏览器（画质=${qualityPreset}, crf=${crf}）…`)

      const { ensureBrowser } = await import('@remotion/renderer')
      await ensureBrowser({
        logLevel: 'info',
        onBrowserDownload: () => ({
          version: null,
          onProgress: ({ percent }) => {
            if (renderSignal.aborted) {
              throw new Error('渲染已取消')
            }
            const pct = Math.round(percent * 100)
            report({
              phase: 'browser',
              percent: Math.round(pct * 0.1),
              message: `下载浏览器 ${pct}%`
            })
          }
        })
      })

      report({ phase: 'bundle', percent: 10, message: '打包 Composition…' })
      console.log('[remotion] 打包 Composition…')
      const { bundle } = await import('@remotion/bundler')
      const { renderMedia, selectComposition } = await import('@remotion/renderer')

      let bundleLocation: string
      try {
        const sfxWebpackOverride = queryRemotionSfxWebpackOverride(input.projectDir)
        bundleLocation = await bundle({
          entryPoint,
          rootDir: input.projectDir,
          ...(sfxWebpackOverride ? { webpackOverride: sfxWebpackOverride } : {}),
          onProgress: ({ progress }) => {
            if (renderSignal.aborted) {
              throw new Error('渲染已取消')
            }
            const overall = queryBundleOverallPercent(progress)
            report({
              phase: 'bundle',
              percent: overall,
              message: `打包 Composition ${progress}%`
            })
            if (progress % 25 === 0) {
              console.log(`[remotion] 打包进度 ${progress}%`)
            }
          }
        })
      } catch (bundleErr) {
        const msg = bundleErr instanceof Error ? bundleErr.message : String(bundleErr)
        const result: RemotionRenderResult = {
          ok: false,
          errorType: 'bundle',
          message:
            `打包失败（代码语法错误或依赖缺失）：${msg}\n` +
            '请检查：\n' +
            '1. Composition.tsx / Root.tsx 是否有 TypeScript 语法错误\n' +
            '2. import 的文件路径是否正确\n' +
            '3. 是否引用了不存在的依赖包'
        }
        postFinalizeExportRecord(result)
        return result
      }

      report({ phase: 'render', percent: 30, message: '开始渲染视频…' })
      console.log('[remotion] 选择 Composition 并渲染…')

      let composition: Awaited<ReturnType<typeof selectComposition>>
      try {
        composition = await selectComposition({
          serveUrl: bundleLocation,
          id: input.compositionId,
          inputProps: {}
        })
      } catch (compErr) {
        const msg = compErr instanceof Error ? compErr.message : String(compErr)
        const result: RemotionRenderResult = {
          ok: false,
          errorType: 'composition',
          message:
            `找不到 Composition「${input.compositionId}」：${msg}\n` +
            '请确认 Root.tsx 中 <Composition id="..."> 与渲染参数 compositionId 拼写完全一致。'
        }
        postFinalizeExportRecord(result)
        return result
      }

      try {
        await renderMedia({
          composition,
          serveUrl: bundleLocation,
          codec: 'h264',
          crf,
          concurrency,
          outputLocation: input.outputPath,
          onProgress: ({ progress }) => {
            if (renderSignal.aborted) {
              throw new Error('渲染已取消')
            }
            const pct = Math.round(progress * 100)
            const overall = queryRenderOverallPercent(progress)
            report({
              phase: 'render',
              percent: overall,
              message: `渲染视频 ${pct}%`
            })
            if (pct % 10 === 0) {
              console.log(`[remotion] 渲染进度 ${pct}%`)
            }
          }
        })
      } catch (renderErr) {
        const msg = renderErr instanceof Error ? renderErr.message : String(renderErr)
        const result: RemotionRenderResult = {
          ok: false,
          errorType: 'render',
          message:
            `渲染失败：${msg}\n` +
            '常见原因：\n' +
            '1. 组件运行时错误（某帧计算异常）\n' +
            '2. 引用的图片/音频素材不存在\n' +
            '3. public/ 目录中的资源路径错误\n' +
            '建议先用 remotion_studio 预览定位问题帧'
        }
        postFinalizeExportRecord(result)
        return result
      }

      report({ phase: 'render', percent: 100, message: '渲染完成' })

      const success: RemotionRenderResult = {
        ok: true,
        message: `Remotion 渲染成功（${qualityPreset} 画质）：${input.outputPath}`,
        path: input.outputPath
      }
      postFinalizeExportRecord(success)
      return success
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      const result: RemotionRenderResult = {
        ok: false,
        errorType: 'unknown',
        message:
          `Remotion 渲染失败：${msg}。` +
          '请检查 Composition 代码是否有语法错误，compositionId 是否与 Root.tsx 中 id 一致。'
      }
      postFinalizeExportRecord(result)
      return result
    } finally {
      // 仅清理本任务，避免误删后续新启动的同会话任务
      if (renderBySession.get(input.sessionId) === job) {
        renderBySession.delete(input.sessionId)
      }
    }
  })()

  renderBySession.set(input.sessionId, job)
  return job.promise
}
