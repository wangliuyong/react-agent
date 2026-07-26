/**
 * 通用链接/网页内容获取：API（HTTP）优先，失败再无头浏览器抓取正文。
 * 面向用户粘贴的文章链接（掘金、知乎、微信公众号、CSDN 等）做站点适配与正文清洗。
 */
import { queryHttp } from '../../net/http-client'
import { queryWithFallback } from '../../net/data-source'
import { getBrowserService } from '../../browser/service'
import { queryEncodeWorkflowCtxResult } from './hot-topics'
import type { AgentTool } from './types'

/** 正文最大字符数（过长截断，避免撑爆上下文） */
const MAX_CONTENT_CHARS = 20_000

/** 判定「正文过短」阈值：低于此长度时改用下一数据源 */
const MIN_CONTENT_CHARS = 80

export interface LinkContentSnapshot {
  /** 页面标题 */
  title: string
  /** 最终解析到的 URL */
  url: string
  /** 清洗后的正文 */
  content: string
  /** 可选：作者 / 站点名 */
  author?: string
  /** 可选：摘要（og:description 等） */
  description?: string
}

/** 站点正文选择器配置：匹配 hostname 后优先用这些 CSS */
interface SiteContentProfile {
  /** 匹配 URL 的正则 */
  test: RegExp
  /** 按优先级排列的正文容器选择器 */
  selectors: string[]
  /** 无头打开后额外等待（SPA 渲染） */
  waitMs?: number
}

/**
 * 常见中文技术/内容站正文选择器。
 * 为什么：纯去标签会把导航/推荐混进正文；站点选择器可显著提高可读性。
 */
const SITE_PROFILES: SiteContentProfile[] = [
  {
    test: /juejin\.cn/i,
    selectors: ['.article-content', '#article-root', '.markdown-body', 'article'],
    waitMs: 2200
  },
  {
    test: /(zhuanlan\.zhihu\.com|www\.zhihu\.com)/i,
    selectors: [
      '.Post-RichText',
      '.RichText.ztext',
      '.QuestionRichText',
      '.RichContent-inner',
      'article'
    ],
    waitMs: 2800
  },
  {
    test: /mp\.weixin\.qq\.com/i,
    selectors: ['#js_content', '.rich_media_content'],
    waitMs: 1800
  },
  {
    test: /csdn\.net/i,
    selectors: ['#content_views', '.article_content', '#article_content', 'article'],
    waitMs: 1800
  },
  {
    test: /jianshu\.com/i,
    selectors: ['article._2rhmJa', 'article', '.article'],
    waitMs: 1800
  },
  {
    test: /segmentfault\.com/i,
    selectors: ['.article', '.fmt', 'article'],
    waitMs: 1800
  },
  {
    test: /cnblogs\.com/i,
    selectors: ['#cnblogs_post_body', '.postBody', 'article'],
    waitMs: 1500
  },
  {
    test: /sspai\.com/i,
    selectors: ['.article-content', '.content', 'article'],
    waitMs: 1800
  },
  {
    test: /xiaohongshu\.com/i,
    selectors: ['#detail-desc', '.note-text', 'article'],
    waitMs: 2500
  },
  {
    test: /medium\.com/i,
    selectors: ['article', 'section'],
    waitMs: 2000
  },
  {
    test: /(github\.com)/i,
    selectors: ['.markdown-body', 'article', '#readme'],
    waitMs: 1500
  }
]

/** 通用正文容器（无站点匹配时使用） */
const GENERIC_CONTENT_SELECTORS = [
  'article',
  'main article',
  '[role="main"] article',
  'main',
  '[role="main"]',
  '.post-content',
  '.article-content',
  '.entry-content',
  '#content',
  '.content'
]

function querySiteProfile(url: string): SiteContentProfile | undefined {
  return SITE_PROFILES.find((p) => p.test.test(url))
}

/** 从 HTML 属性值中取 meta content（简易解析，不引入 DOM 库） */
function queryMetaContent(html: string, ...keys: string[]): string {
  for (const key of keys) {
    const re = new RegExp(
      `<meta[^>]+(?:name|property)=["']${key}["'][^>]+content=["']([^"']*)["'][^>]*>|<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']${key}["'][^>]*>`,
      'i'
    )
    const m = re.exec(html)
    const val = (m?.[1] ?? m?.[2] ?? '').trim()
    if (val) return queryDecodeHtmlEntities(val)
  }
  return ''
}

function queryDecodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
}

/** 提取 <title> */
function queryHtmlTitle(html: string): string {
  const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)
  return m ? queryDecodeHtmlEntities(m[1].replace(/\s+/g, ' ').trim()) : ''
}

/**
 * 按选择器列表从 HTML 片段中抠出标签内文本（正则近似，够用做 HTTP 路径）。
 * 成功返回清洗文本；失败返回空串。
 */
