import { describe, expect, it } from 'vitest'
import type { Session } from '@shared/types'
import { queryShouldMarkExternalRunRunning } from '../src/features/chat/utils/queryShouldMarkExternalRunRunning'

function createSession(partial: Partial<Session>): Session {
  return {
    id: 's1',
    title: '[流程] 测试',
    messages: [],
    tasks: [],
    type: 'workflow',
    tokenUsed: 0,
    createdAt: 0,
    updatedAt: 0,
    ...partial
  }
}

describe('queryShouldMarkExternalRunRunning', () => {
  it('会话尚未加载时仍标记为执行中', () => {
    expect(queryShouldMarkExternalRunRunning(null)).toBe(true)
  })

  it('任务已全部结束时不再标记执行中', () => {
    expect(
      queryShouldMarkExternalRunRunning(
        createSession({
          tasks: [
            { id: '1', title: '开始', status: 'done' },
            { id: '2', title: '结束', status: 'done' }
          ]
        })
      )
    ).toBe(false)
  })

  it('已有流程结束文案时不再标记执行中', () => {
    expect(
      queryShouldMarkExternalRunRunning(
        createSession({
          messages: [
            {
              id: 'm1',
              role: 'assistant',
              content: '流程执行完毕。',
              createdAt: 1
            }
          ]
        })
      )
    ).toBe(false)
  })

  it('仍有未完成任务时标记执行中', () => {
    expect(
      queryShouldMarkExternalRunRunning(
        createSession({
          tasks: [
            { id: '1', title: '开始', status: 'done' },
            { id: '2', title: '步骤', status: 'running' }
          ]
        })
      )
    ).toBe(true)
  })
})
