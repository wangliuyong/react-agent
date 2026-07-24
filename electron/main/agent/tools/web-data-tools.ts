/**
 * 通用网页数据获取：API 优先，失败再无头浏览器抓取正文。
 */
import { queryHttp } from '../../net/http-client'
import { queryWithFallback } from '../../net/data-source'
import { getBrowserService } from '../../browser/service'
import { queryEncodeWorkflowCtxResult } from './hot-topics'
import type { AgentTool } from './types'

async function queryWebDataViaHttp(url: string): Promise<string> {
  const res = await queryHttp(url, {
    timeoutMs: 20_000,
    headers: { Accept: 'text/html,application/xhtml+xml,application/json,text/plain,*/*' }
  })
  const contentType = res.headers.get('content-type') || ''
  const text = await res.text()
  if (!text.trim()) throw new Error('HTTP 响应体为空')

  // JSON 直接返回；HTML 做轻量去标签截断
  if (contentType.includes('application/json') || /^\s*[\[{]/.test(text)) {
    return text.slice(0, 12_000)
  }
  const stripped = text
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (stripped.length < 40) throw new Error('HTTP 提取正文过短，改用浏览器兜底')
  return stripped.slice(0, 12_000)
}

async function queryWebDataViaBrowser(url: string): Promise<string> {
  const browser = getBrowserService()
  await browser.navigate(url, 'headless')
  await browser.wait({ ms: 1500 }, 'headless')
  const text = await browser.extractText({ maxLength: 12_000 }, 'headless')
  if (!text.trim()) throw new Error('无头浏览器未提取到正文')
  return text.trim()
}

/**
 * 通用网页/API 数据拉取工具。
 * 优先 HTTP；失败再用无头浏览器（不弹窗）。
 */
export const queryWebDataTool: AgentTool = {
  name: 'query_web_data',
  description:
    '从指定 URL 获取网页或公开 API 文本数据。优先直接 HTTP 请求；失败时用无头浏览器后台抓取（不弹窗）。' +
    '写入 context.webDataOk / webData。热点榜单请用 fetch_hot_topics（source：weibo/baidu/douyin/kuaishou/xhs/tencent），天气用 query_weather。',
  permission: 'safe',
  parameters: {
    type: 'object',
    properties: {
      url: { type: 'string', description: '目标 URL（http/https）' },
      preferBrowser: {
        type: 'boolean',
        description: '为 true 时跳过 HTTP，直接无头浏览器（默认 false）'
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
        webDataUrl: url
      })
    }

    const preferBrowser = Boolean(args.preferBrowser)
    const result = await queryWithFallback({
      apiFetchers: preferBrowser ? [] : [() => queryWebDataViaHttp(url)],
      browserScraper: () => queryWebDataViaBrowser(url),
      failLabel: '网页数据获取失败',
      formatSuccess: (data, source) =>
        source === 'browser'
          ? `${data}\n\n（来源：无头浏览器兜底 · ${url}）`
          : `${data}\n\n（来源：HTTP · ${url}）`
    })

    if (!result.ok || result.data == null) {
      return queryEncodeWorkflowCtxResult(result.message, {
        webDataOk: '0',
        webData: '',
        webDataUrl: url,
        webDataSource: result.source
      })
    }

    return queryEncodeWorkflowCtxResult(result.message, {
      webDataOk: '1',
      webData: result.message,
      webDataUrl: url,
      webDataSource: result.source
    })
  }
}