function queryExtractBySelectors(html: string, selectors: string[]): string {
  for (const sel of selectors) {
    // 仅支持简单 class / id / 标签名，复杂选择器留给浏览器路径
    let re: RegExp | null = null
    if (sel.startsWith('#')) {
      const id = sel.slice(1).split(/[\s.>]/)[0]
      re = new RegExp(
        `<([a-z0-9]+)[^>]*\\sid=["']${id}["'][^>]*>([\\s\\S]*?)<\\/\\1>`,
        'i'
      )
    } else if (sel.startsWith('.') && !sel.includes(' ')) {
      const cls = sel.slice(1).split('.')[0]
      re = new RegExp(
        `<([a-z0-9]+)[^>]*\\sclass=["'][^"']*\\b${cls}\\b[^"']*["'][^>]*>([\\s\\S]*?)<\\/\\1>`,
        'i'
      )
    } else if (/^[a-z][a-z0-9]*$/i.test(sel)) {
      re = new RegExp(`<(${sel})[^>]*>([\\s\\S]*?)<\\/${sel}>`, 'i')
    }
    if (!re) continue
    const m = re.exec(html)
    if (!m?.[2]) continue
    const text = queryStripHtmlToText(m[2])
    if (text.length >= MIN_CONTENT_CHARS) return text
  }
  return ''
}

/** 去掉脚本/样式/标签，压缩空白 */
function queryStripHtmlToText(html: string): string {
  return queryDecodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|h[1-6]|li|tr|section|article)>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim()
  )
}

function queryTruncate(text: string, max = MAX_CONTENT_CHARS): string {
  if (text.length <= max) return text
  return `${text.slice(0, max)}\n…[已截断，原文共约 ${text.length} 字]`
}

/** 格式化为 Agent 可读长文本 */
function queryFormatLinkContent(snap: LinkContentSnapshot, sourceLabel: string): string {
  const lines = [
    `【链接内容】${snap.title || '（无标题）'}`,
    `URL: ${snap.url}`,
    snap.author ? `作者: ${snap.author}` : '',
    snap.description ? `摘要: ${snap.description}` : '',
    '',
    '—— 正文 ——',
    snap.content,
    '',
    `（来源：${sourceLabel}）`
  ]
  return lines.filter((l) => l !== '').join('\n')
}

/**
 * HTTP 拉取并解析正文。
 * JSON API 原样截断返回；HTML 走 meta + 站点选择器 + 全文去标签兜底。
 */
