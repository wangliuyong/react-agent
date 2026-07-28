import { WORKFLOW_CTX_PREFIX } from '../../workflow/tool-result'
import { postHttpJson, queryHttp, queryHttpJson } from '../../net/http-client'
import { queryWithFallback } from '../../net/data-source'
import { getBrowserService } from '../../browser/service'
import type { AgentTool } from './types'

/**
 * 支持的热点来源标识（与工具参数 enum 保持一致）。
 *
 * 抓取可行性（2026-07-28 实测）：
 * - weibo / baidu / tophub：公开接口或静态/半静态 HTML，适合直抓
 * - douyin：页面动态渲染，须走公开 web 接口（或 Tophub 聚合）
 * - kuaishou：原生反爬强，优先 Tophub 子榜，不建议硬爬官网
 * - tencent：首页榜单分散，优先公开热榜网关，失败再 Tophub
 */
export type HotTopicSource =
  | 'weibo'
  | 'baidu'
  | 'douyin'
  | 'kuaishou'
  | 'tencent'
  | 'tophub'

/** 各来源展示名、榜单页 URL、浏览器文本过滤用噪声词 */
const HOT_SOURCE_META: Record<
  HotTopicSource,
  { label: string; pageUrl: string; noise: RegExp }
> = {
  weibo: {
    label: '微博热搜',
    pageUrl: 'https://s.weibo.com/top/summary?cate=realtimehot',
    noise: /登录|热搜|实时|微博|榜单|Visitor/
  },
  baidu: {
    label: '百度热搜',
    pageUrl: 'https://top.baidu.com/board?tab=realtime',
    noise: /登录|热搜|实时|百度|榜单/
  },
  douyin: {
    label: '抖音热点',
    pageUrl: 'https://www.douyin.com/hot',
    noise: /登录|热点|抖音|热榜|推荐|关注/
  },
  kuaishou: {
    label: '快手热点',
    pageUrl: 'https://www.kuaishou.com/?isHome=1',
    noise: /登录|热点|快手|热榜|推荐|关注/
  },
  tencent: {
    label: '腾讯新闻热点',
    pageUrl: 'https://news.qq.com/',
    noise: /登录|腾讯|新闻|热点|推荐|客户端|下载/
  },
  tophub: {
    label: '今日热榜榜中榜',
    pageUrl: 'https://tophub.today/hot',
    noise: /登录|今日热榜|榜中榜|热榜|推荐|夜间模式|App|开放平台|赞助商/
  }
}

/**
 * Tophub 各平台子榜 hashid（来自 tophub.today 首页 cc-cd 卡片）。
 * 为什么：难直爬平台（快手等）用聚合站子榜作稳定兜底，避免逆向加密签名。
 */
const TOPHUB_BOARD_IDS: Partial<Record<HotTopicSource, string>> = {
  weibo: 'KqndgxeLl9',
  baidu: 'Jb0vmloB1G',
  douyin: 'DpQvNABoNE',
  kuaishou: 'MZd7PrPerO',
  tencent: '12owgX0oNV'
}

const HOT_SOURCE_LIST = Object.keys(HOT_SOURCE_META) as HotTopicSource[]

/** 多路请求之间的最小间隔，降低 429 / IP 验证码概率 */
const REQUEST_GAP_MS = 2500

export function queryEncodeWorkflowCtxResult(
  message: string,
  patch: Record<string, unknown>
): string {
  return `${WORKFLOW_CTX_PREFIX}${JSON.stringify({ message, patch })}`
}

function queryFormatList(items: string[], sourceLabel: string): string {
  const lines = items.map((t, i) => `${i + 1}. ${t}`)
  return [`【${sourceLabel}】今日热点（共 ${items.length} 条）`, ...lines].join('\n')
}

/** 去重并截断；条数过少时抛错，便于走下一数据源 */
function queryRequireHotItems(items: string[], minCount = 3, maxCount = 25): string[] {
  const unique = Array.from(new Set(items.map((t) => t.trim()).filter(Boolean)))
  if (unique.length < minCount) {
    throw new Error(`热点条数过少（${unique.length}）`)
  }
  return unique.slice(0, maxCount)
}

function querySleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 包装多路拉取：前一路失败后等待再试下一路。
 * 为什么：合规要求控制频率，短时间连打易触发限流。
 */
