/**
 * 页面媒体资源发现与按需下载。
 * 供 query_web_data 按 mediaTypes 提取 image/video/audio；默认只列 URL，download 时落盘。
 */
import { createWriteStream, existsSync, mkdirSync, writeFileSync } from 'fs'
import { extname, join } from 'path'
import { Transform, Readable } from 'stream'
import { pipeline } from 'stream/promises'
import type { Page } from 'playwright'
import { getArtifactsDir } from '../store/paths'
import { getBrowserService } from './service'
import { HttpError, queryHttp } from '../net/http-client'
import {
  queryImageDownloadReferer,
  queryPreferHttpsImageUrl
} from './fetch-web-images'

/** 支持的媒体种类 */
export type PageMediaKind = 'image' | 'video' | 'audio'

/** 单条媒体资源（发现结果；下载后回填 localPath） */
export interface PageMediaItem {
  kind: PageMediaKind
  /** 绝对 URL */
  url: string
  /** 可选标题（alt / title / og 等） */
  title?: string
  /** 可选 MIME 提示 */
  mimeHint?: string
  /** 下载后的本地绝对路径 */
  localPath?: string
  /** 下载失败或跳过原因（不拖垮整次调用） */
  downloadNote?: string
}

/** 单文件下载体积上限（50MB） */
export const MAX_MEDIA_FILE_BYTES = 50 * 1024 * 1024

