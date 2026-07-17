/**
 * 媒体 Provider 可插拔抽象：文生图 / 图生视频 / TTS / 合成。
 * 默认仅内置本地 ffmpeg 合成兜底；t2i/i2v/tts 未配置时返回明确提示。
 */

import { spawn } from 'child_process'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'
import { getVideosDir } from '../store/paths'
import { querySettings } from '../store/settings'
import { queryDashscopeTextToImageProvider } from './dashscope-t2i'
import { queryDashscopeTextToSpeechProvider } from './dashscope-tts'
import { queryDashscopeImageToVideoProvider } from './dashscope-i2v'
import { queryDashscopeTextToVideoProvider } from './dashscope-t2v'
import { postWritePlaceholderImage } from './placeholder-image'

export interface TextToImageRequest {
  prompt: string
  /** 可选输出路径；缺省写入 videos/scenes */
  outputPath?: string
}

export interface ImageToVideoRequest {
  imagePath: string
  prompt?: string
  durationSec?: number
  outputPath?: string
}

export interface TextToVideoRequest {
  prompt: string
  negativePrompt?: string
  aspectRatio?: '9:16' | '16:9' | '1:1' | '4:3' | '3:4'
  durationSec?: number
  outputPath?: string
}

export interface TextToSpeechRequest {
  text: string
  outputPath?: string
}

export interface VideoComposeRequest {
  /** 分镜图片或短视频路径（按顺序） */
  scenePaths: string[]
  /** 可选旁白音频（单段） */
  audioPath?: string
  /** 多镜旁白音频，将先 concat 再贴到成片 */
  audioPaths?: string[]
  /** 每镜时长（秒），缺省 3；仅对静图生效 */
  sceneDurationSec?: number
  outputPath?: string
  title?: string
}

export interface MediaProviderResult {
  ok: boolean
  path?: string
  message: string
}

export interface TextToImageProvider {
  id: string
  generate(req: TextToImageRequest): Promise<MediaProviderResult>
}

export interface ImageToVideoProvider {
  id: string
  generate(req: ImageToVideoRequest): Promise<MediaProviderResult>
}

export interface TextToVideoProvider {
  id: string
  generate(req: TextToVideoRequest): Promise<MediaProviderResult>
}

export interface TextToSpeechProvider {
  id: string
  synthesize(req: TextToSpeechRequest): Promise<MediaProviderResult>
}

export interface VideoComposeProvider {
  id: string
  compose(req: VideoComposeRequest): Promise<MediaProviderResult>
}

const t2iProviders = new Map<string, TextToImageProvider>()
const i2vProviders = new Map<string, ImageToVideoProvider>()
const t2vProviders = new Map<string, TextToVideoProvider>()
const ttsProviders = new Map<string, TextToSpeechProvider>()
const composeProviders = new Map<string, VideoComposeProvider>()

let activeT2i = 'placeholder'
let activeI2v = 'placeholder'
let activeT2v = 'placeholder'
let activeTts = 'placeholder'
let activeCompose = 'ffmpeg-local'

export function postRegisterTextToImageProvider(provider: TextToImageProvider): void {
  t2iProviders.set(provider.id, provider)
}

export function postRegisterImageToVideoProvider(provider: ImageToVideoProvider): void {
  i2vProviders.set(provider.id, provider)
}

export function postRegisterTextToVideoProvider(provider: TextToVideoProvider): void {
  t2vProviders.set(provider.id, provider)
}

export function postRegisterTextToSpeechProvider(provider: TextToSpeechProvider): void {
  ttsProviders.set(provider.id, provider)
}

export function postRegisterVideoComposeProvider(provider: VideoComposeProvider): void {
  composeProviders.set(provider.id, provider)
}

function queryPlaceholderT2i(): TextToImageProvider {
  return {
    id: 'placeholder',
    async generate(req) {
      return {
        ok: false,
        message:
          `文生图 Provider 未配置，无法根据「${req.prompt.slice(0, 40)}」生成画面。` +
          '请在设置中接入可插拔图像 Provider 后重试。'
      }
    }
  }
}

function queryPlaceholderI2v(): ImageToVideoProvider {
  return {
    id: 'placeholder',
    async generate() {
      return {
        ok: false,
        message: '图生视频 Provider 未配置。请在设置中接入可插拔视频 Provider 后重试。'
      }
    }
  }
}

function queryPlaceholderT2v(): TextToVideoProvider {
  return {
    id: 'placeholder',
    async generate() {
      return {
        ok: false,
        message: '文生视频 Provider 未配置。请在设置中接入可插拔视频 Provider 后重试。'
      }
    }
  }
}