function queryWithRequestGap(
  fetchers: Array<() => Promise<string[]>>
): Array<() => Promise<string[]>> {
  return fetchers.map((fn, index) => async () => {
    if (index > 0) await querySleep(REQUEST_GAP_MS)
    return fn()
  })
}

function collectWeiboDescs(node: unknown, out: string[]): void {
  if (!node) return
  if (Array.isArray(node)) {
    for (const item of node) collectWeiboDescs(item, out)
    return
  }
  if (typeof node !== 'object') return
  const row = node as Record<string, unknown>
  const title = String(row.desc || row.word || row.note || '').trim()
  if (title && title.length < 40 && !title.includes('http')) out.push(title)
  if (row.card_group != null) collectWeiboDescs(row.card_group, out)
  if (row.cards != null) collectWeiboDescs(row.cards, out)
  if (row.data != null) collectWeiboDescs(row.data, out)
}

/**
 * 微博热搜：公开 AJAX 优先。
 * 注意：s.weibo.com 榜单页对无 Cookie 请求常返回访客系统页，不适合裸 HTML 直爬。
 */
async function queryWeiboHotTopicsApi(): Promise<string[]> {
  const endpoints = [
    {
      url: 'https://weibo.com/ajax/side/hotSearch',
      headers: { Referer: 'https://weibo.com/', 'X-Requested-With': 'XMLHttpRequest' }
    },
    {
      url: 'https://m.weibo.cn/api/container/getIndex?containerid=106003type%3D25%26t%3D3%26disable_hot%3D1%26filter_type%3Drealtimehot',
      headers: {
        Referer: 'https://m.weibo.cn/',
        'MWeibo-Pwa': '1',
        'X-Requested-With': 'XMLHttpRequest'
      }
    }
  ] as const

  const errors: string[] = []
  for (let i = 0; i < endpoints.length; i++) {
    const ep = endpoints[i]
    if (i > 0) await querySleep(REQUEST_GAP_MS)
    try {
      const data = await queryHttpJson(ep.url, { headers: ep.headers })
      const items: string[] = []
      collectWeiboDescs(data, items)
      const realtime = (data as { data?: { realtime?: Array<{ word?: string }> } })?.data
        ?.realtime
      if (Array.isArray(realtime)) {
        for (const r of realtime) {
          const w = String(r.word || '').trim()
          if (w) items.push(w)
        }
      }
      return queryRequireHotItems(items)
    } catch (e) {
      errors.push(`${ep.url} → ${e instanceof Error ? e.message : String(e)}`)
    }
  }
  throw new Error(errors.join('; ') || '微博热搜 API 不可用')
}

function collectBaiduWords(node: unknown, out: string[]): void {
  if (!node) return
  if (Array.isArray(node)) {
    for (const item of node) collectBaiduWords(item, out)
    return
  }
  if (typeof node !== 'object') return
  const row = node as Record<string, unknown>
  const title = String(row.word || row.query || row.desc || '').trim()
  if (title) out.push(title)
  if (row.content != null) collectBaiduWords(row.content, out)
  if (row.cards != null) collectBaiduWords(row.cards, out)
  if (row.topContent != null) collectBaiduWords(row.topContent, out)
}

/**
 * 从百度热榜 HTML 内嵌 `<!--s-data:...-->` 解析标题。
 * 为什么：榜单数据写死在页面 JSON 注释中，无需 Selenium。
 */
export function queryParseBaiduBoardHtml(html: string): string[] {
  const match = html.match(/<!--s-data:([\s\S]*?)-->/)
  if (!match?.[1]) {
    throw new Error('百度热榜页未找到 s-data 内嵌 JSON')
  }
  const payload = JSON.parse(match[1]) as { data?: unknown }
  const items: string[] = []
  collectBaiduWords(payload.data ?? payload, items)
  return items
}

/** 百度热搜：官方 board API */
async function queryBaiduHotTopicsApi(): Promise<string[]> {
  const url = 'https://top.baidu.com/api/board?platform=wise&tab=realtime'
  const data = await queryHttpJson<{ success?: boolean; data?: unknown }>(url, {
    headers: { Referer: 'https://top.baidu.com/board?tab=realtime' }
  })
  if (data.success === false) {
    throw new Error('百度热搜接口 success=false')
  }
  const items: string[] = []
  collectBaiduWords(data.data, items)
  return queryRequireHotItems(items)
}

