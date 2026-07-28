/**
 * 根据本地路径扩展名推断聊天附件类型。
 * 无已知媒体后缀时视为文件夹（或其它路径），由选择入口保证语义。
 */

export type ChatAttachmentKind = 'image' | 'video' | 'audio' | 'folder'

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.svg'])
const VIDEO_EXT = new Set(['.mp4', '.mov', '.webm', '.mkv'])
const AUDIO_EXT = new Set(['.wav', '.mp3', '.m4a', '.aac', '.ogg'])

/** 取路径 basename（兼容 Windows 反斜杠） */
export function queryAttachmentBasename(filePath: string): string {
  const parts = filePath.replace(/\\/g, '/').split('/').filter(Boolean)
  return parts[parts.length - 1] || filePath
}

/** 取扩展名（含点，小写） */
export function queryAttachmentExt(filePath: string): string {
  const name = queryAttachmentBasename(filePath)
  const dot = name.lastIndexOf('.')
  if (dot <= 0) return ''
  return name.slice(dot).toLowerCase()
}

/**
 * 推断附件类型。
 * @param hint 选择文件夹对话框返回时应传入 `'folder'`，避免无后缀目录被误判
 */
export function queryAttachmentKind(
  filePath: string,
  hint?: ChatAttachmentKind
): ChatAttachmentKind {
  if (hint === 'folder') return 'folder'
  const ext = queryAttachmentExt(filePath)
  if (IMAGE_EXT.has(ext)) return 'image'
  if (VIDEO_EXT.has(ext)) return 'video'
  if (AUDIO_EXT.has(ext)) return 'audio'
  return 'folder'
}
