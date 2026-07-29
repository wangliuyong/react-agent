import { describe, expect, it } from 'vitest'
import {
  queryDefaultCollectPrompt,
  queryIsReplaceableCollectPrompt,
  queryMergeCollectPatchToContext,
  queryParseCollectJsonPatch
} from '../shared/workflow-collect-defaults'

describe('workflow-collect-defaults', () => {
  it('按类型返回默认数据采集文案', () => {
    expect(queryDefaultCollectPrompt('tool')).toContain('股票')
    expect(queryDefaultCollectPrompt('tool', 'query_ashare_realtime_analysis')).toContain(
      'symbols'
    )
    expect(queryDefaultCollectPrompt('input')).toContain('userInput')
  })

  it('空文案或上一默认值可被替换', () => {
    expect(queryIsReplaceableCollectPrompt('', 'tool')).toBe(true)
    const prev = queryDefaultCollectPrompt('agent')
    expect(queryIsReplaceableCollectPrompt(prev, 'agent')).toBe(true)
    expect(queryIsReplaceableCollectPrompt('用户自定义说明', 'agent')).toBe(false)
  })

  it('解析纯 JSON / 围栏 / 夹杂文本中的对象', () => {
    expect(queryParseCollectJsonPatch('{"symbols":"600519"}')).toEqual({
      patch: { symbols: '600519' }
    })
    expect(
      queryParseCollectJsonPatch('```json\n{"symbols":"000001","range":"today"}\n```')
    ).toEqual({ patch: { symbols: '000001', range: 'today' } })
    expect(queryParseCollectJsonPatch('结果如下 {"a":1} 结束')).toEqual({
      patch: { a: 1 }
    })
    expect(queryParseCollectJsonPatch('不是对象')).toMatchObject({
      error: expect.stringContaining('合法 JSON')
    })
  })

  it('合并 patch 时标量转字符串', () => {
    const next = queryMergeCollectPatchToContext(
      { keep: 'x' },
      { symbols: '600519', n: 1, ok: true, nested: { a: 1 } }
    )
    expect(next.keep).toBe('x')
    expect(next.symbols).toBe('600519')
    expect(next.n).toBe('1')
    expect(next.ok).toBe('true')
    expect(next.nested).toBe('{"a":1}')
  })
})
