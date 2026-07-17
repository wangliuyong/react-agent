/**
 * 本地音视频文件 → media:// 协议 URL，供聊天内联播放。
 * 为什么：视频/音频体积大，不适合走 base64 data URL（图片 ≤8MB 仍用 queryLocalImageDataUrl）。
 */

import { existsSync } from 'fs'
import { extname, normalize, resolve } from 'path'

/** 允许在聊天内预览的音频扩展名 */
const AUDIO_EXT = new Set(['.wav', '.mp3', '.m4a', '.aac', '.ogg'])
/** 允许在聊天内预览的视频扩展名 */
const VIDEO_EXT = new Set(['.mp4', '.mov', '.webm', '.mkv'])

const MIME: Record<string, string> = {
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.ogg': 'audio/ogg',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
  '.mkv': 'video/x-matroska'
}

export type LocalMediaKind = 'audio' | 'video'

/** 校验并解析本地媒体绝对路径 */
export function queryResolveLocalMediaPath(filePath: string): {
  abs: string
  kind: LocalMediaKind
  mime: string
} | null {
  if (!filePath?.trim()) return null

  const abs = normalize(resolve(filePath.trim()))
  const ext = extname(abs).toLowerCase()
  const mime = MIME[ext]
  if (!mime) return null
  if (!existsSync(abs)) return null
  if (!AUDIO_EXT.has(ext) && !VIDEO_EXT.has(ext)) return null

  const kind: LocalMediaKind = AUDIO_EXT.has(ext) ? 'audio' : 'video'

  return { abs, kind, mime }
}

/**
 * 将本地媒体路径转为 media://local/... URL。
 * 渲染进程 <audio>/<video> 可直接 src 加载。
 */
export function queryLocalMediaUrl(filePath: string): string | null {
  const resolved = queryResolveLocalMediaPath(filePath)
  if (!resolved) return null
  return `media://local/${encodeURIComponent(resolved.abs)}`
}

/** 从 media:// URL 反解本地绝对路径（主进程 protocol handler 使用） */
export function queryPathFromMediaUrl(url: string): string | null {
  const prefix = 'media://local/'
  if (!url.startsWith(prefix)) return null
  try {
    const decoded = decodeURIComponent(url.slice(prefix.length))
    const resolved = queryResolveLocalMediaPath(decoded)
    return resolved?.abs ?? null
  } catch {
    return null
  }
}
