import { existsSync, readFileSync, statSync } from 'fs'
import { extname, normalize, resolve } from 'path'

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.svg'])
/** 单张预览最大 8MB，避免大图撑爆渲染进程 */
const MAX_BYTES = 8 * 1024 * 1024

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.bmp': 'image/bmp',
  '.svg': 'image/svg+xml'
}

/**
 * 读取本地图片并转为 data URL，供聊天界面预览。
 * 仅允许已存在的图片文件，限制体积。
 */
export function queryLocalImageDataUrl(filePath: string): string | null {
  if (!filePath?.trim()) return null

  const abs = normalize(resolve(filePath.trim()))
  const ext = extname(abs).toLowerCase()
  if (!IMAGE_EXT.has(ext)) return null
  if (!existsSync(abs)) return null

  const size = statSync(abs).size
  if (size > MAX_BYTES) return null

  try {
    const buf = readFileSync(abs)
    const mime = MIME[ext] ?? 'application/octet-stream'
    return `data:${mime};base64,${buf.toString('base64')}`
  } catch {
    return null
  }
}