function queryPlaceholderTts(): TextToSpeechProvider {
  return {
    id: 'placeholder',
    async synthesize() {
      return {
        ok: false,
        message: 'TTS Provider 未配置。请在设置中接入语音合成 Provider 后重试。'
      }
    }
  }
}

/** 检测本机是否有 ffmpeg */
function queryFfmpegBin(): string | null {
  const candidates = ['ffmpeg', '/usr/local/bin/ffmpeg', '/opt/homebrew/bin/ffmpeg']
  for (const bin of candidates) {
    try {
      if (bin === 'ffmpeg') return 'ffmpeg'
      if (existsSync(bin)) return bin
    } catch {
      // ignore
    }
  }
  return 'ffmpeg'
}

function postRunFfmpeg(args: string[]): Promise<{ ok: boolean; message: string }> {
  const bin = queryFfmpegBin()
  if (!bin) {
    return Promise.resolve({ ok: false, message: '未找到 ffmpeg，请先安装后再合成视频' })
  }
  return new Promise((resolve) => {
    const child = spawn(bin, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let stderr = ''
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })
    child.on('error', (err) => {
      resolve({
        ok: false,
        message: `ffmpeg 启动失败：${err.message}。请确认已安装 ffmpeg 并在 PATH 中。`
      })
    })
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ ok: true, message: 'ffmpeg 合成成功' })
      } else {
        resolve({
          ok: false,
          message: `ffmpeg 退出码 ${code}：${stderr.slice(-500) || '未知错误'}`
        })
      }
    })
  })
}

function queryIsVideoPath(filePath: string): boolean {
  return /\.(mp4|mov|webm|mkv)$/i.test(filePath)
}

