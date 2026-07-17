import { describe, expect, it } from 'vitest'
import { queryWithFallback } from '../electron/main/net/data-source'

describe('queryWithFallback', () => {
  it('优先返回第一路成功的 API', async () => {
    const result = await queryWithFallback({
      apiFetchers: [
        async () => 'from-api-0',
        async () => 'from-api-1'
      ],
      browserScraper: async () => 'from-browser'
    })
    expect(result.ok).toBe(true)
    expect(result.source).toBe('api')
    expect(result.data).toBe('from-api-0')
  })

  it('全部 API 失败后走浏览器兜底', async () => {
    const result = await queryWithFallback({
      apiFetchers: [
        async () => {
          throw new Error('api down')
        }
      ],
      browserScraper: async () => 'browser-ok',
      failLabel: '拉取失败'
    })
    expect(result.ok).toBe(true)
    expect(result.source).toBe('browser')
    expect(result.data).toBe('browser-ok')
    expect(result.errors[0]).toContain('api down')
  })

  it('全部失败时 ok=false 且汇总错误', async () => {
    const result = await queryWithFallback({
      apiFetchers: [
        async () => {
          throw new Error('a')
        }
      ],
      browserScraper: async () => {
        throw new Error('b')
      },
      failLabel: '全挂'
    })
    expect(result.ok).toBe(false)
    expect(result.source).toBe('none')
    expect(result.message).toContain('全挂')
    expect(result.errors.length).toBe(2)
  })
})