/** 百度热搜：拉取榜单页 HTML，抠内嵌 JSON */
async function queryBaiduHotTopicsHtml(): Promise<string[]> {
  const res = await queryHttp('https://top.baidu.com/board?tab=realtime', {
    headers: {
      Referer: 'https://top.baidu.com/',
      Accept: 'text/html,application/xhtml+xml,*/*'
    },
    timeoutMs: 30_000,
    retries: 1
  })
  const html = await res.text()
  return queryRequireHotItems(queryParseBaiduBoardHtml(html))
}

/**
 * 抖音热点：优先旧版公开榜单接口，失败再走 PC Web 热点 list。
 * 为什么：页面为动态渲染，裸 requests 拿不到榜单；公开接口免登录返回 JSON。
 */
async function queryDouyinHotTopicsApi(): Promise<string[]> {
  const errors: string[] = []

  try {
    const data = await queryHttpJson<{
      word_list?: Array<{ word?: string }>
      status_code?: number
    }>('https://www.iesdouyin.com/web/api/v2/hotsearch/billboard/word/', {
      headers: { Referer: 'https://www.douyin.com/' }
    })
    const items = (data.word_list ?? [])
      .map((row) => String(row.word || '').trim())
      .filter(Boolean)
    return queryRequireHotItems(items)
  } catch (e) {
    errors.push(`iesdouyin → ${e instanceof Error ? e.message : String(e)}`)
  }

  await querySleep(REQUEST_GAP_MS)

  try {
    const data = await queryHttpJson<{
      data?: { word_list?: Array<{ word?: string }> }
      word_list?: Array<{ word?: string }>
    }>(
      'https://www.douyin.com/aweme/v1/web/hot/search/list/?device_platform=webapp&aid=6383&channel=channel_pc_web&detail_list=1',
      { headers: { Referer: 'https://www.douyin.com/' } }
    )
    const wordList = data.data?.word_list ?? data.word_list ?? []
    const items = wordList.map((row) => String(row.word || '').trim()).filter(Boolean)
    return queryRequireHotItems(items)
  } catch (e) {
    errors.push(`douyin-web → ${e instanceof Error ? e.message : String(e)}`)
  }

  throw new Error(errors.join('; ') || '抖音热点 API 不可用')
}

/**
 * 快手热点：PC 站 GraphQL visionHotRank（脆弱，仅作次选）。
 * 为什么：官网 JS 混淆 + 动态签名 + 滑块风控，不适合作为主路径。
 */
async function queryKuaishouHotTopicsApi(): Promise<string[]> {
  const data = await postHttpJson<{
    data?: {
      visionHotRank?: { items?: Array<{ name?: string; id?: string }> }
    }
    errors?: Array<{ message?: string }>
  }>(
    'https://www.kuaishou.com/graphql',
    {
      operationName: 'visionHotRank',
      variables: { page: 'home' },
      query:
        'query visionHotRank($page: String) { visionHotRank(page: $page) { result items { id name hotValue } } }'
    },
    {
      headers: {
        Origin: 'https://www.kuaishou.com',
        Referer: 'https://www.kuaishou.com/'
      }
    }
  )

  if (Array.isArray(data.errors) && data.errors.length > 0) {
    throw new Error(data.errors.map((e) => e.message || 'GraphQL error').join('; '))
  }

  const items = (data.data?.visionHotRank?.items ?? [])
    .map((row) => String(row.name || row.id || '').trim())
    .filter(Boolean)
  return queryRequireHotItems(items)
}

/**
 * 腾讯新闻热点榜（r.inews 网关）。
 * 首条常为说明文案「用户最关注的热点…」，需跳过。
 */
async function queryTencentHotTopicsApi(): Promise<string[]> {
  const data = await queryHttpJson<{
    ret?: number
    idlist?: Array<{ newslist?: Array<{ title?: string }> }>
  }>('https://r.inews.qq.com/gw/event/hot_ranking_list?page_size=50', {
    headers: { Referer: 'https://news.qq.com/' }
  })

  if (data.ret != null && data.ret !== 0) {
    throw new Error(`腾讯新闻接口 ret=${data.ret}`)
  }

  const newsList = data.idlist?.[0]?.newslist ?? []
  const items = newsList
    .map((row) => String(row.title || '').trim())
    .filter((title) => title && !title.includes('用户最关注的热点'))
  return queryRequireHotItems(items)
}

