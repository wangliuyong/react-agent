/**
 * 网络搜索：优先 Bing 结果页，失败再切百度。
 * HTTP 直抓 HTML 解析为主，全部失败后再无头浏览器兜底。
 */
import { queryHttp } from '../../net/http-client'
import { queryWithFallback } from '../../net/data-source'
import { getBrowserService } from '../../browser/service'
import type { AgentTool } from './types'

/** 单条搜索结果 */
export interface WebSearchItem {
  title: string
  url: string
  snippet: string
}

/** 搜索引擎标识（写入返回文案，便于调试） */
export type WebSearchEngine = 'bing' | 'baidu'

const DEFAULT_MAX_RESULTS = 8
const MAX_RESULTS_CAP = 15
/** 判定「有有效结果」的最低条数 */
const MIN_RESULTS = 2

const HTML_HEADERS = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
} as const

/** 去掉 HTML 标签与常见实体，压成单行可读文本 */
export function queryStripHtmlText(raw: string): string {
  return String(raw ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, n) => {
      const code = Number(n)
      return Number.isFinite(code) ? String.fromCodePoint(code) : ' '
    })
    .replace(/\s+/g, ' ')
    .trim()
}

/** 是否像广告/跳转壳链接（百度推广常用 baidu.php） */
function queryIsJunkSearchUrl(url: string): boolean {
  const u = url.toLowerCase()
  return (
    !u ||
    u.startsWith('javascript:') ||
    u.includes('baidu.php') ||
    u.includes('/aclick?') ||
    u.includes('go.microsoft.com/fwlink')
  )
}

