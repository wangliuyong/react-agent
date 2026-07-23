import { describe, expect, it } from 'vitest'
import { queryNextQuickTaskBatch } from '../src/features/chat/components/WelcomeHero/useQuickTaskBatch'
import type { QuickCard } from '../src/features/chat/components/WelcomeHero/types'

function card(title: string): QuickCard {
  return { title, desc: title, prompt: title }
}

describe('queryNextQuickTaskBatch', () => {
  it('池大于一屏时优先避开当前批次', () => {
    const pool = Array.from({ length: 16 }, (_, i) => card(`c${i}`))
    const current = pool.slice(0, 8)
    const next = queryNextQuickTaskBatch(pool, current, 8)

    expect(next).toHaveLength(8)
    const currentTitles = new Set(current.map((c) => c.title))
    expect(next.every((c) => !currentTitles.has(c.title))).toBe(true)
  })

  it('池不足一屏时返回洗牌后的全部卡片', () => {
    const pool = [card('a'), card('b'), card('c')]
    const next = queryNextQuickTaskBatch(pool, pool, 8)
    expect(next).toHaveLength(3)
    expect(new Set(next.map((c) => c.title))).toEqual(new Set(['a', 'b', 'c']))
  })
})