/**
 * 从今日热榜 HTML 中抽取榜单条目标题。
 * 为什么：站内榜单页（含 /hot 榜中榜与各 /n/{hashid} 子榜）统一用 itemid 锚文本承载标题。
 */
export function queryParseTophubHtmlTitles(html: string): string[] {
  const items: string[] = []
  const re = /itemid="[^"]*">([^<]+)<\/a>/g
  let match: RegExpExecArray | null
  while ((match = re.exec(html)) !== null) {
    const title = match[1].replace(/\s+/g, ' ').trim()
    if (title.length >= 2 && title.length <= 120) {
      items.push(title)
    }
  }
  return items
}

/**
 * 拉取 Tophub 页面（榜中榜或指定子榜）并解析标题。
 * @param pathOrUrl `/hot`、`/n/{hashid}` 或完整 URL
 */
async function queryTophubPageTitles(pathOrUrl: string): Promise<string[]> {
  const url = pathOrUrl.startsWith('http')
    ? pathOrUrl
    : `https://tophub.today${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`
  const res = await queryHttp(url, {
    headers: {
      Referer: 'https://tophub.today/',
      Accept: 'text/html,application/xhtml+xml,*/*'
    },
    timeoutMs: 30_000,
    retries: 1
  })
  const html = await res.text()
  return queryRequireHotItems(queryParseTophubHtmlTitles(html))
}

/** 今日热榜榜中榜：一站聚合全网高热 */
async function queryTophubHotTopicsApi(): Promise<string[]> {
  return queryTophubPageTitles('/hot')
}

/**
 * 指定平台在 Tophub 上的子榜（聚合兜底）。
 * 为什么：不想挨个适配难爬站时，用 Tophub 对应子榜即可拿到结构化标题列表。
 */
async function queryTophubBoardForSource(source: HotTopicSource): Promise<string[]> {
  const boardId = TOPHUB_BOARD_IDS[source]
  if (!boardId) {
    throw new Error(`${source} 无对应 Tophub 子榜`)
  }
  return queryTophubPageTitles(`/n/${boardId}`)
}

/** 无头浏览器兜底：打开对应榜单页，抽取可见热点标题。 */
async function queryHotTopicsViaBrowser(source: HotTopicSource): Promise<string[]> {
  const meta = HOT_SOURCE_META[source]
  const browser = getBrowserService()
  await browser.navigate(meta.pageUrl, 'headless')
  // 快手/腾讯首页动态块更多，多等一会再抽文本
  const waitMs = source === 'tophub' || source === 'kuaishou' || source === 'tencent' ? 3500 : 2000
  await browser.wait({ ms: waitMs }, 'headless')

  if (source === 'tophub') {
    const page = browser.getPage('headless')
    if (page) {
      const domTitles = await page
        .evaluate(() => {
          const out: string[] = []
          for (const el of Array.from(document.querySelectorAll('a[itemid]'))) {
            const text = (el.textContent || '').replace(/\s+/g, ' ').trim()
            if (text.length >= 2 && text.length <= 120) out.push(text)
          }
          return out
        })
        .catch(() => [] as string[])
      try {
        return queryRequireHotItems(domTitles)
      } catch {
        // 继续走通用纯文本抽取
      }
    }
  }

  const text = await browser.extractText({ maxLength: 30_000 }, 'headless')
  const lines = text
    .split(/\n+/)
    .map((l) => l.replace(/^\d+[\s.、]*/, '').trim())
    .filter((l) => l.length >= 2 && l.length <= 50 && !meta.noise.test(l))
  return queryRequireHotItems(lines)
}

/**
 * 按来源组装 API 拉取函数列表（按优先级）。
 *
 * 策略摘要：
 * - weibo：AJAX → Tophub 微博子榜
 * - baidu：board API → 页内 s-data JSON → Tophub 百度子榜
 * - douyin：公开接口 → Tophub 抖音子榜
 * - kuaishou：Tophub 快手子榜优先 → GraphQL 次选（官网反爬最强）
 * - tencent：inews 热榜网关 → Tophub 腾讯子榜
 * - tophub：榜中榜 /hot
 */
