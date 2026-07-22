import { describe, expect, it } from 'vitest'
import { queryMatchByTitle } from '../src/features/chat/utils/queryMatchByTitle'

describe('queryMatchByTitle', () => {
  const items = [
    { id: '1', title: '每日早报' },
    { id: '2', title: '每日早报 · 多渠道发布' },
    { id: '3', title: '飞书富文本推送' }
  ]

  it('精确匹配优先', () => {
    expect(queryMatchByTitle(items, '每日早报')).toEqual([items[0]])
  })

  it('包含匹配可找到唯一项', () => {
    expect(queryMatchByTitle(items, '飞书')).toEqual([items[2]])
  })

  it('多个匹配时全部返回供消歧', () => {
    const matches = queryMatchByTitle(items, '每日')
    expect(matches).toHaveLength(2)
  })

  it('空查询返回空数组', () => {
    expect(queryMatchByTitle(items, '   ')).toEqual([])
  })
})
