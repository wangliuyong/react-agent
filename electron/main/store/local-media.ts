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
 * 将本地媒体路径转为 media://local/?path=... URL。
 * 为什么用 query 而不是 path 段：Electron standard scheme 会把 %2F 解成路径，
 * 导致 `/Users/...` 丢失前导斜杠，音视频无法加载。
 */
export function queryLocalMediaUrl(filePath: string): string | null {
  const resolved = queryResolveLocalMediaPath(filePath)
  if (!resolved) return null
  return `media://local/?path=${encodeURIComponent(resolved.abs)}`
}

/**
 * 从 media:// URL 反解本地绝对路径（主进程 protocol handler 使用）。
 * 兼容：?path= 新格式、旧版 path 段编码、Chromium 规范化后的 pathname。
 */
export function queryPathFromMediaUrl(url: string): string | null {
  if (!url?.trim()) return null

  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'media:') return null

    const fromQuery = parsed.searchParams.get('path')
    if (fromQuery?.trim()) {
      return queryResolveLocalMediaPath(fromQuery)?.abs ?? null
    }

    // 旧格式：media://local/<encodeURIComponent(abs)>
    // Chromium 可能变成 media://local/Users/...（%2F 被解开）
    let raw = decodeURIComponent(parsed.pathname || '')
    if (raw.startsWith('/')) raw = raw.slice(1)
    if (!raw) return null

    // pathname 去掉首 / 后可能是 "%2FUsers%2F..." 或 "Users/..."
    let candidate = decodeURIComponent(raw)
    if (!candidate.startsWith('/') && !/^[A-Za-z]:[\\/]/.test(candidate)) {
      candidate = `/${candidate}`
    }
    return queryResolveLocalMediaPath(candidate)?.abs ?? null
  } catch {
    // 非标准 URL 时兜底字符串解析
    const prefix = 'media://local/'
    if (!url.startsWith(prefix)) return null
    try {
      const rest = url.slice(prefix.length)
      const qIndex = rest.indexOf('?')
      if (qIndex >= 0) {
        const params = new URLSearchParams(rest.slice(qIndex + 1))
        const p = params.get('path')
        if (p) return queryResolveLocalMediaPath(p)?.abs ?? null
      }
      const decoded = decodeURIComponent(qIndex >= 0 ? rest.slice(0, qIndex) : rest)
      const candidate = decoded.startsWith('/') ? decoded : `/${decoded}`
      return queryResolveLocalMediaPath(candidate)?.abs ?? null
    } catch {
      return null
    }
  }
}
