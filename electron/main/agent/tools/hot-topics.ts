import { WORKFLOW_CTX_PREFIX } from '../../workflow/tool-result'
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

async function queryFetchJson(
  url: string,
  headers: Record<string, string>
): Promise<unknown> {
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      Accept: 'application/json,text/plain,*/*',
      ...headers
    },
    signal: AbortSignal.timeout(20_000)
  })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }
  return res.json() as Promise<unknown>
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
  // 过滤广告位 / 空标题
  if (title && title.length < 40 && !title.includes('http')) out.push(title)
  if (row.card_group != null) collectWeiboDescs(row.card_group, out)
  if (row.cards != null) collectWeiboDescs(row.cards, out)
  if (row.data != null) collectWeiboDescs(row.data, out)
}

/** 微博热搜：依次尝试移动端容器接口与 ajax 热搜（任一成功即可） */
async function queryWeiboHotTopics(): Promise<string[]> {
  const endpoints = [
    {
      url: 'https://m.weibo.cn/api/container/getIndex?containerid=106003type%3D25%26t%3D3%26disable_hot%3D1%26filter_type%3Drealtimehot',
      headers: { Referer: 'https://m.weibo.cn/', 'MWeibo-Pwa': '1', 'X-Requested-With': 'XMLHttpRequest' }
    },
    {
      url: 'https://weibo.com/ajax/side/hotSearch',
      headers: { Referer: 'https://weibo.com/', 'X-Requested-With': 'XMLHttpRequest' }
    }
  ] as const

  const errors: string[] = []
  for (const ep of endpoints) {
    try {
      const data = await queryFetchJson(ep.url, ep.headers)
      const items: string[] = []
      collectWeiboDescs(data, items)
      // ajax/side/hotSearch: data.realtime[].word
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
  throw new Error(errors.join('; ') || '微博热搜不可用')
}

/** 递归收集百度 board 响应里带 word/query 的条目（结构偶有嵌套） */
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

/** 百度热搜榜 board API */
async function queryBaiduHotTopics(): Promise<string[]> {
  const url = 'https://top.baidu.com/api/board?platform=wise&tab=realtime'
  const data = (await queryFetchJson(url, {
    Referer: 'https://top.baidu.com/board?tab=realtime'
  })) as { success?: boolean; data?: unknown }
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
 * 拉取今日热搜列表。
 * 成功/失败都不抛到流程外：通过 @@workflow_ctx@@ 写入 hotTopicsOk / hotTopics / hotSource，
 * 供条件边与后续 Agent（{{hotTopics}}）使用。
 */
export const fetchHotTopicsTool: AgentTool = {
  name: 'fetch_hot_topics',
  description:
    '获取今日热点榜单。source=weibo 走微博热搜，source=baidu 走百度热搜。' +
    '成功时写入 context.hotTopicsOk=1 与 hotTopics 文本；失败时 hotTopicsOk=0（不抛错，便于流程回退）。',
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

    try {
      const raw =
        source === 'weibo' ? await queryWeiboHotTopics() : await queryBaiduHotTopics()
      const items = raw.slice(0, maxCount)
      const label = source === 'weibo' ? '微博热搜' : '百度热搜'
      const text = queryFormatList(items, label)
      return queryEncodeWorkflowCtxResult(text, {
        hotTopicsOk: '1',
        hotSource: source,
        hotTopics: text
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      const failText = `获取${source === 'weibo' ? '微博' : '百度'}今日热点失败：${msg}`
      return queryEncodeWorkflowCtxResult(failText, {
        hotTopicsOk: '0',
        hotSource: source,
        hotTopics: ''
      })
    }
  }
}
