import { describe, expect, it } from 'vitest'
import type { Session } from '@shared/types'
import { queryIsTaskWorkflowSucceeded } from '../src/features/chat/utils/queryIsTaskWorkflowSucceeded'

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

describe('queryIsTaskWorkflowSucceeded', () => {
  it('流程会话全部任务完成且未执行中时返回 true', () => {
    const session = createSession({
      tasks: [
        { id: '1', title: '步骤一', status: 'done' },
        { id: '2', title: '步骤二', status: 'done' }
      ]
    })

    expect(queryIsTaskWorkflowSucceeded(session, false, null)).toBe(true)
  })

  it('仍有未完成任务时不禁用', () => {
    const session = createSession({
      tasks: [
        { id: '1', title: '步骤一', status: 'done' },
        { id: '2', title: '步骤二', status: 'failed' }
      ]
    })

    expect(queryIsTaskWorkflowSucceeded(session, false, null)).toBe(false)
  })

  it('执行中或等待用户介入时不禁用', () => {
    const session = createSession({
      tasks: [{ id: '1', title: '步骤一', status: 'done' }]
    })

    expect(queryIsTaskWorkflowSucceeded(session, true, null)).toBe(false)
    expect(queryIsTaskWorkflowSucceeded(session, false, '请确认')).toBe(false)
  })

  it('普通聊天会话即使有任务完成也不禁用', () => {
    const session = createSession({
      type: 'chat',
      title: '新对话',
      tasks: [{ id: '1', title: '子任务', status: 'done' }]
    })

    expect(queryIsTaskWorkflowSucceeded(session, false, null)).toBe(false)
  })
})
