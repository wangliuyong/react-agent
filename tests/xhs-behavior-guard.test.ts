import { afterEach, describe, expect, it, vi } from 'vitest'
import { queryXhsPublishWindowBlock } from '../electron/main/store/xhs-behavior-guard'

describe('xhs-behavior-guard', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('仅允许 8:00～23:00', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-10T07:30:00'))
    expect(queryXhsPublishWindowBlock()).toMatch(/8:00～23:00/)
    vi.setSystemTime(new Date('2026-08-10T08:00:00'))
    expect(queryXhsPublishWindowBlock()).toBeNull()
    vi.setSystemTime(new Date('2026-08-10T12:00:00'))
    expect(queryXhsPublishWindowBlock()).toBeNull()
    vi.setSystemTime(new Date('2026-08-10T23:30:00'))
    expect(queryXhsPublishWindowBlock()).toMatch(/8:00～23:00/)
  })
})
