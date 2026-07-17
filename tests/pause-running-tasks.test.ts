import { describe, expect, it } from 'vitest'
import { pauseRunningTasks, queryHasRunningTasks } from '../shared/pause-running-tasks'
import type { TaskItem } from '../shared/types'

describe('pauseRunningTasks', () => {
  const tasks: TaskItem[] = [
    { id: '1', title: '已完成', status: 'done' },
    { id: '2', title: '执行中', status: 'running' },
    { id: '3', title: '待执行', status: 'pending' }
  ]

  it('将 running 项重置为 pending，其余不变', () => {
    expect(pauseRunningTasks(tasks)).toEqual([
      { id: '1', title: '已完成', status: 'done' },
      { id: '2', title: '执行中', status: 'pending' },
      { id: '3', title: '待执行', status: 'pending' }
    ])
  })

  it('无 running 项时原样返回', () => {
    const doneOnly = tasks.filter((t) => t.status !== 'running')
    expect(pauseRunningTasks(doneOnly)).toEqual(doneOnly)
  })

  it('queryHasRunningTasks 仅在有 running 时为 true', () => {
    expect(queryHasRunningTasks(tasks)).toBe(true)
    expect(queryHasRunningTasks(pauseRunningTasks(tasks))).toBe(false)
  })
})
