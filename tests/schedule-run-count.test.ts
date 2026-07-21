import { describe, expect, it } from 'vitest'
import type { ScheduledTask } from '../shared/types'
import {
  formatScheduledTaskRunCount,
  incrementScheduledTaskRunCount,
  queryRunInBackground,
  queryScheduledTaskRunCount
} from '../shared/schedule-utils'

function createTask(partial: Partial<ScheduledTask> = {}): ScheduledTask {
  const now = Date.now()
  return {
    id: 'task-1',
    title: '测试任务',
    description: '',
    enabled: true,
    repeat: 'daily',
    timeOfDay: '09:00',
    actionType: 'custom_prompt',
    customPrompt: 'hello',
    createdAt: now,
    updatedAt: now,
    ...partial
  }
}

describe('schedule run count', () => {
  it('queryScheduledTaskRunCount 优先读 runCount', () => {
    expect(queryScheduledTaskRunCount(createTask({ runCount: 3 }))).toBe(3)
  })

  it('queryScheduledTaskRunCount 兼容旧数据 lastRunAt', () => {
    expect(queryScheduledTaskRunCount(createTask({ lastRunAt: Date.now() }))).toBe(1)
    expect(queryScheduledTaskRunCount(createTask())).toBe(0)
  })

  it('incrementScheduledTaskRunCount 在已有计数上累加', () => {
    expect(incrementScheduledTaskRunCount(createTask({ runCount: 2 }))).toBe(3)
    expect(incrementScheduledTaskRunCount(createTask({ lastRunAt: 1 }))).toBe(2)
  })

  it('formatScheduledTaskRunCount 按重复规则展示', () => {
    expect(formatScheduledTaskRunCount(createTask({ runCount: 5 }))).toBe('5 次')
    expect(formatScheduledTaskRunCount(createTask({ repeat: 'once', runCount: 0 }))).toBe('0/1 次')
    expect(formatScheduledTaskRunCount(createTask({ repeat: 'once', runCount: 1 }))).toBe('1/1 次')
  })

  it('queryRunInBackground 缺省为 true，仅显式 false 时关闭', () => {
    expect(queryRunInBackground(createTask())).toBe(true)
    expect(queryRunInBackground(createTask({ runInBackground: true }))).toBe(true)
    expect(queryRunInBackground(createTask({ runInBackground: false }))).toBe(false)
  })
})
