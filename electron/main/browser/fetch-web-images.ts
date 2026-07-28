import { createWriteStream, existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs'
import { join, extname, basename, dirname } from 'path'
import { pipeline } from 'stream/promises'
import { Readable } from 'stream'
import { nativeImage } from 'electron'
import { queryFormatMarkdownImage } from '../../../shared/markdown-local-image'
import { getArtifactsDir } from '../store/paths'
import { getBrowserService } from './service'
import { HttpError, queryHttp } from '../net/http-client'

/** 发布配图允许保留的扩展名（抖音等渠道要求） */
export const FETCH_SAFE_IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp'])

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
 * 判断扩展名/路径是否已是 jpg/jpeg/png/webp（抓取后可直接用于抖音等发布）。
 */
export function queryIsFetchSafeImageExt(extOrPath: string): boolean {
  const ext = (extOrPath.startsWith('.') ? extOrPath : extname(extOrPath)).toLowerCase()
  return FETCH_SAFE_IMAGE_EXTS.has(ext)
}

/**
 * 若本地文件不是 jpg/jpeg/png/webp，用 nativeImage 转为 JPEG 并删除原文件。
 * gif/bmp/avif 等会落到同目录的 `.jpg`。
 */
export function postNormalizeFetchedImageToSafeFormat(filePath: string): string | null {
  if (!filePath || !existsSync(filePath)) return null
  if (queryIsFetchSafeImageExt(filePath)) return filePath

  const dir = dirname(filePath)
  const base = basename(filePath, extname(filePath)) || 'image'
  const outPath = join(dir, `${base}.jpg`)

  try {
    const img = nativeImage.createFromPath(filePath)
    if (img.isEmpty()) {
      console.warn('[fetchWebImages] 无法解码非安全格式图片:', filePath)
      return null
    }
    writeFileSync(outPath, img.toJPEG(90))
    if (outPath !== filePath) {
      try {
        unlinkSync(filePath)
      } catch {
        // 原文件删除失败不影响已转换结果
      }
    }
    console.info('[fetchWebImages] normalized', filePath, '→', outPath)
    return outPath
  } catch (err) {
    console.warn('[fetchWebImages] normalize failed:', filePath, err)
    return null
  }
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
      const saved = await downloadImageToFile(url, outDir, index, {
        pageUrl: opts.pageUrl
      })
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
      message:
        `候选 ${candidates.length} 张均下载失败（常见原因：CDN 防盗链 403，如抖音/小红书图床）。` +
        '请换来源 pageUrl、改传可访问的 imageUrls，或让用户本地上传配图。'
    }
  }

  return {
    paths,
    sources,
    message: `已从网页保存 ${paths.length} 张配图到本地：\n${paths
      .map((p, i) => {
        const name = p.replace(/\\/g, '/').split('/').pop() || `image-${i + 1}`
        // 含空格路径走 CommonMark `<>` 目的地，聊天才能内联预览
        return `${i + 1}. ${queryFormatMarkdownImage(name, p)}\n   ← ${sources[i]}`
      })
      .join('\n')}`
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

/**
 * 为图片直链构造 Referer，满足抖音/小红书等 CDN 防盗链。
 * 勿用图片 CDN 自身 origin 作 Referer（易 403）。
 */
export function queryImageDownloadReferer(imageUrl: string, pageUrl?: string): string {
  try {
    const imgHost = new URL(imageUrl).hostname.toLowerCase()

    if (pageUrl && /^https?:\/\//i.test(pageUrl)) {
      const pageHost = new URL(pageUrl).hostname.toLowerCase()
      // 来源页与图床同站或常见关联 CDN 时，用完整来源页 Referer
      if (
        imageUrl.includes(pageHost) ||
        queryIsCdnRelatedToPage(imgHost, pageHost)
      ) {
        return pageUrl
      }
    }

    if (/douyinpic\.com|byteimg\.com|bytednsdoc\.com|ibyteimg\.com/i.test(imgHost)) {
      return 'https://www.douyin.com/'
    }
    if (/xhscdn\.com|xiaohongshu\.com|xhslink\.com/i.test(imgHost)) {
      return 'https://www.xiaohongshu.com/'
    }
    if (/weibo\.cn|weibo\.com|sinaimg\.cn/i.test(imgHost)) {
      return 'https://weibo.com/'
    }

    if (pageUrl && /^https?:\/\//i.test(pageUrl)) return pageUrl
    return `${new URL(imageUrl).protocol}//${new URL(imageUrl).host}/`
  } catch {
    return pageUrl && /^https?:\/\//i.test(pageUrl) ? pageUrl : ''
  }
}

/** 页面域名与图床是否常见关联（用于选用 pageUrl 作 Referer） */
function queryIsCdnRelatedToPage(imgHost: string, pageHost: string): boolean {
  if (imgHost.includes(pageHost) || pageHost.includes(imgHost)) return true
  const pairs: Array<[RegExp, RegExp]> = [
    [/douyinpic\.com|byteimg\.com|ibyteimg\.com/i, /douyin\.com/i],
    [/xhscdn\.com/i, /xiaohongshu\.com|xhslink\.com/i],
    [/sinaimg\.cn/i, /weibo\.(com|cn)/i]
  ]
  return pairs.some(([cdn, site]) => cdn.test(imgHost) && site.test(pageHost))
}

/** 部分 CDN 对 http 直链 403，优先尝试 https */
export function queryPreferHttpsImageUrl(url: string): string {
  try {
    const u = new URL(url)
    if (u.protocol === 'http:') {
      u.protocol = 'https:'
      return u.toString()
    }
  } catch {
    // ignore
  }
  return url
}

interface DownloadImageOptions {
  pageUrl?: string
}

async function downloadImageToFile(
  url: string,
  outDir: string,
  index: number,
  opts?: DownloadImageOptions
): Promise<string | null> {
  const candidates = [queryPreferHttpsImageUrl(url)]
  if (candidates[0] !== url) candidates.push(url)

  let lastError: unknown
  for (const tryUrl of candidates) {
    try {
      return await downloadImageOnce(tryUrl, outDir, index, opts?.pageUrl)
    } catch (err) {
      lastError = err
      const status = err instanceof HttpError ? err.status : 0
      if (status === 403 || status === 401) {
        try {
          return await downloadImageViaBrowserRequest(tryUrl, outDir, index, opts?.pageUrl)
        } catch (browserErr) {
          lastError = browserErr
        }
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}

async function downloadImageOnce(
  url: string,
  outDir: string,
  index: number,
  pageUrl?: string
): Promise<string | null> {
  const referer = queryImageDownloadReferer(url, pageUrl)
  const res = await queryHttp(url, {
    timeoutMs: 30_000,
    headers: {
      Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      ...(referer ? { Referer: referer } : {})
    }
  })
  if (!res.body) {
    throw new Error('响应无 body')
  }

  const contentType = res.headers.get('content-type') || ''
  if (contentType && !contentType.startsWith('image/') && !contentType.includes('octet-stream')) {
    if (!/\.(jpe?g|png|webp|gif|bmp)(\?|$)/i.test(url)) {
      throw new Error(`非图片类型: ${contentType}`)
    }
  }

  const ext = guessExt(url, contentType)
  const filePath = join(outDir, `image-${index + 1}${ext}`)
  await pipeline(
    Readable.fromWeb(res.body as import('stream/web').ReadableStream),
    createWriteStream(filePath)
  )

  if (!existsSync(filePath)) return null
  return postNormalizeFetchedImageToSafeFormat(filePath)
}

/**
 * Node fetch 被 CDN 403 时，用 Playwright 持久化上下文发请求（共享 Cookie / 更接近真实浏览器）。
 */
async function downloadImageViaBrowserRequest(
  url: string,
  outDir: string,
  index: number,
  pageUrl?: string
): Promise<string | null> {
  const browser = getBrowserService()
  await browser.ensureStarted()
  const page = browser.getPage()
  if (!page) throw new Error('浏览器未就绪，无法兜底下载图片')

  const referer = queryImageDownloadReferer(url, pageUrl)
  const response = await page.context().request.get(url, {
    timeout: 30_000,
    headers: {
      Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      ...(referer ? { Referer: referer } : {})
    }
  })

  if (!response.ok()) {
    throw new HttpError(`HTTP ${response.status()}`, response.status(), url)
  }

  const contentType = response.headers()['content-type'] || ''
  const ext = guessExt(url, contentType)
  const filePath = join(outDir, `image-${index + 1}${ext}`)
  writeFileSync(filePath, await response.body())
  if (!existsSync(filePath)) return null
  return postNormalizeFetchedImageToSafeFormat(filePath)
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
