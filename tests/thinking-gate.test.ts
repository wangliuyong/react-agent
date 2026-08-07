import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  postBindThinkingStallAbort,
  postResetThinkingGate,
  postThinkingReasoningComplete,
  postThinkingReasoningStart,
  queryWaitThinkingSettled
} from '../electron/main/agent/thinking-gate'

vi.mock('../electron/main/window', () => ({
  getMainWindow: () => null
}))

describe('thinking-gate', () => {
  afterEach(() => {
    postResetThinkingGate('test-session')
    postResetThinkingGate('stall-session')
    postResetThinkingGate('wait-timeout-session')
    postResetThinkingGate('reset-session')
    postBindThinkingStallAbort(() => {})
    vi.useRealTimers()
  })

  it('推理结束后才放行等待方', async () => {
    const sessionId = 'test-session'
    postThinkingReasoningStart(sessionId)

    let settled = false
    const waitPromise = queryWaitThinkingSettled(sessionId).then(() => {
      settled = true
    })

    await Promise.resolve()
    expect(settled).toBe(false)

    postThinkingReasoningComplete(sessionId)
    await waitPromise
    expect(settled).toBe(true)
  })

  it('无推理时立即放行', async () => {
    let settled = false
    await queryWaitThinkingSettled('idle-session').then(() => {
      settled = true
    })
    expect(settled).toBe(true)
  })

  it('无人 wait 时 stall 超时仍结束推理并放行后续 wait', async () => {
    vi.useFakeTimers()
    const sessionId = 'stall-session'
    let aborted = false
    postBindThinkingStallAbort((id) => {
      if (id === sessionId) aborted = true
    })

    // Start 即武装 stall；短超时模拟卡死流
    postThinkingReasoningStart(sessionId, 40)
    await vi.advanceTimersByTimeAsync(40)

    expect(aborted).toBe(true)
    // 超时后 reasoning 已结束，wait 应立即放行
    let settled = false
    await queryWaitThinkingSettled(sessionId).then(() => {
      settled = true
    })
    expect(settled).toBe(true)
  })

  it('wait 超时走 complete 而非静默清 flag，后续 wait 立即放行', async () => {
    vi.useFakeTimers()
    const sessionId = 'wait-timeout-session'
    // 很长的 stall，确保先触发 wait 侧超时
    postThinkingReasoningStart(sessionId, 60_000)

    const waitPromise = queryWaitThinkingSettled(sessionId, 30)
    await vi.advanceTimersByTimeAsync(30)
    await waitPromise

    let settled = false
    await queryWaitThinkingSettled(sessionId).then(() => {
      settled = true
    })
    expect(settled).toBe(true)
  })

  it('Reset 在推理中会放行 waiters', async () => {
    const sessionId = 'reset-session'
    postThinkingReasoningStart(sessionId)

    let settled = false
    const waitPromise = queryWaitThinkingSettled(sessionId).then(() => {
      settled = true
    })
    await Promise.resolve()
    expect(settled).toBe(false)

    postResetThinkingGate(sessionId)
    await waitPromise
    expect(settled).toBe(true)
  })
})
