/**
 * Remotion 项目初始化、Studio 预览与程序化渲染服务。
 * 使用 @remotion/bundler + @remotion/renderer，避免在 Electron 主进程依赖外部 npx。
 */

import { type ChildProcess, spawn } from 'child_process'
import { app, shell } from 'electron'
import { createRequire } from 'module'
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { queryBundledResourcesRoot } from '../store/resources'
import { getVideosDir } from '../store/paths'

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

/** 更新 Root.tsx 中默认 Composition 的元数据 */
function postPatchRootComposition(
  projectDir: string,
  config: Required<Pick<RemotionInitConfig, 'compositionId' | 'width' | 'height' | 'fps' | 'durationInFrames'>>
): void {
  const rootPath = join(projectDir, 'src', 'Root.tsx')
  if (!existsSync(rootPath)) return

  let rootSource = readFileSync(rootPath, 'utf-8')
  rootSource = rootSource
    .replace(/id="[^"]*"/, `id="${config.compositionId}"`)
    .replace(/durationInFrames=\{?\d+\}?/, `durationInFrames={${config.durationInFrames}}`)
    .replace(/fps=\{?\d+\}?/, `fps={${config.fps}}`)
    .replace(/width=\{?\d+\}?/, `width={${config.width}}`)
    .replace(/height=\{?\d+\}?/, `height={${config.height}}`)

  writeFileSync(rootPath, rootSource, 'utf-8')
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

  const broadcastProgress = (progress: RemotionRenderProgress): void => {
    job.lastProgress = progress
    for (const listener of job.progressListeners) {
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
        bundleLocation = await bundle({
          entryPoint,
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
        return {
          ok: false,
          errorType: 'bundle',
          message:
            `打包失败（代码语法错误或依赖缺失）：${msg}\n` +
            '请检查：\n' +
            '1. Composition.tsx / Root.tsx 是否有 TypeScript 语法错误\n' +
            '2. import 的文件路径是否正确\n' +
            '3. 是否引用了不存在的依赖包'
        }
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
        return {
          ok: false,
          errorType: 'composition',
          message:
            `找不到 Composition「${input.compositionId}」：${msg}\n` +
            '请确认 Root.tsx 中 <Composition id="..."> 与渲染参数 compositionId 拼写完全一致。'
        }
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
        return {
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
      }

      report({ phase: 'render', percent: 100, message: '渲染完成' })

      return {
        ok: true,
        message: `Remotion 渲染成功（${qualityPreset} 画质）：${input.outputPath}`,
        path: input.outputPath
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return {
        ok: false,
        errorType: 'unknown',
        message:
          `Remotion 渲染失败：${msg}。` +
          '请检查 Composition 代码是否有语法错误，compositionId 是否与 Root.tsx 中 id 一致。'
      }
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
