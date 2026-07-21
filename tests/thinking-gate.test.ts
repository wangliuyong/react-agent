import { describe, expect, it } from 'vitest'
import {
  postThinkingReasoningComplete,
  postThinkingReasoningStart,
  queryWaitThinkingSettled
} from '../electron/main/agent/thinking-gate'

describe('thinking-gate', () => {
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
})
