import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { basename, extname, join } from 'path'
import { nativeImage } from 'electron'

/**
 * 抖音创作者中心图文「直传」仅认 JPEG。
 * 页面文案虽写支持 png/webp，实际上传常对 webp（及部分 png）报「不支持的文件格式」；
 * 抓取落盘的 CDN 图多为 .webp，必须在上传前转成 .jpg。
 */
export const DOUYIN_SAFE_IMAGE_EXTS = new Set(['.jpg', '.jpeg'])

/** 明确需要转成 JPEG 的常见格式（含页面声称支持、实则易拒的 png/webp） */
export const DOUYIN_CONVERT_IMAGE_EXTS = new Set([
  '.png',
  '.webp',
  '.gif',
  '.bmp',
  '.avif',
  '.tif',
  '.tiff',
  '.svg',
  '.heic',
  '.heif'
])

/**
 * 判断本地路径是否可直接上传抖音图文（不触发「不支持的文件格式」）。
 */
export function queryIsDouyinSafeImagePath(filePath: string): boolean {
  const ext = extname(filePath).toLowerCase()
  return DOUYIN_SAFE_IMAGE_EXTS.has(ext)
}

/**
 * 判断是否需要转成 JPEG（png/webp/gif 等，或未知扩展名）。
 */
export function queryNeedsDouyinImageConvert(filePath: string): boolean {
  const ext = extname(filePath).toLowerCase()
  return DOUYIN_CONVERT_IMAGE_EXTS.has(ext) || !queryIsDouyinSafeImagePath(filePath)
}

/**
 * 上传前兜底规范化：仅 jpg/jpeg 原样保留；其余一律转为 JPEG。
 * 覆盖 fetch_web_images 落盘的 webp，以及本地附件 / web-media 中的 gif 等。
 */
export function postPrepareDouyinPublishImages(
  imagePaths: string[],
  outDir: string
): string[] {
  if (!imagePaths.length) return []

  mkdirSync(outDir, { recursive: true })
  const results: string[] = []

  for (let i = 0; i < imagePaths.length; i++) {
    const src = imagePaths[i]
    if (!src || !existsSync(src)) continue

    if (queryIsDouyinSafeImagePath(src)) {
      results.push(src)
      continue
    }

    const ext = extname(src).toLowerCase()
    const base = basename(src, ext) || `image-${i + 1}`
    const outPath = join(outDir, `${base}-douyin-${i + 1}.jpg`)

    try {
      const img = nativeImage.createFromPath(src)
      if (img.isEmpty()) {
        console.warn('[douyin-image-prepare] 无法解码，跳过:', src)
        continue
      }
      // 创作者中心对 JPEG 兼容最好；质量 90 兼顾体积与清晰度
      writeFileSync(outPath, img.toJPEG(90))
      results.push(outPath)
      console.info('[douyin-image-prepare] converted', src, '→', outPath)
    } catch (err) {
      console.warn('[douyin-image-prepare] convert failed:', src, err)
    }
  }

  return results
}
