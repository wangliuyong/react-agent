/**
 * web_search：Bing / 百度 HTML 解析与工具描述断言。
 */
import { describe, expect, it, vi } from 'vitest'
import type { ToolContext } from '../electron/main/agent/tools/types'

vi.mock('../electron/main/browser/service', () => ({
  getBrowserService: () => ({
    navigate: async () => undefined,
    wait: async () => undefined,
    getPage: () => null
  })
}))

import {
  queryParseBaiduSearchHtml,
  queryParseBingSearchHtml,
  queryStripHtmlText,
  webSearchTool
} from '../electron/main/agent/tools/web-search-tools'

function queryMockToolCtx(): ToolContext {
  return {
    sessionId: 'test',
    fullAccess: true,
    attachmentPaths: [],
    emitAwaitUser: async () => ({}),
    updateTasks: () => undefined
  }
}

describe('web_search', () => {
  it('工具描述声明 Bing 优先、百度兜底', () => {
    expect(webSearchTool.name).toBe('web_search')
    expect(webSearchTool.description).toMatch(/Bing/)
    expect(webSearchTool.description).toMatch(/百度/)
  })

  it('queryStripHtmlText 清洗标签与实体', () => {
    expect(queryStripHtmlText('<b>你好&amp;世界</b>')).toBe('你好&世界')
  })

  it('能从 Bing b_algo 块解析标题与链接', () => {
    const html = `
      <ul>
        <li class="b_algo">
          <h2><a href="https://example.com/a">标题甲</a></h2>
          <div class="b_caption"><p class="b_lineclamp2">摘要甲内容</p></div>
        </li>
        <li class="b_algo">
          <h2><a href="https://example.com/b">标题乙</a></h2>
          <div class="b_caption"><p class="b_lineclamp2">摘要乙内容</p></div>
        </li>
      </ul>
    `
    expect(queryParseBingSearchHtml(html)).toEqual([
      { title: '标题甲', url: 'https://example.com/a', snippet: '摘要甲内容' },
      { title: '标题乙', url: 'https://example.com/b', snippet: '摘要乙内容' }
    ])
  })

  it('能从百度 c-container 解析 mu 真链与标题', () => {
    const html = `
      <div class="result c-container" mu="https://news.example.com/1">
        <h3><a href="http://www.baidu.com/link?url=xxx">百度结果一</a></h3>
        <span class="c-abstract">这是摘要一</span>
      </div>
      <div class="result-op c-container" mu="https://news.example.com/2">
        <h3><a href="http://www.baidu.com/link?url=yyy">百度结果二</a></h3>
        <span class="c-abstract">这是摘要二</span>
      </div>
    `
    expect(queryParseBaiduSearchHtml(html)).toEqual([
      {
        title: '百度结果一',
        url: 'https://news.example.com/1',
        snippet: '这是摘要一'
      },
      {
        title: '百度结果二',
        url: 'https://news.example.com/2',
        snippet: '这是摘要二'
      }
    ])
  })

  it(
    '真实网络：web_search 至少返回 2 条（Bing 或百度）',
    async () => {
      const out = await webSearchTool.execute(
        { query: '人工智能', maxResults: 5 },
        queryMockToolCtx()
      )
      expect(out).not.toMatch(/^网络搜索失败/)
      expect(out).toMatch(/引擎：(Bing|百度)/)
      // 至少两条编号结果
      expect(out).toMatch(/1\. /)
      expect(out).toMatch(/2\. /)
    },
    60_000
  )
})
