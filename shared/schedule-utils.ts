import type { ScheduledTask, ScheduleRepeat } from './types'

const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

/** 解析 HH:mm，非法时回退 09:00 */
export function parseTimeOfDay(timeOfDay: string): { hours: number; minutes: number } {
  const match = /^(\d{1,2}):(\d{2})$/.exec(timeOfDay.trim())
  if (!match) return { hours: 9, minutes: 0 }
  const hours = Math.min(23, Math.max(0, Number(match[1])))
  const minutes = Math.min(59, Math.max(0, Number(match[2])))
  return { hours, minutes }
}

/**
 * 根据重复规则计算下次执行时间。
 * 一次性任务若 runAt 已过期则返回 null。
 */
export function computeNextRunAt(task: ScheduledTask, fromTime = Date.now()): number | null {
  if (!task.enabled) return null

  if (task.repeat === 'once') {
    if (task.runAt != null && task.runAt > fromTime) return task.runAt
    return null
  }

  const { hours, minutes } = parseTimeOfDay(task.timeOfDay)
  const next = new Date(fromTime)
  next.setSeconds(0, 0)
  next.setHours(hours, minutes, 0, 0)

  if (task.repeat === 'daily') {
    if (next.getTime() <= fromTime) {
      next.setDate(next.getDate() + 1)
    }
    return next.getTime()
  }

  if (task.repeat === 'weekly') {
    const targetWeekday = task.weekday ?? 1
    const currentWeekday = next.getDay()
    let daysToAdd = (targetWeekday - currentWeekday + 7) % 7
    if (daysToAdd === 0 && next.getTime() <= fromTime) {
      daysToAdd = 7
    }
    next.setDate(next.getDate() + daysToAdd)
    return next.getTime()
  }

  return null
}

/** 人类可读的调度摘要，用于列表与详情展示 */
export function formatScheduleSummary(task: ScheduledTask): string {
  const { hours, minutes } = parseTimeOfDay(task.timeOfDay)
  const timeLabel = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`

  if (task.repeat === 'once' && task.runAt) {
    const d = new Date(task.runAt)
    return `一次性 · ${d.toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
  }
  if (task.repeat === 'daily') {
    return `每天 ${timeLabel}`
  }
  if (task.repeat === 'weekly') {
    const day = WEEKDAY_LABELS[task.weekday ?? 1] ?? '周一'
    return `每周${day} ${timeLabel}`
  }
  return '未配置'
}

/** 下次执行时间的相对描述 */
export function formatNextRunAt(nextRunAt: number | undefined | null): string {
  if (nextRunAt == null) return '—'
  const diff = nextRunAt - Date.now()
  if (diff <= 0) return '即将执行'
  const min = Math.floor(diff / 60_000)
  if (min < 60) return `${min} 分钟后`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `${hour} 小时后`
  const day = Math.floor(hour / 24)
  return `${day} 天后`
}

export const SCHEDULE_REPEAT_OPTIONS: Array<{ value: ScheduleRepeat; label: string }> = [
  { value: 'once', label: '一次性' },
  { value: 'daily', label: '每天' },
  { value: 'weekly', label: '每周' }
]

export const WEEKDAY_OPTIONS = WEEKDAY_LABELS.map((label, value) => ({ value, label }))

/**
 * 解析定时任务累计执行次数。
 * 兼容磁盘上尚无 runCount 字段的旧任务：若曾执行过则按 1 次计。
 */
export function queryScheduledTaskRunCount(task: ScheduledTask): number {
  if (typeof task.runCount === 'number' && task.runCount >= 0) {
    return task.runCount
  }
  return task.lastRunAt != null ? 1 : 0
}

/** 触发执行前将 runCount 加一，供主进程调度器落盘 */
export function incrementScheduledTaskRunCount(task: ScheduledTask): number {
  return queryScheduledTaskRunCount(task) + 1
}

/** 定时任务卡片「执行次数」展示文案 */
export function formatScheduledTaskRunCount(task: ScheduledTask): string {
  const count = queryScheduledTaskRunCount(task)
  if (task.repeat === 'once') {
    return `${Math.min(count, 1)}/1 次`
  }
  return `${count} 次`
}
