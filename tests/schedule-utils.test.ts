import { describe, expect, it } from 'vitest'
import type { ScheduledTask } from '../shared/types'
import {
  computeNextRunAt,
  formatScheduleSummary,
  normalizeScheduleTimesOfDay,
  queryScheduleTimesOfDay
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

describe('schedule timesOfDay', () => {
  it('queryScheduleTimesOfDay 优先读取 timesOfDay', () => {
    expect(
      queryScheduleTimesOfDay(
        createTask({ timesOfDay: ['14:00', '09:00', '14:00'], timeOfDay: '08:00' })
      )
    ).toEqual(['09:00', '14:00'])
  })

  it('queryScheduleTimesOfDay 兼容仅 timeOfDay 的旧数据', () => {
    expect(queryScheduleTimesOfDay(createTask({ timeOfDay: '10:30' }))).toEqual(['10:30'])
  })

  it('normalizeScheduleTimesOfDay 去重并升序', () => {
    expect(normalizeScheduleTimesOfDay(['18:00', '9:05', '18:00', '08:00'])).toEqual([
      '08:00',
      '09:05',
      '18:00'
    ])
  })

  it('computeNextRunAt 在多个时刻中取最近的一次', () => {
    const from = new Date('2026-07-21T10:00:00+08:00').getTime()
    const task = createTask({ timesOfDay: ['09:00', '14:00', '18:00'] })
    const next = computeNextRunAt(task, from)
    expect(next).toBe(new Date('2026-07-21T14:00:00+08:00').getTime())
  })

  it('computeNextRunAt 当日时刻均已过后则取次日最早时刻', () => {
    const from = new Date('2026-07-21T20:00:00+08:00').getTime()
    const task = createTask({ timesOfDay: ['09:00', '14:00'] })
    const next = computeNextRunAt(task, from)
    expect(next).toBe(new Date('2026-07-22T09:00:00+08:00').getTime())
  })

  it('formatScheduleSummary 展示多个时刻', () => {
    expect(
      formatScheduleSummary(createTask({ repeat: 'daily', timesOfDay: ['09:00', '18:00'] }))
    ).toBe('每天 09:00、18:00')
  })
})
