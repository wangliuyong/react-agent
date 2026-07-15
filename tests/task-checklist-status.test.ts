import { describe, expect, it } from 'vitest'
import { queryChecklistTaskStatus } from '../src/features/chat/components/TaskChecklist/task-status'

describe('任务清单节点展示状态', () => {
  it('暂停执行时将原执行中节点展示为已暂停', () => {
    expect(
      queryChecklistTaskStatus('running', {
        running: false,
        canResume: true
      })
    ).toBe('paused')
  })

  it('继续执行后将暂停节点重新展示为执行中', () => {
    expect(
      queryChecklistTaskStatus('running', {
        running: true,
        canResume: false
      })
    ).toBe('running')
  })

  it('不改变非执行中节点的状态', () => {
    expect(
      queryChecklistTaskStatus('done', {
        running: false,
        canResume: true
      })
    ).toBe('done')
  })
})
