/**
 * 热点多来源：校验工具参数枚举，并对抖音/快手/腾讯公开接口做连通性抽样。
 * 小红书无稳定公开 API，仅断言工具声明了 xhs（实际拉取走浏览器兜底）。
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

import { fetchHotTopicsTool } from '../electron/main/agent/tools/hot-topics'

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
  it('source 枚举包含抖音/快手/小红书/腾讯', () => {
    const props = fetchHotTopicsTool.parameters.properties as
      | Record<string, { enum?: string[] }>
      | undefined
    expect(props?.source?.enum).toEqual(
      expect.arrayContaining(['douyin', 'kuaishou', 'xhs', 'tencent', 'weibo', 'baidu'])
    )
  })

  it(
    '抖音/快手/腾讯公开 API 可拉到 ≥3 条',
    async () => {
      const ctx = queryMockToolCtx()
      const cases: Array<{ source: string; min: number }> = [
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
    60_000
  )
})
