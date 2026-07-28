import { describe, expect, it } from 'vitest'
import {
  queryParseJsonObject,
  queryParseSelectedIndexes,
  querySelectRelevantMediaHeuristic,
  queryTopicTokens
} from '../electron/main/browser/media-relevance'

describe('media-relevance 解析与启发式', () => {
  it('解析 JSON 与代码块中的 selected', () => {
    expect(queryParseJsonObject('{"selected":[1,3],"reason":"ok"}')).toEqual({
      selected: [1, 3],
      reason: 'ok'
    })
    expect(
      queryParseJsonObject('如下：\n```json\n{"selected":[2],"reason":"主图"}\n```')
    ).toEqual({ selected: [2], reason: '主图' })
  })

  it('selected 编号 1-based 转下标并截断 maxCount', () => {
    expect(queryParseSelectedIndexes([1, 2, 2, 9, 3], 3, 2)).toEqual([0, 1])
    expect(queryParseSelectedIndexes('bad', 3, 2)).toEqual([])
  })

  it('主题词切分', () => {
    expect(queryTopicTokens('齐达内、退役 新闻')).toEqual(['齐达内', '退役', '新闻'])
  })

  it('启发式优先主题命中与视口内，排除 logo', () => {
    const result = querySelectRelevantMediaHeuristic(
      '齐达内退役',
      [
        {
          url: 'https://cdn.example.com/logo.png',
          kind: 'image',
          label: 'site logo',
          score: 999999,
          inViewport: true
        },
        {
          url: 'https://cdn.example.com/zidane.jpg',
          kind: 'image',
          label: '齐达内退役发布会',
          score: 10000,
          inViewport: true
        },
        {
          url: 'https://cdn.example.com/ad.jpg',
          kind: 'image',
          label: '广告位',
          score: 50000,
          inViewport: false
        }
      ],
      2
    )
    expect(result.strategy).toBe('heuristic')
    expect(result.urls[0]).toContain('zidane.jpg')
    expect(result.urls).not.toContain('https://cdn.example.com/logo.png')
  })
})
