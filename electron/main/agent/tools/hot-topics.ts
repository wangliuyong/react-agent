import { WORKFLOW_CTX_PREFIX } from '../../workflow/tool-result'
import { queryHttpJson } from '../../net/http-client'
import { queryWithFallback } from '../../net/data-source'
import { getBrowserService } from '../../browser/service'
import type { AgentTool } from './types'

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
      const unique = Array.from(new Set(items))
      if (unique.length >= 3) return unique.slice(0, 25)
      errors.push(`${ep.url} → 仅 ${unique.length} 条`)
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
  const unique = Array.from(new Set(items))
  if (unique.length < 3) {
    throw new Error(`百度热搜条数过少（${unique.length}）`)
  }
  return unique.slice(0, 25)
}

/**
 * 无头浏览器兜底：打开热搜页提取可见文本中的热点行。
 * 为什么：API 限流或结构变更时仍可拿到部分榜单，且不弹出浏览器窗口。
 */
async function queryHotTopicsViaBrowser(source: 'weibo' | 'baidu'): Promise<string[]> {
  const browser = getBrowserService()
  const url =
    source === 'weibo'
      ? 'https://s.weibo.com/top/summary?cate=realtimehot'
      : 'https://top.baidu.com/board?tab=realtime'
  await browser.navigate(url, 'headless')
  await browser.wait({ ms: 2000 }, 'headless')
  const text = await browser.extractText({ maxLength: 30_000 }, 'headless')
  const lines = text
    .split(/\n+/)
    .map((l) => l.replace(/^\d+[\s.、]*/, '').trim())
    .filter((l) => l.length >= 2 && l.length <= 40 && !/登录|热搜|实时|百度|微博/.test(l))
  const unique = Array.from(new Set(lines))
  if (unique.length < 3) {
    throw new Error(`无头浏览器提取热点过少（${unique.length}）`)
  }
  return unique.slice(0, 25)
}

/**
 * 拉取今日热搜：API 优先，失败再无头浏览器。
 * 成功/失败都不抛到流程外：通过 @@workflow_ctx@@ 写入 hotTopicsOk 等字段。
 */
export const fetchHotTopicsTool: AgentTool = {
  name: 'fetch_hot_topics',
  description:
    '获取今日热点榜单。source=weibo 走微博热搜，source=baidu 走百度热搜。' +
    '优先调用公开 API；API 失败时自动用无头浏览器后台抓取（不弹窗）。' +
    '成功时写入 context.hotTopicsOk=1 与 hotTopics 文本；失败时 hotTopicsOk=0。',
  permission: 'safe',
  parameters: {
    type: 'object',
    properties: {
      source: {
        type: 'string',
        enum: ['weibo', 'baidu'],
        description: '热点来源：weibo | baidu'
      },
      maxCount: {
        type: 'number',
        description: '最多返回条数，默认 20，最大 30'
      }
    },
    required: ['source']
  },
  async execute(args) {
    const source = String(args.source ?? '').trim()
    const maxCount = Math.min(30, Math.max(3, Number(args.maxCount ?? 20) || 20))
    if (source !== 'weibo' && source !== 'baidu') {
      return queryEncodeWorkflowCtxResult('source 必须是 weibo 或 baidu', {
        hotTopicsOk: '0',
        hotSource: source,
        hotTopics: ''
      })
    }

    const label = source === 'weibo' ? '微博热搜' : '百度热搜'
    const result = await queryWithFallback({
      apiFetchers: [
        source === 'weibo' ? queryWeiboHotTopicsApi : queryBaiduHotTopicsApi
      ],
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

    const items = result.data.slice(0, maxCount)
    // formatSuccess 已把展示文案写入 message
    return queryEncodeWorkflowCtxResult(result.message, {
      hotTopicsOk: '1',
      hotSource: source,
      hotTopics: result.message,
      hotFetchSource: result.source
    })
  }
}