/** 规范化结果列表：去空标题、去垃圾链、截断条数 */
function queryNormalizeSearchItems(
  items: WebSearchItem[],
  maxCount: number
): WebSearchItem[] {
  const seen = new Set<string>()
  const out: WebSearchItem[] = []
  for (const item of items) {
    const title = queryStripHtmlText(item.title).slice(0, 160)
    const url = String(item.url ?? '').trim()
    const snippet = queryStripHtmlText(item.snippet).slice(0, 280)
    if (!title || title.length < 2) continue
    if (queryIsJunkSearchUrl(url)) continue
    const key = `${title}::${url}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ title, url, snippet })
    if (out.length >= maxCount) break
  }
  return out
}

/**
 * 解析 Bing 搜索结果页 HTML（li.b_algo）。
 * 导出供单测使用。
 */
export function queryParseBingSearchHtml(html: string): WebSearchItem[] {
  const items: WebSearchItem[] = []
  const blocks = html.match(/<li class="b_algo"[\s\S]*?<\/li>/gi) ?? []
  for (const block of blocks) {
    const titleMatch =
      block.match(/<h2[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i) ??
      block.match(
        /<a[^>]*href="([^"]+)"[^>]*h="ID=SERP[^"]*"[^>]*>([\s\S]*?)<\/a>/i
      )
    if (!titleMatch) continue
    const snipMatch =
      block.match(/<p class="b_lineclamp[^"]*"[^>]*>([\s\S]*?)<\/p>/i) ??
      block.match(/<div class="b_caption"[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i)
    items.push({
      title: titleMatch[2],
      url: titleMatch[1],
      snippet: snipMatch?.[1] ?? ''
    })
  }
  return items
}

/**
 * 解析百度搜索结果页 HTML（c-container + mu 真链）。
 * 导出供单测使用。
 */
export function queryParseBaiduSearchHtml(html: string): WebSearchItem[] {
  const items: WebSearchItem[] = []
  const blocks =
    html.match(
      /<div[^>]*class="[^"]*c-container[^"]*"[\s\S]*?(?=<div[^>]*class="[^"]*c-container|$)/gi
    ) ?? []
  for (const block of blocks) {
    const mu = block.match(/\smu="(https?:\/\/[^"]+)"/i)?.[1]
    const titleMatch = block.match(
      /<h3[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i
    )
    if (!titleMatch) continue
    const snipMatch =
      block.match(/class="c-abstract[^"]*"[^>]*>([\s\S]*?)<\/(?:span|div|p)>/i) ??
      block.match(
        /class="[^"]*content-right_[^"]*"[^>]*>([\s\S]*?)<\/span>/i
      ) ??
      block.match(/data-content="([^"]+)"/i)
    items.push({
      title: titleMatch[2],
      url: mu || titleMatch[1],
      snippet: snipMatch?.[1] ?? ''
    })
  }
  return items
}

/** 结果太少或命中验证页时视为失败，触发下一引擎 */
function queryRequireSearchItems(
  items: WebSearchItem[],
  engine: WebSearchEngine,
  html: string
): WebSearchItem[] {
  const lower = html.toLowerCase()
  if (
    /captcha|验证码|unusual traffic|access denied|robot check|安全验证/.test(
      lower
    )
  ) {
    throw new Error(`${engine} 搜索页疑似验证码/拦截`)
  }
  if (items.length < MIN_RESULTS) {
    throw new Error(`${engine} 有效结果不足（${items.length} 条）`)
  }
  return items
}

/** HTTP 拉取 Bing 搜索页并解析 */
async function queryBingSearchHttp(
  query: string,
  maxCount: number
): Promise<WebSearchItem[]> {
  const url =
    'https://www.bing.com/search?' +
    new URLSearchParams({
      q: query,
      setlang: 'zh-CN',
      ensearch: '0'
    }).toString()
  const res = await queryHttp(url, {
    headers: { ...HTML_HEADERS, Referer: 'https://www.bing.com/' },
    timeoutMs: 18_000,
    retries: 1
  })
  const html = await res.text()
  const parsed = queryNormalizeSearchItems(queryParseBingSearchHtml(html), maxCount)
  return queryRequireSearchItems(parsed, 'bing', html)
}

/** HTTP 拉取百度搜索页并解析 */
async function queryBaiduSearchHttp(
  query: string,
  maxCount: number
): Promise<WebSearchItem[]> {
  const url =
    'https://www.baidu.com/s?' +
    new URLSearchParams({
      wd: query,
      rn: String(Math.min(20, Math.max(10, maxCount + 2)))
    }).toString()
  const res = await queryHttp(url, {
    headers: { ...HTML_HEADERS, Referer: 'https://www.baidu.com/' },
    timeoutMs: 18_000,
    retries: 1
  })
  const html = await res.text()
  const parsed = queryNormalizeSearchItems(queryParseBaiduSearchHtml(html), maxCount)
  return queryRequireSearchItems(parsed, 'baidu', html)
}

/**
 * 无头浏览器打开搜索页，用页面 HTML 再跑同一套解析。
 * 为什么：部分网络环境 HTTP 直抓会被拦，浏览器指纹更稳。
 */
async function querySearchViaBrowser(
  engine: WebSearchEngine,
  query: string,
  maxCount: number
): Promise<WebSearchItem[]> {
  const pageUrl =
    engine === 'bing'
      ? `https://www.bing.com/search?q=${encodeURIComponent(query)}&setlang=zh-CN`
      : `https://www.baidu.com/s?wd=${encodeURIComponent(query)}`
  const browser = getBrowserService()
  // navigate 内部会 ensureStarted(headless)，不弹有头窗
  await browser.navigate(pageUrl, 'headless')
  await browser.wait({ ms: engine === 'bing' ? 1600 : 2200 }, 'headless')
  const page = browser.getPage('headless')
  if (!page) throw new Error('无头浏览器未就绪')
  const html = await page.content()
  const parsed = queryNormalizeSearchItems(
    engine === 'bing'
      ? queryParseBingSearchHtml(html)
      : queryParseBaiduSearchHtml(html),
    maxCount
  )
  return queryRequireSearchItems(parsed, engine, html)
}

/** 格式化为 Agent 可读 Markdown */
function queryFormatSearchResults(
  query: string,
  engine: WebSearchEngine,
  items: WebSearchItem[],
  via: 'http' | 'browser'
): string {
  const engineLabel = engine === 'bing' ? 'Bing' : '百度'
  const lines = [
    `网络搜索「${query}」（引擎：${engineLabel}${via === 'browser' ? ' · 无头浏览器' : ''}）`,
    ''
  ]
  items.forEach((item, i) => {
    lines.push(`${i + 1}. ${item.title}`)
    lines.push(`   链接：${item.url}`)
    if (item.snippet) lines.push(`   摘要：${item.snippet}`)
  })
  return lines.join('\n')
}

/**
 * 网络关键词搜索：Bing → 百度；HTTP 失败后再无头浏览器（仍 Bing 优先）。
 */
export const webSearchTool: AgentTool = {
  name: 'web_search',
  description:
    '按关键词搜索公开网页。内部优先 Bing，失败自动改百度；HTTP 直抓失败时再无头浏览器兜底。' +
    '适合查新闻/背景/出处链接；已有具体文章 URL 时请用 query_web_data。' +
    '不要用本工具代替 fetch_hot_topics（热搜榜单）。',
  permission: 'safe',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: '搜索关键词或短句（建议中文）'
      },
      maxResults: {
        type: 'number',
        description: `最多返回条数，默认 ${DEFAULT_MAX_RESULTS}，最大 ${MAX_RESULTS_CAP}`
      }
    },
    required: ['query']
  },
  async execute(args) {
    const query = String(args.query ?? '').trim()
    if (!query) return 'query 不能为空'
    const maxCount = Math.min(
      MAX_RESULTS_CAP,
      Math.max(3, Number(args.maxResults ?? DEFAULT_MAX_RESULTS) || DEFAULT_MAX_RESULTS)
    )

    // 记录最终采用的引擎，供 formatSuccess 使用
    let usedEngine: WebSearchEngine = 'bing'

    const result = await queryWithFallback({
      apiFetchers: [
        async () => {
          usedEngine = 'bing'
          return queryBingSearchHttp(query, maxCount)
        },
        async () => {
          usedEngine = 'baidu'
          return queryBaiduSearchHttp(query, maxCount)
        }
      ],
      browserScraper: async () => {
        try {
          usedEngine = 'bing'
          return await querySearchViaBrowser('bing', query, maxCount)
        } catch (bingErr) {
          usedEngine = 'baidu'
          try {
            return await querySearchViaBrowser('baidu', query, maxCount)
          } catch (baiduErr) {
            throw new Error(
              `浏览器兜底失败：Bing=${bingErr instanceof Error ? bingErr.message : String(bingErr)}; ` +
                `百度=${baiduErr instanceof Error ? baiduErr.message : String(baiduErr)}`
            )
          }
        }
      },
      failLabel: '网络搜索失败',
      formatSuccess: (items, source) =>
        queryFormatSearchResults(
          query,
          usedEngine,
          items,
          source === 'browser' ? 'browser' : 'http'
        )
    })

    if (!result.ok || !result.data) {
      return `${result.message}\n可稍后重试，或改用 browser_navigate 打开搜索页后 browser_snapshot。`
    }
    return result.message
  }
}
