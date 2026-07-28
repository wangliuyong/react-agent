import { describe, expect, it, vi } from 'vitest'

vi.mock('../electron/main/store/workflows', () => ({
  queryWorkflow: (id: string) => {
    if (id === 'wf_a') {
      return {
        id: 'wf_a',
        title: '流程A',
        description: '',
        nodes: [
          { id: 'a1', type: 'agent', title: '步骤A1', prompt: '做A' },
          { id: 'a2', type: 'agent', title: '步骤A2', prompt: '做A2' }
        ],
        createdAt: 1,
        updatedAt: 1
      }
    }
    if (id === 'wf_b') {
      return {
        id: 'wf_b',
        title: '流程B',
        description: '',
        nodes: [
          {
            id: 'b_confirm',
            type: 'await_user',
            title: '确认发布',
            reason: '请确认后再发布'
          },
          { id: 'b1', type: 'agent', title: '步骤B1', prompt: '做B' }
        ],
        createdAt: 1,
        updatedAt: 1
      }
    }
    return null
  }
}))

import { compileWorkflowPlanToDefinition } from '../electron/main/workflow/compile-workflow-plan'
import type { PublishPlan } from '../shared/types'

describe('compileWorkflowPlanToDefinition', () => {
  it('按子流程顺序串行拼接，不在子流程之间插入确认门', () => {
    const plan: PublishPlan = {
      id: 'plan_1',
      title: '组合发布',
      description: '',
      kind: 'workflow',
      workflowIds: ['wf_a', 'wf_b'],
      subTasks: [],
      createdAt: 10,
      updatedAt: 10
    }

    const compiled = compileWorkflowPlanToDefinition(plan)
    const types = compiled.nodes.map((n) => n.type)
    const ids = compiled.nodes.map((n) => n.id)

    // 不应出现自动插入的 __gate 确认节点
    expect(ids.some((id) => id.includes('__gate'))).toBe(false)
    // 子流程按序拼接：A 的节点在前，B 的在后
    expect(types).toEqual(['agent', 'agent', 'await_user', 'agent'])
    expect(ids[0]).toContain('wf_a')
    expect(ids[2]).toBe('sub1_wf_b__b_confirm')
  })

  it('保留子流程自身的等待确认节点', () => {
    const plan: PublishPlan = {
      id: 'plan_2',
      title: '单流程',
      description: '',
      kind: 'workflow',
      workflowIds: ['wf_b'],
      subTasks: [],
      createdAt: 10,
      updatedAt: 10
    }

    const compiled = compileWorkflowPlanToDefinition(plan)
    const confirm = compiled.nodes.find((n) => n.type === 'await_user')
    expect(confirm).toBeTruthy()
    expect(confirm && 'reason' in confirm ? confirm.reason : '').toContain('请确认后再发布')
  })
})
