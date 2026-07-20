import { describe, expect, it } from 'vitest'
import { queryShouldResumeViaWorkflow } from '../src/features/chat/utils/queryShouldResumeViaWorkflow'
import type { WorkflowRun } from '../shared/types'

function mockRun(status: WorkflowRun['status']): WorkflowRun {
  return {
    id: 'run-1',
    workflowId: 'wf-1',
    sessionId: 'sess-1',
    status,
    cursorNodeId: 'node-1',
    context: {},
    createdAt: 0,
    updatedAt: 0
  }
}

describe('queryShouldResumeViaWorkflow', () => {
  it('普通聊天会话不走工作流恢复', () => {
    expect(queryShouldResumeViaWorkflow('chat', mockRun('failed'))).toBe(false)
  })

  it('流程会话在 failed/aborted/pending 时可恢复', () => {
    expect(queryShouldResumeViaWorkflow('workflow', mockRun('failed'))).toBe(true)
    expect(queryShouldResumeViaWorkflow('workflow', mockRun('aborted'))).toBe(true)
    expect(queryShouldResumeViaWorkflow('workflow', mockRun('pending'))).toBe(true)
  })

  it('流程会话在 running/awaiting_user/success 时不可恢复', () => {
    expect(queryShouldResumeViaWorkflow('workflow', mockRun('running'))).toBe(false)
    expect(queryShouldResumeViaWorkflow('workflow', mockRun('awaiting_user'))).toBe(false)
    expect(queryShouldResumeViaWorkflow('workflow', mockRun('success'))).toBe(false)
  })

  it('无 run 记录时回退为 Agent 消息恢复', () => {
    expect(queryShouldResumeViaWorkflow('workflow', null)).toBe(false)
    expect(queryShouldResumeViaWorkflow('schedule', undefined)).toBe(false)
  })
})