function queryEscapeConcatPath(filePath: string): string {
  return filePath.replace(/'/g, "'\\''")
}

/**
 * 本地 ffmpeg 合成：静图按时长循环、视频片段直接 concat，可选多段旁白合并。
 */
function queryLocalFfmpegCompose(): VideoComposeProvider {
  return {
    id: 'ffmpeg-local',
    async compose(req) {
      const outDir = join(getVideosDir(), 'outputs')
      mkdirSync(outDir, { recursive: true })
      const outputPath =
        req.outputPath?.trim() ||
        join(outDir, `compose-${Date.now()}.mp4`)

      if (!req.scenePaths.length) {
        return { ok: false, message: 'compose 需要至少一张分镜素材路径' }
      }

      const duration = Math.max(1, req.sceneDurationSec ?? 3)
      const ts = Date.now()

      // 多段旁白先 concat 为临时 wav
      let mergedAudio = req.audioPath
      const audioList = (req.audioPaths ?? []).filter((p) => existsSync(p))
      if (!mergedAudio && audioList.length === 1) {
        mergedAudio = audioList[0]
      } else if (!mergedAudio && audioList.length > 1) {
        const audioListPath = join(outDir, `audio-concat-${ts}.txt`)
        const audioLines = audioList.map((p) => `file '${queryEscapeConcatPath(p)}'`)
        writeFileSync(audioListPath, audioLines.join('\n'), 'utf-8')
        mergedAudio = join(outDir, `merged-audio-${ts}.wav`)
        const audioRun = await postRunFfmpeg([
          '-y',
          '-f',
          'concat',
          '-safe',
          '0',
          '-i',
          audioListPath,
          '-c',
          'copy',
          mergedAudio
        ])
        if (!audioRun.ok) {
          mergedAudio = audioList[0]
        }
      }

      const listPath = join(outDir, `concat-${ts}.txt`)
      const lines: string[] = []
      for (const p of req.scenePaths) {
        const escaped = queryEscapeConcatPath(p)
        lines.push(`file '${escaped}'`)
        if (!queryIsVideoPath(p)) {
          lines.push(`duration ${duration}`)
        }
      }
      const last = req.scenePaths[req.scenePaths.length - 1]
      lines.push(`file '${queryEscapeConcatPath(last)}'`)

      writeFileSync(listPath, lines.join('\n'), 'utf-8')

      const args = [
        '-y',
        '-f',
        'concat',
        '-safe',
        '0',
        '-i',
        listPath,
        '-vf',
        'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2',
        '-pix_fmt',
        'yuv420p',
        outputPath
      ]
      if (mergedAudio && existsSync(mergedAudio)) {
        args.splice(args.length - 1, 0, '-i', mergedAudio, '-shortest')
      }

      const run = await postRunFfmpeg(args)
      if (!run.ok) {
        const manifestPath = outputPath.replace(/\.mp4$/i, '.manifest.json')
        writeFileSync(
          manifestPath,
          JSON.stringify(
            {
              title: req.title,
              scenePaths: req.scenePaths,
              audioPath: mergedAudio,
              audioPaths: req.audioPaths,
              sceneDurationSec: duration,
              error: run.message
            },
            null,
            2
          ),
          'utf-8'
        )
        return {
          ok: false,
          path: manifestPath,
          message: `${run.message}；已写入分镜清单：${manifestPath}`
        }
      }
      return { ok: true, path: outputPath, message: `成片已生成：${outputPath}` }
    }
  }
}

function queryLocalPlaceholderT2i(): TextToImageProvider {
  return {
    id: 'local-placeholder',
    async generate(req) {
      const outputPath =
        req.outputPath?.trim() ||
        join(getVideosDir(), 'scenes', `placeholder-${Date.now()}.png`)
      return postWritePlaceholderImage({
        outputPath,
        label: req.prompt.slice(0, 40)
      })
    }
  }
}

function queryHasDashscopeKey(): boolean {
  try {
    const settings = querySettings()
    return Boolean(
      settings.connections?.some((c) => c.provider === 'dashscope' && c.apiKey.trim()) ||
        (settings.provider === 'dashscope' && settings.apiKey.trim())
    )
  } catch {
    return false
  }
}

let mediaInited = false

/**
 * 注册内置 Provider（幂等）。
 * 有百炼 Key 时优先万相文生图 + 图生/文生视频 + Qwen-TTS；否则文生图用本地占位。
 */
export function initMediaProviders(): void {
  if (mediaInited) return
  mediaInited = true

  postRegisterTextToImageProvider(queryPlaceholderT2i())
  postRegisterTextToImageProvider(queryLocalPlaceholderT2i())
  postRegisterTextToImageProvider(queryDashscopeTextToImageProvider())
  postRegisterImageToVideoProvider(queryPlaceholderI2v())
  postRegisterImageToVideoProvider(queryDashscopeImageToVideoProvider())
  postRegisterTextToVideoProvider(queryPlaceholderT2v())
  postRegisterTextToVideoProvider(queryDashscopeTextToVideoProvider())
  postRegisterTextToSpeechProvider(queryPlaceholderTts())
  postRegisterTextToSpeechProvider(queryDashscopeTextToSpeechProvider())
  postRegisterVideoComposeProvider(queryLocalFfmpegCompose())

  refreshActiveVideoProviders()
}

/** 按当前设置刷新文生图活跃 Provider（用户补 Key 后无需重启） */
export function refreshActiveTextToImageProvider(): void {
  initMediaProviders()
  if (queryHasDashscopeKey()) {
    activeT2i = 'dashscope-wanx'
  } else if (activeT2i === 'dashscope-wanx' || activeT2i === 'placeholder') {
    activeT2i = 'local-placeholder'
  }
}

/** 按当前设置刷新 TTS 活跃 Provider（与文生图共用百炼 Key 判定） */
export function refreshActiveTextToSpeechProvider(): void {
  initMediaProviders()
  activeTts = queryHasDashscopeKey() ? 'dashscope-qwen-tts' : 'placeholder'
}

/** 按当前设置刷新图生/文生视频 Provider */
export function refreshActiveVideoProviders(): void {
  initMediaProviders()
  const hasDash = queryHasDashscopeKey()
  activeT2i = hasDash ? 'dashscope-wanx' : 'local-placeholder'
  activeI2v = hasDash ? 'dashscope-wan-i2v' : 'placeholder'
  activeT2v = hasDash ? 'dashscope-wan-t2v' : 'placeholder'
  activeTts = hasDash ? 'dashscope-qwen-tts' : 'placeholder'
  activeCompose = 'ffmpeg-local'
}

export function queryActiveMediaProviderIds(): {
  t2i: string
  i2v: string
  t2v: string
  tts: string
  compose: string
} {
  return {
    t2i: activeT2i,
    i2v: activeI2v,
    t2v: activeT2v,
    tts: activeTts,
    compose: activeCompose
  }
}

export function queryTextToImageProvider(): TextToImageProvider {
  return t2iProviders.get(activeT2i) ?? queryPlaceholderT2i()
}

export function queryImageToVideoProvider(): ImageToVideoProvider {
  return i2vProviders.get(activeI2v) ?? queryPlaceholderI2v()
}

export function queryTextToVideoProvider(): TextToVideoProvider {
  return t2vProviders.get(activeT2v) ?? queryPlaceholderT2v()
}

export function queryTextToSpeechProvider(): TextToSpeechProvider {
  return ttsProviders.get(activeTts) ?? queryPlaceholderTts()
}

export function queryVideoComposeProvider(): VideoComposeProvider {
  return composeProviders.get(activeCompose) ?? queryLocalFfmpegCompose()
}

/** 分镜素材目录 */
export function querySceneAssetsDir(sessionId?: string): string {
  const dir = join(getVideosDir(), 'scenes', sessionId ?? 'default')
  mkdirSync(dir, { recursive: true })
  return dir
}