const ALL_KINDS: PageMediaKind[] = ['image', 'video', 'audio']

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|bmp|avif|tiff?)(\?|#|$)/i
/** 视频扩展：.ogg 优先归音频（音乐站常见），视频用 .ogv */
const VIDEO_EXT = /\.(mp4|webm|ogv|mov|m4v|mkv|m3u8)(\?|#|$)/i
const AUDIO_EXT = /\.(mp3|wav|ogg|oga|m4a|aac|flac|opus|wma)(\?|#|$)/i

/** 从文本中捞 https? 媒体直链（脚本/JSON/转义 HTML 常见） */
const BARE_MEDIA_URL_RE =
  /https?:\/\/[^\s"'<>\\]+?\.(?:mp3|wav|ogg|oga|m4a|aac|flac|opus|wma|mp4|webm|ogv|mov|m4v|mkv|m3u8|jpe?g|png|webp|gif)(?:\?[^\s"'<>\\]*)?/gi

/**
 * 解析工具参数中的 mediaTypes；非法值忽略。
 * 空 / 未传 → 空数组（不提取）。
 */
export function queryNormalizeMediaTypes(raw: unknown): PageMediaKind[] {
  if (raw == null) return []
  const list = Array.isArray(raw) ? raw : [raw]
  const seen = new Set<PageMediaKind>()
  for (const item of list) {
    const k = String(item ?? '')
      .trim()
      .toLowerCase() as PageMediaKind
    if (ALL_KINDS.includes(k)) seen.add(k)
  }
  return ALL_KINDS.filter((k) => seen.has(k))
}

/** 规范化 maxMediaCount：默认 8，上限 20 */
export function queryNormalizeMaxMediaCount(raw: unknown): number {
  const n = Number(raw ?? 8)
  if (!Number.isFinite(n)) return 8
  return Math.min(20, Math.max(1, Math.floor(n)))
}

/** 解码常见 HTML 实体（教程站 &quot;src&quot;、&amp; 查询参数） */
export function queryDecodeMediaHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
}

/** 相对 URL → 绝对 URL；非法返回空串 */
export function queryAbsoluteMediaUrl(raw: string, pageUrl: string): string {
  const src = queryDecodeMediaHtmlEntities(raw.trim())
  if (!src || src.startsWith('data:') || src.startsWith('blob:')) return ''
  try {
    const abs = new URL(src, pageUrl).href
    if (!/^https?:\/\//i.test(abs)) return ''
    return abs
  } catch {
    return ''
  }
}

/** 根据 URL / MIME 推断媒体类型；.ogg 归 audio，.ogv 归 video */
export function queryKindFromUrlOrMime(
  url: string,
  mimeHint?: string
): PageMediaKind | null {
  const mime = (mimeHint || '').toLowerCase()
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('audio/')) return 'audio'
  // 先匹配更具体的视频扩展，再音频（避免 .ogg 被误判）
  if (VIDEO_EXT.test(url)) return 'video'
  if (AUDIO_EXT.test(url)) return 'audio'
  if (IMAGE_EXT.test(url)) return 'image'
  return null
}

function queryAttr(tag: string, name: string): string {
  const decoded = queryDecodeMediaHtmlEntities(tag)
  const re = new RegExp(`\\b${name}=["']([^"']+)["']`, 'i')
  const m = re.exec(decoded)
  return m?.[1]?.trim() || ''
}

/** 合并媒体列表去重，保留先出现的项 */
export function queryMergeMediaItems(
  ...lists: PageMediaItem[][]
): PageMediaItem[] {
  const seen = new Set<string>()
  const out: PageMediaItem[] = []
  for (const list of lists) {
    for (const item of list) {
      if (!item.url || seen.has(item.url)) continue
      seen.add(item.url)
      out.push(item)
    }
  }
  return out
}

/**
 * 从静态 HTML 提取媒体清单（HTTP 路径）。
 * 覆盖 og/twitter meta、img、video/audio、JSON-LD、脚本/转义文本中的直链。
 */
export function queryExtractMediaFromHtml(
  html: string,
  pageUrl: string,
  kinds: PageMediaKind[],
  limit: number
): PageMediaItem[] {
  if (!kinds.length || limit < 1) return []

  const want = new Set(kinds)
  const seen = new Set<string>()
  const items: PageMediaItem[] = []

  const push = (
    rawUrl: string,
    kind: PageMediaKind | null,
    extra?: { title?: string; mimeHint?: string }
  ): void => {
    if (items.length >= limit) return
    const url = queryAbsoluteMediaUrl(rawUrl, pageUrl)
    if (!url || seen.has(url)) return
    const resolved =
      kind ?? queryKindFromUrlOrMime(url, extra?.mimeHint) ?? null
    if (!resolved || !want.has(resolved)) return
    // 过滤明显小图/图标（仅对 image）
    if (resolved === 'image' && /sprite|icon|logo|avatar|emoji|pixel|1x1/i.test(url)) {
      return
    }
    seen.add(url)
    items.push({
      kind: resolved,
      url,
      title: extra?.title || undefined,
      mimeHint: extra?.mimeHint || undefined
    })
  }

  const decodedHtml = queryDecodeMediaHtmlEntities(html)

  // Open Graph / Twitter
  const metaRe =
    /<meta[^>]+(?:property|name)=["']([^"']+)["'][^>]+content=["']([^"']*)["'][^>]*>|<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']([^"']+)["'][^>]*>/gi
  let metaMatch: RegExpExecArray | null
  while ((metaMatch = metaRe.exec(decodedHtml)) !== null) {
    const key = (metaMatch[1] || metaMatch[4] || '').toLowerCase()
    const content = (metaMatch[2] || metaMatch[3] || '').trim()
    if (!content) continue
    if (key === 'og:image' || key === 'og:image:url' || key === 'twitter:image') {
      push(content, 'image')
    } else if (
      key === 'og:video' ||
      key === 'og:video:url' ||
      key === 'og:video:secure_url' ||
      key === 'twitter:player:stream'
    ) {
      push(content, 'video')
    } else if (key === 'og:audio' || key === 'og:audio:url' || key === 'og:audio:secure_url') {
      push(content, 'audio')
    }
  }

  // JSON-LD：AudioObject / VideoObject / ImageObject
  const ldRe =
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let ldMatch: RegExpExecArray | null
  while ((ldMatch = ldRe.exec(decodedHtml)) !== null) {
    try {
      const data = JSON.parse(ldMatch[1].trim())
      const nodes = Array.isArray(data) ? data : [data]
      for (const node of nodes) {
        queryPushJsonLdMedia(node, push)
      }
    } catch {
      // 非法 JSON-LD 忽略
    }
  }

  // <img>
  if (want.has('image')) {
    const imgRe = /<img\b[^>]*>/gi
    let imgTag: RegExpExecArray | null
    while ((imgTag = imgRe.exec(decodedHtml)) !== null) {
      const tag = imgTag[0]
      const src =
        queryAttr(tag, 'src') ||
        queryAttr(tag, 'data-src') ||
        queryAttr(tag, 'data-original') ||
        queryAttr(tag, 'data-lazy-src') ||
        queryAttr(tag, 'data-url')
      const alt = queryAttr(tag, 'alt') || queryAttr(tag, 'title')
      push(src, 'image', { title: alt || undefined })
      const srcset = queryAttr(tag, 'srcset')
      if (srcset) {
        const best = srcset
          .split(',')
          .map((p) => p.trim().split(/\s+/)[0])
          .filter(Boolean)
          .pop()
        if (best) push(best, 'image', { title: alt || undefined })
      }
    }
  }

  // <video> / <audio> 及内部 <source>
  const mediaBlockRe =
    /<(video|audio)\b([^>]*)>([\s\S]*?)<\/\1>|<(video|audio)\b([^>]*)\/>/gi
  let block: RegExpExecArray | null
  while ((block = mediaBlockRe.exec(decodedHtml)) !== null) {
    const kind = (block[1] || block[4] || '') as PageMediaKind
    if (!want.has(kind)) continue
    const openAttrs = block[2] || block[5] || ''
    const inner = block[3] || ''
    const title = queryAttr(openAttrs, 'title') || queryAttr(openAttrs, 'aria-label')
    const selfSrc = queryAttr(openAttrs, 'src')
    if (selfSrc) push(selfSrc, kind, { title: title || undefined })
    const sourceRe = /<source\b[^>]*>/gi
    let srcTag: RegExpExecArray | null
    while ((srcTag = sourceRe.exec(inner)) !== null) {
      const s = srcTag[0]
      const src = queryAttr(s, 'src')
      const type = queryAttr(s, 'type')
      push(src, kind, { title: title || undefined, mimeHint: type || undefined })
    }
  }

  // href / src 属性
  const hrefRe = /(?:href|src|data-src|data-url)=["']([^"']+)["']/gi
  let hrefMatch: RegExpExecArray | null
  while ((hrefMatch = hrefRe.exec(decodedHtml)) !== null) {
    const raw = hrefMatch[1]
    const guessed = queryKindFromUrlOrMime(raw)
    if (guessed && want.has(guessed)) push(raw, guessed)
  }

  // 脚本 / 转义文本中的裸媒体 URL（音乐站 JSON 常见）
  BARE_MEDIA_URL_RE.lastIndex = 0
  let bare: RegExpExecArray | null
  while ((bare = BARE_MEDIA_URL_RE.exec(decodedHtml)) !== null) {
    const raw = bare[0].replace(/[.,);]+$/, '')
    const guessed = queryKindFromUrlOrMime(raw)
    if (guessed && want.has(guessed)) push(raw, guessed)
  }

  return items.slice(0, limit)
}

/** 递归收集 JSON-LD 中的 contentUrl / url 媒体字段 */
function queryPushJsonLdMedia(
  node: unknown,
  push: (rawUrl: string, kind: PageMediaKind | null, extra?: { title?: string; mimeHint?: string }) => void
): void {
  if (!node || typeof node !== 'object') return
  if (Array.isArray(node)) {
    for (const child of node) queryPushJsonLdMedia(child, push)
    return
  }
  const obj = node as Record<string, unknown>
  const typeRaw = obj['@type']
  const type = String(Array.isArray(typeRaw) ? typeRaw[0] : typeRaw || '').toLowerCase()
  const contentUrl = typeof obj.contentUrl === 'string' ? obj.contentUrl : ''
  const url = typeof obj.url === 'string' ? obj.url : ''
  const name = typeof obj.name === 'string' ? obj.name : undefined
  const encoding = typeof obj.encodingFormat === 'string' ? obj.encodingFormat : undefined

  let kind: PageMediaKind | null = null
  if (type.includes('audio')) kind = 'audio'
  else if (type.includes('video')) kind = 'video'
  else if (type.includes('image')) kind = 'image'

  if (contentUrl) push(contentUrl, kind, { title: name, mimeHint: encoding })
  if (url && kind) push(url, kind, { title: name, mimeHint: encoding })

  for (const v of Object.values(obj)) {
    if (v && typeof v === 'object') queryPushJsonLdMedia(v, push)
  }
}

/**
 * 根据响应 Content-Type / URL 推断是否为目标媒体。
 * 供浏览器网络嗅探与单测复用。
 */
export function queryKindFromNetworkResponse(
  url: string,
  contentType: string,
  kinds: PageMediaKind[]
): PageMediaKind | null {
  const want = new Set(kinds)
  const ct = (contentType || '').toLowerCase().split(';')[0].trim()
  let kind: PageMediaKind | null = null
  if (ct.startsWith('audio/')) kind = 'audio'
  else if (ct.startsWith('video/')) kind = 'video'
  else if (ct.startsWith('image/') && !ct.includes('svg')) kind = 'image'
  else kind = queryKindFromUrlOrMime(url)
  if (!kind || !want.has(kind)) return null
  if (kind === 'image' && /sprite|icon|logo|avatar|emoji|pixel|1x1/i.test(url)) return null
  return kind
}

/**
 * 在已打开的 Playwright 页面内提取媒体（无头 / 有头同页，不重复导航）。
 * 额外扫描：performance 资源、内联脚本中的媒体直链。
 */
export async function queryExtractMediaInPage(
  page: Page,
  kinds: PageMediaKind[],
  limit: number,
  extraFromNetwork: PageMediaItem[] = []
): Promise<PageMediaItem[]> {
  if (!kinds.length || limit < 1) return []

  const raw = await page.evaluate(
    (args: { kinds: PageMediaKind[]; limit: number }) => {
      const { kinds: wantKinds, limit: max } = args
      const want = new Set(wantKinds)
      const seen = new Set<string>()
      type Cand = {
        kind: 'image' | 'video' | 'audio'
        url: string
        title?: string
        mimeHint?: string
        score: number
      }
      const list: Cand[] = []

      const abs = (src: string): string => {
        try {
          if (!src || src.startsWith('data:') || src.startsWith('blob:')) return ''
          return new URL(src, location.href).href
        } catch {
          return ''
        }
      }

      const kindFromUrl = (url: string): 'image' | 'video' | 'audio' | null => {
        if (/\.(mp4|webm|ogv|mov|m4v|mkv|m3u8)(\?|#|$)/i.test(url)) return 'video'
        if (/\.(mp3|wav|ogg|oga|m4a|aac|flac|opus|wma)(\?|#|$)/i.test(url)) return 'audio'
        if (/\.(jpe?g|png|webp|gif|bmp|avif)(\?|#|$)/i.test(url)) return 'image'
        return null
      }

      const push = (
        kind: 'image' | 'video' | 'audio',
        rawUrl: string,
        score: number,
        extra?: { title?: string; mimeHint?: string }
      ): void => {
        if (!want.has(kind)) return
        const url = abs(rawUrl)
        if (!url || !/^https?:\/\//i.test(url) || seen.has(url)) return
        if (kind === 'image' && /sprite|icon|logo|avatar|emoji|pixel|1x1/i.test(url)) {
          return
        }
        seen.add(url)
        list.push({
          kind,
          url,
          title: extra?.title,
          mimeHint: extra?.mimeHint,
          score
        })
      }

      const meta = (key: string): string => {
        const el =
          document.querySelector(`meta[property="${key}"]`) ||
          document.querySelector(`meta[name="${key}"]`)
        return el?.getAttribute('content')?.trim() || ''
      }

      if (want.has('image')) {
        for (const key of ['og:image', 'og:image:url', 'twitter:image']) {
          const c = meta(key)
          if (c) push('image', c, 500000)
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
          push('image', src, area || 10000, { title: img.alt || undefined })
          const srcset = img.getAttribute('srcset')
          if (srcset) {
            const best = srcset
              .split(',')
              .map((p) => p.trim().split(/\s+/)[0])
              .filter(Boolean)
              .pop()
            if (best) push('image', best, (area || 10000) + 1, { title: img.alt || undefined })
          }
        }
      }

      if (want.has('video')) {
        for (const key of [
          'og:video',
          'og:video:url',
          'og:video:secure_url',
          'twitter:player:stream'
        ]) {
          const c = meta(key)
          if (c) push('video', c, 500000)
        }
        for (const el of Array.from(document.querySelectorAll('video'))) {
          const v = el as HTMLVideoElement
          const title = v.getAttribute('title') || v.getAttribute('aria-label') || undefined
          const src = v.currentSrc || v.src || v.getAttribute('src') || ''
          if (src) push('video', src, 200000, { title })
          for (const s of Array.from(v.querySelectorAll('source'))) {
            push('video', s.getAttribute('src') || '', 180000, {
              title,
              mimeHint: s.getAttribute('type') || undefined
            })
          }
        }
      }

      if (want.has('audio')) {
        for (const key of ['og:audio', 'og:audio:url', 'og:audio:secure_url']) {
          const c = meta(key)
          if (c) push('audio', c, 500000)
        }
        for (const el of Array.from(document.querySelectorAll('audio'))) {
          const a = el as HTMLAudioElement
          const title = a.getAttribute('title') || a.getAttribute('aria-label') || undefined
          const src = a.currentSrc || a.src || a.getAttribute('src') || ''
          if (src) push('audio', src, 200000, { title })
          for (const s of Array.from(a.querySelectorAll('source'))) {
            push('audio', s.getAttribute('src') || '', 180000, {
              title,
              mimeHint: s.getAttribute('type') || undefined
            })
          }
        }
      }

      // performance 已加载资源（SPA 动态拉流常见）
      try {
        for (const entry of performance.getEntriesByType('resource') as PerformanceResourceTiming[]) {
          const name = entry.name || ''
          const k = kindFromUrl(name)
          if (k) push(k, name, 150000)
        }
      } catch {
        // ignore
      }

      // 内联脚本中的媒体直链
      const bareRe =
        /https?:\/\/[^\s"'<>\\]+?\.(?:mp3|wav|ogg|oga|m4a|aac|flac|opus|wma|mp4|webm|ogv|mov|m4v|mkv|m3u8)(?:\?[^\s"'<>\\]*)?/gi
      for (const script of Array.from(document.scripts)) {
        const text = script.textContent || ''
        if (!text || text.length > 500_000) continue
        bareRe.lastIndex = 0
        let m: RegExpExecArray | null
        while ((m = bareRe.exec(text)) !== null) {
          const raw = m[0].replace(/[.,);]+$/, '')
          const k = kindFromUrl(raw)
          if (k) push(k, raw, 120000)
        }
      }

      list.sort((a, b) => b.score - a.score)
      return list.slice(0, max).map(({ kind, url, title, mimeHint }) => ({
        kind,
        url,
        title,
        mimeHint
      }))
    },
    { kinds, limit }
  )

  return queryMergeMediaItems(extraFromNetwork, raw as PageMediaItem[]).slice(0, limit)
}

/**
 * 在导航前挂上响应嗅探，捕获 SPA 动态加载的音视频/图片。
 * 返回 dispose 与 getItems；调用方须在 finally 中 dispose。
 */
export function queryAttachMediaNetworkSniffer(
  page: Page,
  kinds: PageMediaKind[]
): { getItems: () => PageMediaItem[]; dispose: () => void } {
  const sniffed: PageMediaItem[] = []
  const seen = new Set<string>()

  const onResponse = (response: import('playwright').Response): void => {
    try {
      const url = response.url()
      if (!url || !/^https?:\/\//i.test(url) || seen.has(url)) return
      const headers = response.headers()
      const ct = headers['content-type'] || headers['Content-Type'] || ''
      const kind = queryKindFromNetworkResponse(url, ct, kinds)
      if (!kind) return
      // 跳过明显的追踪/小请求
      const status = response.status()
      if (status >= 400) return
      seen.add(url)
      sniffed.push({ kind, url, mimeHint: ct.split(';')[0] || undefined })
    } catch {
      // 嗅探失败不影响主流程
    }
  }

  page.on('response', onResponse)
  return {
    getItems: () => [...sniffed],
    dispose: () => {
      page.off('response', onResponse)
    }
  }
}

function queryAcceptHeader(kind: PageMediaKind): string {
  if (kind === 'image') {
    return 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8'
  }
  if (kind === 'video') {
    return 'video/mp4,video/webm,video/*,*/*;q=0.8'
  }
  return 'audio/mpeg,audio/mp4,audio/*,*/*;q=0.8'
}

function queryGuessMediaExt(kind: PageMediaKind, url: string, contentType: string): string {
  const fromType: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/avif': '.avif',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
    'video/quicktime': '.mov',
    'audio/mpeg': '.mp3',
    'audio/mp3': '.mp3',
    'audio/wav': '.wav',
    'audio/x-wav': '.wav',
    'audio/mp4': '.m4a',
    'audio/aac': '.aac',
    'audio/ogg': '.ogg',
    'audio/flac': '.flac'
  }
  for (const [k, v] of Object.entries(fromType)) {
    if (contentType.includes(k)) return v
  }
  const pathPart = url.split('?')[0]
  const ext = extname(pathPart).toLowerCase()
  const allowed =
    kind === 'image'
      ? ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.bmp']
      : kind === 'video'
        ? ['.mp4', '.webm', '.mov', '.m4v', '.mkv', '.ogv']
        : ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.oga', '.flac', '.opus']
  if (allowed.includes(ext)) return ext === '.jpeg' ? '.jpg' : ext
  return kind === 'image' ? '.jpg' : kind === 'video' ? '.mp4' : '.mp3'
}

function queryContentTypeMatchesKind(kind: PageMediaKind, contentType: string, url: string): boolean {
  const ct = contentType.toLowerCase()
  if (!ct || ct.includes('octet-stream')) return true
  if (kind === 'image') {
    return ct.startsWith('image/') || IMAGE_EXT.test(url)
  }
  if (kind === 'video') {
    return ct.startsWith('video/') || VIDEO_EXT.test(url)
  }
  return ct.startsWith('audio/') || AUDIO_EXT.test(url)
}

async function postDownloadMediaOnce(
  item: PageMediaItem,
  outDir: string,
  index: number,
  pageUrl?: string
): Promise<string> {
  const url = queryPreferHttpsImageUrl(item.url)
  const referer = queryImageDownloadReferer(url, pageUrl)
  const res = await queryHttp(url, {
    timeoutMs: 60_000,
    headers: {
      Accept: queryAcceptHeader(item.kind),
      ...(referer ? { Referer: referer } : {})
    }
  })

  const contentType = res.headers.get('content-type') || ''
  if (!queryContentTypeMatchesKind(item.kind, contentType, url)) {
    throw new Error(`非${item.kind}类型: ${contentType}`)
  }

  const lenHeader = res.headers.get('content-length')
  if (lenHeader) {
    const len = Number(lenHeader)
    if (Number.isFinite(len) && len > MAX_MEDIA_FILE_BYTES) {
      throw new Error(`文件过大（${Math.round(len / 1024 / 1024)}MB，上限 50MB）`)
    }
  }

  if (!res.body) throw new Error('响应无 body')

  const ext = queryGuessMediaExt(item.kind, url, contentType)
  const filePath = join(outDir, `${item.kind}-${index + 1}${ext}`)

  // 流式写入并限制体积，避免大视频撑爆磁盘
  const reader = Readable.fromWeb(res.body as import('stream/web').ReadableStream)
  let total = 0
  const counter = new Transform({
    transform(chunk, _enc, cb) {
      total += (chunk as Buffer).length
      if (total > MAX_MEDIA_FILE_BYTES) {
        cb(new Error('文件过大（超过 50MB 上限）'))
        return
      }
      cb(null, chunk)
    }
  })
  await pipeline(reader, counter, createWriteStream(filePath))
  if (!existsSync(filePath)) throw new Error('写入失败')
  return filePath
}

async function postDownloadMediaViaBrowser(
  item: PageMediaItem,
  outDir: string,
  index: number,
  pageUrl?: string
): Promise<string> {
  const browser = getBrowserService()
  await browser.ensureStarted()
  const page = browser.getPage('headless') || browser.getPage()
  if (!page) throw new Error('浏览器未就绪，无法兜底下载媒体')

  const url = queryPreferHttpsImageUrl(item.url)
  const referer = queryImageDownloadReferer(url, pageUrl)
  const response = await page.context().request.get(url, {
    timeout: 60_000,
    headers: {
      Accept: queryAcceptHeader(item.kind),
      ...(referer ? { Referer: referer } : {})
    }
  })

  if (!response.ok()) {
    throw new HttpError(`HTTP ${response.status()}`, response.status(), url)
  }

  const body = await response.body()
  if (body.byteLength > MAX_MEDIA_FILE_BYTES) {
    throw new Error(`文件过大（${Math.round(body.byteLength / 1024 / 1024)}MB，上限 50MB）`)
  }

  const contentType = response.headers()['content-type'] || ''
  if (!queryContentTypeMatchesKind(item.kind, contentType, url)) {
    throw new Error(`非${item.kind}类型: ${contentType}`)
  }

  const ext = queryGuessMediaExt(item.kind, url, contentType)
  const filePath = join(outDir, `${item.kind}-${index + 1}${ext}`)
  writeFileSync(filePath, body)
  if (!existsSync(filePath)) throw new Error('写入失败')
  return filePath
}

export interface PostDownloadPageMediaResult {
  items: PageMediaItem[]
  outDir: string
  notes: string[]
}

/**
 * 将已发现的媒体下载到 artifacts/web-media/<timestamp>/。
 * 单条失败不中断：回填 downloadNote，保留 URL。
 */
export async function postDownloadPageMedia(
  items: PageMediaItem[],
  pageUrl: string,
  outDir?: string
): Promise<PostDownloadPageMediaResult> {
  const dir =
    outDir ?? join(getArtifactsDir(), 'web-media', String(Date.now()))
  mkdirSync(dir, { recursive: true })

  const notes: string[] = []
  const result: PageMediaItem[] = []

  for (let i = 0; i < items.length; i++) {
    const item = { ...items[i] }
    try {
      try {
        item.localPath = await postDownloadMediaOnce(item, dir, i, pageUrl)
      } catch (err) {
        const status = err instanceof HttpError ? err.status : 0
        if (status === 403 || status === 401) {
          item.localPath = await postDownloadMediaViaBrowser(item, dir, i, pageUrl)
        } else {
          throw err
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      item.downloadNote = msg
      notes.push(`${item.kind} ${item.url}: ${msg}`)
      console.warn('[postDownloadPageMedia] failed:', item.url, err)
    }
    result.push(item)
  }

  return { items: result, outDir: dir, notes }
}

/** 格式化为 Agent 可读的媒体区块 */
export function queryFormatMediaSection(items: PageMediaItem[]): string {
  if (!items.length) return '—— 媒体资源 ——\n（未发现匹配的媒体）'
  const lines = ['—— 媒体资源 ——']
  items.forEach((m, i) => {
    const title = m.title ? ` 「${m.title}」` : ''
    const local = m.localPath ? `\n   本地: ${m.localPath}` : ''
    const note = m.downloadNote ? `\n   下载: ${m.downloadNote}` : ''
    lines.push(`${i + 1}. [${m.kind}]${title}\n   URL: ${m.url}${local}${note}`)
  })
  return lines.join('\n')
}
