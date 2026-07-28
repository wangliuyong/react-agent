import { describe, expect, it } from 'vitest'
import { queryHotNewsCarouselSlot } from '../resources/remotion/starter/src/compositions/hot-news/query-hot-news-carousel'

describe('queryHotNewsCarouselSlot', () => {
  const fps = 30
  /** 约 40s 主段（1200 帧） */
  const mainDurationInFrames = 1200

  it('多条新闻时每隔一段固定时长切换到下一条', () => {
    const count = 4
    const first = queryHotNewsCarouselSlot(0, fps, mainDurationInFrames, count)
    const next = queryHotNewsCarouselSlot(
      first.slotFrames,
      fps,
      mainDurationInFrames,
      count
    )
    const mid = queryHotNewsCarouselSlot(
      Math.floor(first.slotFrames / 2),
      fps,
      mainDurationInFrames,
      count
    )

    expect(first.index).toBe(0)
    expect(mid.index).toBe(0)
    expect(next.index).toBe(1)
    expect(first.slotFrames).toBeGreaterThanOrEqual(fps * 3)
  })

  it('播完最后一条后循环回第一条，而不是停在末条', () => {
    const count = 3
    const { slotFrames } = queryHotNewsCarouselSlot(
      0,
      fps,
      mainDurationInFrames,
      count
    )
    const afterFullPass = queryHotNewsCarouselSlot(
      slotFrames * count,
      fps,
      mainDurationInFrames,
      count
    )
    expect(afterFullPass.index).toBe(0)
  })

  it('仅 1 条时始终停在 index 0', () => {
    const a = queryHotNewsCarouselSlot(0, fps, mainDurationInFrames, 1)
    const b = queryHotNewsCarouselSlot(900, fps, mainDurationInFrames, 1)
    expect(a.index).toBe(0)
    expect(b.index).toBe(0)
  })

  it('itemCount 为 0 时仍安全返回 index 0', () => {
    const slot = queryHotNewsCarouselSlot(100, fps, mainDurationInFrames, 0)
    expect(slot.index).toBe(0)
    expect(slot.slotFrames).toBeGreaterThan(0)
  })

  it('支持 Agent 指定统一 secondsPerItem', () => {
    const slot = queryHotNewsCarouselSlot({
      frame: 0,
      fps,
      mainDurationInFrames,
      itemCount: 4,
      secondsPerItem: 5
    })
    expect(slot.slotFrames).toBe(fps * 5)
    const atBoundary = queryHotNewsCarouselSlot({
      frame: fps * 5,
      fps,
      mainDurationInFrames,
      itemCount: 4,
      secondsPerItem: 5
    })
    expect(atBoundary.index).toBe(1)
  })

  it('支持各条不同 seconds 的变长轮播', () => {
    const itemSeconds = [3, 6, 4]
    const first = queryHotNewsCarouselSlot({
      frame: 0,
      fps,
      mainDurationInFrames,
      itemCount: 3,
      secondsPerItem: 4,
      itemSeconds
    })
    expect(first.index).toBe(0)
    expect(first.slotFrames).toBe(fps * 3)

    const second = queryHotNewsCarouselSlot({
      frame: fps * 3,
      fps,
      mainDurationInFrames,
      itemCount: 3,
      secondsPerItem: 4,
      itemSeconds
    })
    expect(second.index).toBe(1)
    expect(second.slotFrames).toBe(fps * 6)

    const third = queryHotNewsCarouselSlot({
      frame: fps * 3 + fps * 6,
      fps,
      mainDurationInFrames,
      itemCount: 3,
      secondsPerItem: 4,
      itemSeconds
    })
    expect(third.index).toBe(2)
  })
})
