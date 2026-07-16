import { describe, expect, it } from 'vitest'
import { formatRunSessionTitle } from '../shared/session-run-title'

describe('formatRunSessionTitle', () => {
  it('包含前缀、名称与执行时刻', () => {
    const title = formatRunSessionTitle('[定时]', '昨日热点推送', Date.UTC(2026, 6, 16, 0, 30))
    expect(title).toMatch(/^\[定时\] 昨日热点推送 · /)
  })
})
