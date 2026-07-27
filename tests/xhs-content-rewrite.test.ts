import { describe, expect, it, vi, afterEach } from 'vitest'
import {
  queryRewriteXhsBody,
  queryRewriteXhsSynonyms,
  queryRewriteXhsTitle
} from '../electron/main/browser/xhs-content-rewrite'

describe('xhs-content-rewrite', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('同义词替换保留可读性', () => {
    const out = queryRewriteXhsSynonyms('收纳很实用，家里更整洁')
    expect(out).not.toBe('收纳很实用，家里更整洁')
    expect(out.length).toBeGreaterThan(5)
  })

  it('标题装饰在固定随机下可预测', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1)
    const out = queryRewriteXhsTitle('测试标题')
    expect(out).toMatch(/^(✨|干货|实测|分享)/)
  })

  it('正文改写会插入口语片段', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1)
    const out = queryRewriteXhsBody('这是一段足够长的正文，用来测试口语化。第二句也足够长。')
    expect(out).toMatch(/其实|个人觉得|亲测/)
  })
})
