import { describe, expect, it } from 'vitest'
import { queryAreAllTasksSettled } from '../src/features/chat/utils/queryAreAllTasksSettled'

describe('queryAreAllTasksSettled', () => {
  it('全部 done/skipped/failed 时为 true', () => {
    expect(
      queryAreAllTasksSettled([
        { id: '1', title: '开始', status: 'done' },
        { id: '2', title: '结束', status: 'done' }
      ])
    ).toBe(true)
    expect(
      queryAreAllTasksSettled([
        { id: '1', title: '分支', status: 'skipped' },
        { id: '2', title: '结束', status: 'failed' }
      ])
    ).toBe(true)
  })

  it('仍有 pending 或 running 时为 false', () => {
    expect(
      queryAreAllTasksSettled([
        { id: '1', title: '步骤', status: 'done' },
        { id: '2', title: '步骤', status: 'running' }
      ])
    ).toBe(false)
    expect(queryAreAllTasksSettled([])).toBe(false)
  })
})
