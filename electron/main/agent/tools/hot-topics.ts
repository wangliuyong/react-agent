import { WORKFLOW_CTX_PREFIX } from '../../workflow/tool-result'
import { postHttpJson, queryHttpJson } from '../../net/http-client'
import { queryWithFallback } from '../../net/data-source'
import { getBrowserService } from '../../browser/service'
import type { AgentTool } from './types'

/** 支持的热点来源标识（与工具参数 enum 保持一致） */
export type HotTopicSource =
  | 'weibo'
  | 'baidu'
  | 'douyin'
  | 'kuaishou'
  | 'xhs'
  | 'tencent'

/** 各来源展示名、榜单页 URL、浏览器文本过滤用噪声词 */
const HOT_SOURCE_META: Record<
  HotTopicSource,
  { label: string; pageUrl: string; noise: RegExp }
> = {
  weibo: {
    label: '微博热搜',
    pageUrl: 'https://s.weibo.com/top/summary?cate=realtimehot',
    noise: /登录|热搜|实时|微博|榜单/
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
  xhs: {
    label: '小红书热点',
    pageUrl: 'https://www.xiaohongshu.com/explore',
    noise: /登录|注册|小红书|发现|关注|消息|我|热门|推荐|笔记/
  },
  tencent: {
    label: '腾讯新闻热点',
    pageUrl: 'https://news.qq.com/',
    noise: /登录|腾讯|新闻|热点|推荐|客户端|下载/
  }
}

const HOT_SOURCE_LIST = Object.keys(HOT_SOURCE_META) as HotTopicSource[]

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

/** 微博热搜 API（多 endpoint） */
async function queryWeiboHotTopicsApi(): Promise<string[]> {
  const endpoints = [
    {
      url: 'https://m.weibo.cn/api/container/getIndex?containerid=106003type%3D25%26t%3D3%26disable_hot%3D1%26filter_type%3Drealtimehot',
      headers: {
        Referer: 'https://m.weibo.cn/',
        'MWeibo-Pwa': '1',
        'X-Requested-With': 'XMLHttpRequest'
      }
    },
    {
      url: 'https://weibo.com/ajax/side/hotSearch',
      headers: { Referer: 'https://weibo.com/', 'X-Requested-With': 'XMLHttpRequest' }
    }
  ] as const

  const errors: string[] = []
  for (const ep of endpoints) {
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
}

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

/**
 * 抖音热点：优先旧版公开榜单接口，失败再走 PC Web 热点 list。
 * 为什么：iesdouyin 无需 Cookie，成功率高；web 接口作第二路兜底。
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
 * 快手热点：PC 站 GraphQL visionHotRank。
 * 为什么：与首页热榜同源，无需解析整页 __APOLLO_STATE__。
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
 * 无头浏览器兜底：打开对应榜单/发现页，抽取可见热点标题。
 * 小红书无稳定公开热榜 API（需签名），因此以浏览器 DOM 为主路径。
 */
async function queryHotTopicsViaBrowser(source: HotTopicSource): Promise<string[]> {
  const meta = HOT_SOURCE_META[source]
  const browser = getBrowserService()
  await browser.navigate(meta.pageUrl, 'headless')
  await browser.wait({ ms: source === 'xhs' ? 3500 : 2000 }, 'headless')

  if (source === 'xhs') {
    const page = browser.getPage('headless')
    if (page) {
      const domTitles = await page
        .evaluate(() => {
          const selectors = [
            'a.title',
            '[class*="title"] span',
            '[class*="footer"] a',
            'section .title',
            'a[href*="/explore/"]',
            'a[href*="/search_result"]'
          ]
          const out: string[] = []
          for (const sel of selectors) {
            for (const el of Array.from(document.querySelectorAll(sel))) {
              const text = (el.textContent || '').replace(/\s+/g, ' ').trim()
              if (text.length >= 4 && text.length <= 60) out.push(text)
            }
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

/** 按来源组装 API 拉取函数列表（按优先级） */
function queryApiFetchers(source: HotTopicSource): Array<() => Promise<string[]>> {
  switch (source) {
    case 'weibo':
      return [queryWeiboHotTopicsApi]
    case 'baidu':
      return [queryBaiduHotTopicsApi]
    case 'douyin':
      return [queryDouyinHotTopicsApi]
    case 'kuaishou':
      return [queryKuaishouHotTopicsApi]
    case 'xhs':
      // 无可用公开 API：空列表 → queryWithFallback 直接走 browserScraper
      return []
    case 'tencent':
      return [queryTencentHotTopicsApi]
  }
}

function isHotTopicSource(value: string): value is HotTopicSource {
  return (HOT_SOURCE_LIST as string[]).includes(value)
}

/**
 * 拉取今日热搜：API 优先，失败再无头浏览器。
 * 成功/失败都不抛到流程外：通过 @@workflow_ctx@@ 写入 hotTopicsOk 等字段。
 */
export const fetchHotTopicsTool: AgentTool = {
  name: 'fetch_hot_topics',
  description:
    '获取今日热点榜单。source 支持 weibo（微博）、baidu（百度）、douyin（抖音）、' +
    'kuaishou（快手）、xhs（小红书）、tencent（腾讯新闻）。' +
    '优先调用公开 API；API 失败时自动用无头浏览器后台抓取（不弹窗）。' +
    '小红书公开接口不稳定时会直接走浏览器。' +
    '成功时写入 context.hotTopicsOk=1 与 hotTopics 文本；失败时 hotTopicsOk=0。',
  permission: 'safe',
  parameters: {
    type: 'object',
    properties: {
      source: {
        type: 'string',
        enum: HOT_SOURCE_LIST,
        description:
          '热点来源：weibo | baidu | douyin | kuaishou | xhs | tencent'
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
    const result = await queryWithFallback({
      apiFetchers: queryApiFetchers(source),
      browserScraper: () => queryHotTopicsViaBrowser(source),
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