function queryApiFetchers(source: HotTopicSource): Array<() => Promise<string[]>> {
  switch (source) {
    case 'weibo':
      return queryWithRequestGap([
        queryWeiboHotTopicsApi,
        () => queryTophubBoardForSource('weibo')
      ])
    case 'baidu':
      return queryWithRequestGap([
        queryBaiduHotTopicsApi,
        queryBaiduHotTopicsHtml,
        () => queryTophubBoardForSource('baidu')
      ])
    case 'douyin':
      return queryWithRequestGap([
        queryDouyinHotTopicsApi,
        () => queryTophubBoardForSource('douyin')
      ])
    case 'kuaishou':
      // 快手官网不宜作为主路径：聚合站优先，GraphQL 仅作补充
      return queryWithRequestGap([
        () => queryTophubBoardForSource('kuaishou'),
        queryKuaishouHotTopicsApi
      ])
    case 'tencent':
      return queryWithRequestGap([
        queryTencentHotTopicsApi,
        () => queryTophubBoardForSource('tencent')
      ])
    case 'tophub':
      return [queryTophubHotTopicsApi]
  }
}

function isHotTopicSource(value: string): value is HotTopicSource {
  return (HOT_SOURCE_LIST as string[]).includes(value)
}

/**
 * 拉取今日热搜：公开接口 / 静态 HTML / 聚合站优先，失败再无头浏览器。
 * 成功/失败都不抛到流程外：通过 @@workflow_ctx@@ 写入 hotTopicsOk 等字段。
 *
 * 推荐用法：
 * - 日常监控：weibo + baidu，或单源 tophub（一站聚合）
 * - 全网省心：只调 tophub
 * - 抖音/快手：可用对应 source；快手实际优先走 Tophub 子榜
 */
export const fetchHotTopicsTool: AgentTool = {
  name: 'fetch_hot_topics',
  description:
    '获取今日热点榜单。source：weibo（微博）、baidu（百度）、douyin（抖音）、' +
    'kuaishou（快手）、tencent（腾讯新闻）、tophub（今日热榜榜中榜，聚合全网，推荐综合调研首选）。' +
    '日常建议优先 weibo/baidu/tophub；快手官网反爬强，内部会优先走 Tophub 子榜。' +
    '仅抓取公开榜单标题，控制请求频率；API/HTML 失败时再无头浏览器兜底。' +
    '成功时写入 context.hotTopicsOk=1 与 hotTopics 文本；失败时 hotTopicsOk=0。',
  permission: 'safe',
  parameters: {
    type: 'object',
    properties: {
      source: {
        type: 'string',
        enum: HOT_SOURCE_LIST,
        description:
          '热点来源：推荐 tophub（聚合）/ weibo / baidu；也可 douyin / kuaishou / tencent'
      },
      maxCount: {
        type: 'number',
        description: '最多返回条数，默认 20，最大 30'
      }
    },
    required: ['source']
  },
  async execute(args) {
    const sourceRaw = String(args.source ?? '').trim()
    const maxCount = Math.min(30, Math.max(3, Number(args.maxCount ?? 20) || 20))
    if (!isHotTopicSource(sourceRaw)) {
      return queryEncodeWorkflowCtxResult(
        `source 必须是 ${HOT_SOURCE_LIST.join(' | ')}`,
        {
          hotTopicsOk: '0',
          hotSource: sourceRaw,
          hotTopics: ''
        }
      )
    }

    const source = sourceRaw
    const label = HOT_SOURCE_META[source].label
    // 快手官网无头抓取极易触发滑块，仅保留 API/聚合路径
    const browserScraper =
      source === 'kuaishou' ? undefined : () => queryHotTopicsViaBrowser(source)

    const result = await queryWithFallback({
      apiFetchers: queryApiFetchers(source),
      browserScraper,
      failLabel: `获取${label}失败`,
      formatSuccess: (items, src) => {
        const text = queryFormatList(items.slice(0, maxCount), label)
        return src === 'browser' ? `${text}\n（来源：无头浏览器兜底）` : text
      }
    })

    if (!result.ok || !result.data) {
      return queryEncodeWorkflowCtxResult(result.message, {
        hotTopicsOk: '0',
        hotSource: source,
        hotTopics: '',
        hotFetchSource: result.source
      })
    }

    // formatSuccess 已把展示文案写入 message
    return queryEncodeWorkflowCtxResult(result.message, {
      hotTopicsOk: '1',
      hotSource: source,
      hotTopics: result.message,
      hotFetchSource: result.source
    })
  }
}
