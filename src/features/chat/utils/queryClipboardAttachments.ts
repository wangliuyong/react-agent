/**
 * 从 DataTransfer（粘贴 / 拖拽）解析聊天附件候选。
 * 纯函数便于单测；真正落盘由 hook + IPC 完成。
 */

/** 与选文件对话框、queryAttachmentKind 对齐的媒体后缀 */
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

/** Electron File 可能带本地 path；浏览器 File 无此字段 */
export type ClipboardFileLike = File & { path?: string }

/** 已有本地绝对路径，可直接加入附件列表 */
export interface ClipboardLocalPathItem {
  kind: 'localPath'
  path: string
}

/** 剪贴板截图等无 path 的 blob，需 postSaveChatUpload */
export interface ClipboardBlobItem {
  kind: 'blob'
  name: string
  mimeType: string
  file: ClipboardFileLike
}

export type ClipboardAttachmentItem = ClipboardLocalPathItem | ClipboardBlobItem

export interface QueryClipboardAttachmentsResult {
  items: ClipboardAttachmentItem[]
  /** 被过滤的条目数（类型不支持等） */
  skipped: number
}

function queryExtFromName(name: string): string {
  const base = name.replace(/\\/g, '/').split('/').pop() || name
  const dot = base.lastIndexOf('.')
  if (dot <= 0) return ''
  return base.slice(dot).toLowerCase()
}

/**
 * 判断文件名或 mime 是否为允许的聊天媒体。
 */
export function queryIsAllowedChatMedia(name: string, mimeType = ''): boolean {
  const ext = queryExtFromName(name)
  if (ALLOWED_EXT.has(ext)) return true
  const mime = mimeType.trim().toLowerCase()
  if (mime && MIME_TO_EXT[mime]) return true
  // 系统截图常无文件名扩展名，仅有 image/*
  if (mime.startsWith('image/')) return true
  return false
}

function queryGuessName(file: ClipboardFileLike, index: number): string {
  const raw = (file.name || '').trim()
  if (raw && raw !== 'image.png') return raw
  const mime = (file.type || '').toLowerCase()
  const ext = MIME_TO_EXT[mime] || (mime.startsWith('image/') ? '.png' : '')
  if (raw && ext && !queryExtFromName(raw)) return `${raw}${ext}`
  if (raw) return raw
  return `paste-${index + 1}${ext || '.bin'}`
}

/**
 * 从 DataTransfer 解析可挂载的聊天附件。
 * - 有 Electron `File.path` → localPath
 * - 否则保留 blob 供落盘
 */
export function queryClipboardAttachments(
  data: DataTransfer | null | undefined
): QueryClipboardAttachmentsResult {
  if (!data) return { items: [], skipped: 0 }

  const seen = new Set<string>()
  const items: ClipboardAttachmentItem[] = []
  let skipped = 0

  const pushLocal = (path: string): void => {
    const trimmed = path.trim()
    if (!trimmed || seen.has(`p:${trimmed}`)) return
    if (!queryIsAllowedChatMedia(trimmed)) {
      skipped += 1
      return
    }
    seen.add(`p:${trimmed}`)
    items.push({ kind: 'localPath', path: trimmed })
  }

  const pushBlob = (file: ClipboardFileLike, index: number): void => {
    const name = queryGuessName(file, index)
    const mimeType = (file.type || '').trim()
    if (!queryIsAllowedChatMedia(name, mimeType)) {
      skipped += 1
      return
    }
    const key = `b:${name}:${file.size}:${mimeType}`
    if (seen.has(key)) return
    seen.add(key)
    items.push({ kind: 'blob', name, mimeType, file })
  }

  // 优先 files 列表（拖拽与多数粘贴都有）；再扫 items 兜底截图
  const files = Array.from(data.files ?? []) as ClipboardFileLike[]
  if (files.length) {
    files.forEach((file, index) => {
      const localPath = typeof file.path === 'string' ? file.path.trim() : ''
      if (localPath) {
        pushLocal(localPath)
        return
      }
      pushBlob(file, index)
    })
    return { items, skipped }
  }

  const itemList = data.items
  if (itemList?.length) {
    for (let i = 0; i < itemList.length; i += 1) {
      const entry = itemList[i]
      if (!entry || entry.kind !== 'file') continue
      const file = entry.getAsFile() as ClipboardFileLike | null
      if (!file) continue
      const localPath = typeof file.path === 'string' ? file.path.trim() : ''
      if (localPath) {
        pushLocal(localPath)
      } else {
        pushBlob(file, i)
      }
    }
  }

  return { items, skipped }
}