async function queryWebDataViaHttp(url: string): Promise<LinkContentSnapshot> {
  const res = await queryHttp(url, {
    timeoutMs: 20_000,
    retries: 1,
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/json,text/plain,*/*',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
    }
  })
  const contentType = res.headers.get('content-type') || ''
  const text = await res.text()
  if (!text.trim()) throw new Error('HTTP 响应体为空')

  // 公开 JSON API：直接当正文
  if (contentType.includes('application/json') || /^\s*[\[{]/.test(text.trim())) {
    const body = queryTruncate(text.trim())
    if (body.length < 2) throw new Error('JSON 响应过短')
    return { title: 'JSON 数据', url, content: body }
  }

  const title =
    queryMetaContent(text, 'og:title', 'twitter:title') || queryHtmlTitle(text) || ''
  const description =
    queryMetaContent(text, 'og:description', 'description', 'twitter:description') || undefined
  const author =
    queryMetaContent(text, 'author', 'og:article:author', 'article:author') || undefined

  const profile = querySiteProfile(url)
  const selectors = [
    ...(profile?.selectors ?? []),
    ...GENERIC_CONTENT_SELECTORS
  ]
  let content = queryExtractBySelectors(text, selectors)
  if (!content) {
    content = queryStripHtmlToText(text)
  }
  content = queryTruncate(content)

  if (content.length < MIN_CONTENT_CHARS) {
    throw new Error('HTTP 提取正文过短，改用浏览器兜底')
  }

  return { title, url, content, author, description }
}

/**
 * 在页面内执行：按选择器取最长可读文本 + document.title。
 * 在 Playwright page.evaluate 中运行，不能引用外部闭包里的函数。
 */
async function queryExtractInPage(
  page: import('playwright').Page,
  selectors: string[]
): Promise<{ title: string; content: string; author: string; description: string }> {
  return page.evaluate(
    (sels: string[]) => {
      const pickText = (el: Element | null): string => {
        if (!el) return ''
        const clone = el.cloneNode(true) as HTMLElement
        clone
          .querySelectorAll('script,style,noscript,svg,nav,footer,aside,iframe')
          .forEach((n) => n.remove())
        return (clone.innerText || clone.textContent || '').replace(/\s+\n/g, '\n').trim()
      }

      let best = ''
      for (const sel of sels) {
        try {
          const nodes = Array.from(document.querySelectorAll(sel))
          for (const node of nodes) {
            const t = pickText(node)
            if (t.length > best.length) best = t
          }
        } catch {
          // 非法选择器忽略
        }
      }
      if (best.length < 80) {
        const body = pickText(document.body)
        if (body.length > best.length) best = body
      }

      const meta = (key: string): string => {
        const el =
          document.querySelector(`meta[property="${key}"]`) ||
          document.querySelector(`meta[name="${key}"]`)
        return el?.getAttribute('content')?.trim() || ''
      }

      return {
        title: document.title || meta('og:title') || '',
        content: best,
        author: meta('author') || meta('og:article:author') || '',
        description: meta('og:description') || meta('description') || ''
      }
    },
    selectors
  )
}

/** 无头浏览器抓取（SPA / 反爬站点兜底，不弹窗） */
async function queryWebDataViaBrowser(url: string): Promise<LinkContentSnapshot> {
  const browser = getBrowserService()
  const profile = querySiteProfile(url)
  const waitMs = profile?.waitMs ?? 1800
  const selectors = [...(profile?.selectors ?? []), ...GENERIC_CONTENT_SELECTORS]

  await browser.navigate(url, 'headless')
  await browser.wait({ ms: waitMs }, 'headless')

  const page = browser.getPage('headless')
  if (!page) throw new Error('无头浏览器页面不可用')

  // 若有站点首要选择器，短超时等待出现（失败不抛，继续全文提取）
  const primary = profile?.selectors?.[0]
  if (primary) {
    await page
      .locator(primary)
      .first()
      .waitFor({ state: 'visible', timeout: 4_000 })
      .catch(() => undefined)
  }

  const extracted = await queryExtractInPage(page, selectors)
  const content = queryTruncate((extracted.content || '').trim())
  if (content.length < MIN_CONTENT_CHARS) {
    throw new Error('无头浏览器未提取到足够正文（可能需登录或页面受限）')
  }

  return {
    title: extracted.title,
    url,
    content,
    author: extracted.author || undefined,
    description: extracted.description || undefined
  }
}

/**
 * 从用户粘贴的链接 / 任意公开 URL 获取正文。
 * 优先 HTTP；失败再用无头浏览器（不弹窗）。
 */
export const queryWebDataTool: AgentTool = {
  name: 'query_web_data',
  description:
    '根据用户粘贴或提供的 URL 获取网页正文（标题、摘要、正文）。' +
    '适用于掘金、知乎专栏/问答、微信公众号、CSDN、简书、博客、GitHub README 及一般网站；' +
    '优先 HTTP 解析，失败则无头浏览器后台抓取（不弹窗）。' +
    '热点榜单请用 fetch_hot_topics；天气用 query_weather；仅要配图用 fetch_web_images。',
  permission: 'safe',
  parameters: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: '目标链接（http/https），例如掘金文章、知乎专栏、普通网页 URL'
      },
      preferBrowser: {
        type: 'boolean',
        description:
          '为 true 时跳过 HTTP，直接无头浏览器（默认 false；SPA/强前端站可设 true）'
      },
      maxLength: {
        type: 'number',
        description: `正文最大字符数，默认 ${MAX_CONTENT_CHARS}，上限 ${MAX_CONTENT_CHARS}`
      }
    },
    required: ['url']
  },
  async execute(args) {
    const url = String(args.url ?? '').trim()
    if (!/^https?:\/\//i.test(url)) {
      return queryEncodeWorkflowCtxResult('url 必须以 http/https 开头', {
        webDataOk: '0',
        webData: '',
        webDataUrl: url,
        webDataTitle: ''
      })
    }

    const preferBrowser = Boolean(args.preferBrowser)
    const maxLength = Math.min(
      MAX_CONTENT_CHARS,
      Math.max(1_000, Number(args.maxLength ?? MAX_CONTENT_CHARS) || MAX_CONTENT_CHARS)
    )

    const result = await queryWithFallback({
      apiFetchers: preferBrowser ? [] : [() => queryWebDataViaHttp(url)],
      browserScraper: () => queryWebDataViaBrowser(url),
      failLabel: '链接内容获取失败',
      formatSuccess: (data, source) => {
        const clipped: LinkContentSnapshot = {
          ...data,
          content: queryTruncate(data.content, maxLength)
        }
        return queryFormatLinkContent(
          clipped,
          source === 'browser' ? `无头浏览器兜底 · ${url}` : `HTTP · ${url}`
        )
      }
    })

    if (!result.ok || result.data == null) {
      return queryEncodeWorkflowCtxResult(result.message, {
        webDataOk: '0',
        webData: '',
        webDataUrl: url,
        webDataTitle: '',
        webDataSource: result.source
      })
    }

    const snap = result.data
    return queryEncodeWorkflowCtxResult(result.message, {
      webDataOk: '1',
      webData: result.message,
      webDataUrl: url,
      webDataTitle: snap.title,
      webDataSource: result.source
    })
  }
}
