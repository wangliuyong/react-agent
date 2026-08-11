import { writeFileSync } from 'fs'
import { extname, join } from 'path'
import { getChatUploadsDir } from './paths'

/** 与对话框选媒体过滤器、附件 kind 推断对齐 */
const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp'])
const VIDEO_EXT = new Set(['.mp4', '.mov', '.webm', '.mkv'])
const AUDIO_EXT = new Set(['.wav', '.mp3', '.m4a', '.aac', '.ogg'])
const ALLOWED_EXT = new Set<string>([
  ...Array.from(IMAGE_EXT),
  ...Array.from(VIDEO_EXT),
  ...Array.from(AUDIO_EXT)
])

const MIME_TO_EXT: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/bmp': '.bmp',
  'video/mp4': '.mp4',
  'video/quicktime': '.mov',
  'video/webm': '.webm',
  'video/x-matroska': '.mkv',
  'audio/wav': '.wav',
  'audio/x-wav': '.wav',
  'audio/mpeg': '.mp3',
  'audio/mp3': '.mp3',
  'audio/mp4': '.m4a',
  'audio/aac': '.aac',
  'audio/ogg': '.ogg'
}

/** 图片与预览上限一致；音视频略宽，避免短视频粘贴失败 */
const MAX_IMAGE_BYTES = 8 * 1024 * 1024
const MAX_MEDIA_BYTES = 64 * 1024 * 1024

export interface PostSaveChatUploadInput {
  /** 原始文件名（可无扩展名，如截图） */
  name?: string
  mimeType?: string
  /** 纯 base64，不含 data: 前缀 */
  base64: string
}

export type PostSaveChatUploadResult =
  | { ok: true; path: string }
  | { ok: false; error: string }

function querySanitizeBasename(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, '_').trim() || 'paste'
}

/**
 * 根据 mime / 文件名推断扩展名；无法识别则返回空串。
 */
export function queryChatUploadExt(name?: string, mimeType?: string): string {
  const mime = (mimeType ?? '').trim().toLowerCase()
  if (mime && MIME_TO_EXT[mime]) return MIME_TO_EXT[mime]

  const rawName = (name ?? '').trim()
  const ext = extname(rawName).toLowerCase()
  if (ALLOWED_EXT.has(ext)) return ext

  // 无扩展名但 mime 为 image/* 时兜底 png（系统截图常见）
  if (mime.startsWith('image/')) return '.png'
  return ''
}

function queryMaxBytes(ext: string): number {
  return IMAGE_EXT.has(ext) ? MAX_IMAGE_BYTES : MAX_MEDIA_BYTES
}

/**
 * 将渲染进程粘贴/拖入的二进制落盘到 chat-uploads，返回绝对路径。
 * 为什么走主进程：渲染进程无法稳定写 userData，且需统一校验类型与体积。
 */
export function postSaveChatUpload(input: PostSaveChatUploadInput): PostSaveChatUploadResult {
  const base64 = typeof input?.base64 === 'string' ? input.base64.trim() : ''
  if (!base64) {
    return { ok: false, error: '附件内容为空' }
  }

  const ext = queryChatUploadExt(input.name, input.mimeType)
  if (!ext || !ALLOWED_EXT.has(ext)) {
    return { ok: false, error: '不支持的附件类型（仅图片 / 视频 / 音频）' }
  }

  let buf: Buffer
  try {
    buf = Buffer.from(base64, 'base64')
  } catch {
    return { ok: false, error: '附件解码失败' }
  }
  if (!buf.length) {
    return { ok: false, error: '附件内容为空' }
  }

  const maxBytes = queryMaxBytes(ext)
  if (buf.length > maxBytes) {
    const maxMb = Math.round(maxBytes / (1024 * 1024))
    return { ok: false, error: `附件过大（上限 ${maxMb}MB）` }
  }

  const stem = querySanitizeBasename(
    (input.name ?? 'paste').replace(/\.[^.]+$/, '') || 'paste'
  )
  const fileName = `${stem}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
  const abs = join(getChatUploadsDir(), fileName)

  try {
    writeFileSync(abs, buf)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: `写入失败：${msg}` }
  }

  return { ok: true, path: abs }
}
