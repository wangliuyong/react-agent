import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join, extname, basename } from 'path'
import { nativeImage } from 'electron'
import { rand } from './human-behavior'

export interface VaryXhsImagesOptions {
  /** 输出子目录，默认 xhs-varied */
  subdir?: string
}

/**
 * 对配图做轻量「原创化」处理，降低批量同质化识别：
 * 随机微裁剪、缩放、JPEG 质量波动。
 * 使用 Electron nativeImage，无需额外图像依赖。
 */
export function postVaryXhsPublishImages(
  imagePaths: string[],
  outDir: string
): string[] {
  if (!imagePaths.length) return []

  mkdirSync(outDir, { recursive: true })
  const results: string[] = []

  for (let i = 0; i < imagePaths.length; i++) {
    const src = imagePaths[i]
    if (!existsSync(src)) continue

    const ext = extname(src).toLowerCase()
    const base = basename(src, ext)
    const outPath = join(outDir, `${base}-varied-${i + 1}.jpg`)

    try {
      const varied = varySingleImage(src)
      if (varied) {
        writeFileSync(outPath, varied)
        results.push(outPath)
      } else {
        results.push(src)
      }
    } catch (err) {
      console.warn('[xhs-image-variation] skip:', src, err)
      results.push(src)
    }
  }

  return results.length ? results : [...imagePaths]
}

/** 单张图片：裁剪 + 缩放 + 质量抖动 */
function varySingleImage(inputPath: string): Buffer | null {
  const img = nativeImage.createFromPath(inputPath)
  if (img.isEmpty()) return null

  const size = img.getSize()
  if (size.width < 80 || size.height < 80) return null

  // 随机裁掉 2%～5% 边缘
  const cropRatio = rand(0.02, 0.05)
  const cropX = Math.floor(size.width * cropRatio * rand(0.3, 1))
  const cropY = Math.floor(size.height * cropRatio * rand(0.3, 1))
  const cropW = size.width - cropX - Math.floor(size.width * cropRatio * rand(0.3, 1))
  const cropH = size.height - cropY - Math.floor(size.height * cropRatio * rand(0.3, 1))

  let processed = img.crop({
    x: Math.max(0, cropX),
    y: Math.max(0, cropY),
    width: Math.max(64, cropW),
    height: Math.max(64, cropH)
  })

  // 轻微缩放（95%～103%），改变像素指纹
  const scale = rand(0.95, 1.03)
  const newW = Math.max(64, Math.floor(processed.getSize().width * scale))
  processed = processed.resize({ width: newW })

  const quality = Math.floor(rand(82, 93))
  return processed.toJPEG(quality)
}
