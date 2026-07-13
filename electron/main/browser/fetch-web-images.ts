import { createWriteStream, existsSync, mkdirSync } from 'fs'
import { join, extname } from 'path'
import { pipeline } from 'stream/promises'
import { Readable } from 'stream'
import { getArtifactsDir } from '../store/paths'
import { getBrowserService } from './service'

export interface FetchWebImagesOptions {
  /** 内容来源页：打开后从页面提取大图 */
  pageUrl?: string
  /** 直接图片 URL 列表 */
  imageUrls?: string[]
  /** 最多保存几张，默认 3 */
  maxCount?: number
  /** 子目录名，默认 xhs-images */
  subdir?: string
  signal?: AbortSignal
}

export interface FetchWebImagesResult {
  paths: string[]
  sources: string[]
  message: string
}

/**
 * 从网页或直链下载配图到 artifacts，供各渠道发布使用。
 * 用户本地上传变为可选；优先走网页来源。
 */
export async function fetchWebImages(opts: FetchWebImagesOptions): Promise<FetchWebImagesResult> {
  const maxCount = Math.min(Math.max(opts.maxCount ?? 3, 1), 9)
  const subdir = opts.subdir ?? 'xhs-images'
  const outDir = join(getArtifactsDir(), subdir, String(Date.now()))
  mkdirSync(outDir, { recursive: true })

  const candidates: string[] = []

  if (opts.imageUrls?.length) {
    for (const u of opts.imageUrls) {
      if (u && /^https?:\/\//i.test(u)) candidates.push(u)
    }
  }

  if (opts.pageUrl) {
    if (opts.signal?.aborted) throw new Error('用户已中止')
    const fromPage = await extractImageUrlsFromPage(opts.pageUrl, maxCount * 3)
    for (const u of fromPage) {
      if (!candidates.includes(u)) candidates.push(u)
    }
  }

  if (!candidates.length) {
    return {
      paths: [],
      sources: [],
      message:
        '未找到可用图片。请提供 pageUrl（内容来源页）或 imageUrls（图片直链）；也可让用户可选地上传本地图片。'
    }
  }

  const paths: string[] = []
  const sources: string[] = []
  let index = 0

  for (const url of candidates) {
    if (paths.length >= maxCount) break
    if (opts.signal?.aborted) throw new Error('用户已中止')
    try {
      const saved = await downloadImageToFile(url, outDir, index)
      if (saved) {
        paths.push(saved)
        sources.push(url)
        index += 1
      }
    } catch (err) {
      console.warn('[fetchWebImages] download failed:', url, err)
    }
  }

  if (!paths.length) {
    return {
      paths: [],
      sources: [],
      message: `候选 ${candidates.length} 张均下载失败。可换来源页，或让用户可选上传本地图。`
    }
  }

  return {
    paths,
    sources,
    message: `已从网页保存 ${paths.length} 张配图到本地：\n${paths.map((p, i) => `${i + 1}. ${p}\n   ← ${sources[i]}`).join('\n')}`
  }
}

/** 打开来源页，提取面积较大的图片 URL（过滤图标/头像） */
async function extractImageUrlsFromPage(pageUrl: string, limit: number): Promise<string[]> {
  const browser = getBrowserService()
  await browser.ensureStarted()
  await browser.navigate(pageUrl)
  const page = browser.getPage()
  if (!page) return []

  await page.waitForTimeout(1800)

  const urls = await page.evaluate((max) => {
    const abs = (src: string): string => {
      try {
        return new URL(src, location.href).href
      } catch {
        return ''
      }
    }

    type Cand = { url: string; score: number }
    const list: Cand[] = []
    const seen = new Set<string>()

    const push = (raw: string, score: number): void => {
      if (!raw || raw.startsWith('data:')) return
      const full = abs(raw)
      if (!full || !/^https?:\/\//i.test(full) || seen.has(full)) return
      // 过滤明显小图/追踪像素
      if (/\.(svg)(\?|$)/i.test(full)) return
      let s = score
      if (/sprite|icon|logo|avatar|emoji|pixel|1x1/i.test(full)) {
        s -= 50
      }
      seen.add(full)
      list.push({ url: full, score: s })
    }

    for (const img of Array.from(document.images)) {
      const w = img.naturalWidth || img.width || 0
      const h = img.naturalHeight || img.height || 0
      const area = w * h
      if (area > 0 && (w < 120 || h < 120)) continue
      const src =
        img.currentSrc ||
        img.src ||
        img.getAttribute('data-src') ||
        img.getAttribute('data-original') ||
        ''
      push(src, area || 10000)
      const srcset = img.getAttribute('srcset')
      if (srcset) {
        const best = srcset
          .split(',')
          .map((p) => p.trim().split(/\s+/)[0])
          .filter(Boolean)
          .pop()
        if (best) push(best, (area || 10000) + 1)
      }
    }

    // Open Graph / Twitter 卡片图
    for (const sel of [
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
      'meta[property="og:image:url"]'
    ]) {
      const el = document.querySelector(sel)
      const content = el?.getAttribute('content')
      if (content) push(content, 500000)
    }

    // 懒加载背景图
    for (const el of Array.from(document.querySelectorAll('[style*="background"]'))) {
      const bg = getComputedStyle(el).backgroundImage
      const m = bg.match(/url\(["']?(https?:[^"')]+)["']?\)/i)
      if (m) push(m[1], 20000)
    }

    list.sort((a, b) => b.score - a.score)
    return list.slice(0, max).map((c) => c.url)
  }, limit)

  return urls
}

async function downloadImageToFile(
  url: string,
  outDir: string,
  index: number
): Promise<string | null> {
  const res = await fetch(url, {
    redirect: 'follow',
    headers: {
      // 部分站点需常见 UA，否则拒下图
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      Referer: new URL(url).origin
    }
  })
  if (!res.ok || !res.body) {
    throw new Error(`HTTP ${res.status}`)
  }

  const contentType = res.headers.get('content-type') || ''
  if (contentType && !contentType.startsWith('image/') && !contentType.includes('octet-stream')) {
    // 有些 CDN 不返回 image/*，仍尝试按扩展名保存
    if (!/\.(jpe?g|png|webp|gif|bmp)(\?|$)/i.test(url)) {
      throw new Error(`非图片类型: ${contentType}`)
    }
  }

  const ext = guessExt(url, contentType)
  const filePath = join(outDir, `image-${index + 1}${ext}`)
  await pipeline(Readable.fromWeb(res.body as import('stream/web').ReadableStream), createWriteStream(filePath))

  if (!existsSync(filePath)) return null
  return filePath
}

function guessExt(url: string, contentType: string): string {
  const fromType: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif'
  }
  for (const [k, v] of Object.entries(fromType)) {
    if (contentType.includes(k)) return v
  }
  const pathPart = url.split('?')[0]
  const ext = extname(pathPart).toLowerCase()
  if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
    return ext === '.jpeg' ? '.jpg' : ext
  }
  return '.jpg'
}
