/**
 * 热点多来源：校验工具参数枚举、HTML 解析，并对推荐公开接口做连通性抽样。
 */
import { describe, expect, it, vi } from 'vitest'
import type { ToolContext } from '../electron/main/agent/tools/types'

vi.mock('../electron/main/browser/service', () => ({
  getBrowserService: () => ({
    navigate: async () => undefined,
    wait: async () => undefined,
    extractText: async () => '',
    getPage: () => null
  })
}))

import {
  fetchHotTopicsTool,
  queryParseBaiduBoardHtml,
  queryParseTophubHtmlTitles
} from '../electron/main/agent/tools/hot-topics'

/** 单测用空 ToolContext（本工具不依赖会话侧能力） */
function queryMockToolCtx(): ToolContext {
  return {
    sessionId: 'test',
    fullAccess: true,
    attachmentPaths: [],
    emitAwaitUser: async () => ({}),
    updateTasks: () => undefined
  }
}

describe('fetch_hot_topics 多来源', () => {
  it('source 枚举包含抖音/快手/腾讯等来源', () => {
    const props = fetchHotTopicsTool.parameters.properties as
      | Record<string, { enum?: string[] }>
      | undefined
    expect(props?.source?.enum).toEqual(
      expect.arrayContaining(['douyin', 'kuaishou', 'tencent', 'weibo', 'baidu', 'tophub'])
    )
    expect(props?.source?.enum).not.toContain('xhs')
  })

  it('工具描述引导优先 tophub/weibo/baidu', () => {
    expect(fetchHotTopicsTool.description).toMatch(/tophub/)
    expect(fetchHotTopicsTool.description).toMatch(/weibo\/baidu\/tophub|weibo\/baidu/)
  })

  it('能从百度榜单页 s-data 注释解析标题', () => {
    const html = `
      <html><body>
      <!--s-data:{"data":{"cards":[{"content":[{"word":"测试热点甲"},{"word":"测试热点乙"},{"word":"测试热点丙"}]}]}}-->
      </body></html>
    `
    expect(queryParseBaiduBoardHtml(html)).toEqual(['测试热点甲', '测试热点乙', '测试热点丙'])
  })

  it('能从 Tophub HTML itemid 锚点解析标题', () => {
    const html = `
      <a itemid="1">  聚合热点一  </a>
      <a itemid="2">聚合热点二</a>
      <a itemid="3">聚合热点三</a>
    `
    expect(queryParseTophubHtmlTitles(html)).toEqual([
      '聚合热点一',
      '聚合热点二',
      '聚合热点三'
    ])
  })

  it(
    '推荐来源 weibo/baidu/tophub 与 douyin/kuaishou/tencent 可拉到 ≥3 条',
    async () => {
      const ctx = queryMockToolCtx()
      const cases: Array<{ source: string; min: number }> = [
        { source: 'tophub', min: 3 },
        { source: 'weibo', min: 3 },
        { source: 'baidu', min: 3 },
        { source: 'douyin', min: 3 },
        { source: 'kuaishou', min: 3 },
        { source: 'tencent', min: 3 }
      ]
      for (const c of cases) {
        const raw = await fetchHotTopicsTool.execute(
          { source: c.source, maxCount: 10 },
          ctx
        )
        expect(raw).toContain('@@workflow_ctx@@')
        const payload = JSON.parse(raw.replace(/^@@workflow_ctx@@/, '')) as {
          message: string
          patch: { hotTopicsOk?: string; hotSource?: string }
        }
        expect(payload.patch.hotTopicsOk).toBe('1')
        expect(payload.patch.hotSource).toBe(c.source)
        const lines = payload.message.split('\n').filter((l) => /^\d+\./.test(l))
        expect(lines.length).toBeGreaterThanOrEqual(c.min)
      }
    },
    120_000
  )
})
