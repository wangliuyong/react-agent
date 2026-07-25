import type { ScheduledTask, ScheduleRepeat } from './types'

const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

/** 周一～周五（Date#getDay 为 1～5） */
const WORKDAY_SET = new Set([1, 2, 3, 4, 5])

/** 解析 HH:mm，非法时回退 09:00 */
export function parseTimeOfDay(timeOfDay: string): { hours: number; minutes: number } {
  const match = /^(\d{1,2}):(\d{2})$/.exec(timeOfDay.trim())
  if (!match) return { hours: 9, minutes: 0 }
  const hours = Math.min(23, Math.max(0, Number(match[1])))
  const minutes = Math.min(59, Math.max(0, Number(match[2])))
  return { hours, minutes }
}

/** 将 HH:mm 规范为两位小时与分钟 */
export function formatTimeOfDayLabel(timeOfDay: string): string {
  const { hours, minutes } = parseTimeOfDay(timeOfDay)
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

/**
 * 归一化时刻列表：校验格式、去重、升序排列。
 * 空数组时回退 ['09:00']。
 */
export function normalizeScheduleTimesOfDay(times: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const raw of times) {
    const label = formatTimeOfDayLabel(raw)
    if (seen.has(label)) continue
    seen.add(label)
    result.push(label)
  }
  result.sort()
  return result.length > 0 ? result : ['09:00']
}

/**
 * 读取任务的有效执行时刻列表。
 * 优先 timesOfDay，否则回退到 timeOfDay 单值（兼容旧数据）。
 */
export function queryScheduleTimesOfDay(task: ScheduledTask): string[] {
  if (task.timesOfDay?.length) {
    return normalizeScheduleTimesOfDay(task.timesOfDay)
  }
  if (task.timeOfDay?.trim()) {
    return normalizeScheduleTimesOfDay([task.timeOfDay])
  }
  return ['09:00']
}

/** 是否为工作日（周一～周五） */
function isWorkday(date: Date): boolean {
  return WORKDAY_SET.has(date.getDay())
}

/**
 * 规范化生效区间：仅循环任务保留；终点不得早于起点。
 * 返回可写入实体的字段（未设置时为 undefined）。
 */
export function normalizeScheduleActiveRange(
  repeat: ScheduleRepeat,
  activeFrom?: number | null,
  activeUntil?: number | null
): { activeFrom?: number; activeUntil?: number } {
  if (repeat === 'once') return {}
  const from =
    activeFrom != null && Number.isFinite(activeFrom) ? Number(activeFrom) : undefined
  let until =
    activeUntil != null && Number.isFinite(activeUntil) ? Number(activeUntil) : undefined
  if (from != null && until != null && until < from) {
    until = from
  }
  return {
    ...(from != null ? { activeFrom: from } : {}),
    ...(until != null ? { activeUntil: until } : {})
  }
}

/** 按重复规则计算单个时刻的下次执行时间（不含生效区间裁剪） */
function computeNextRunAtForTime(
  task: ScheduledTask,
  hours: number,
  minutes: number,
  fromTime: number
): number | null {
  const next = new Date(fromTime)
  next.setSeconds(0, 0)
  next.setHours(hours, minutes, 0, 0)

  if (task.repeat === 'daily') {
    if (next.getTime() <= fromTime) {
      next.setDate(next.getDate() + 1)
    }
    return next.getTime()
  }

  if (task.repeat === 'weekdays') {
    // 最多向前找 8 天，保证覆盖「周五过后跳到下周一」
    for (let i = 0; i < 8; i++) {
      if (isWorkday(next) && next.getTime() > fromTime) {
        return next.getTime()
      }
      next.setDate(next.getDate() + 1)
      next.setHours(hours, minutes, 0, 0)
    }
    return null
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

/**
 * 根据重复规则计算下次执行时间。
 * 一次性任务若 runAt 已过期则返回 null；循环任务受 activeFrom / activeUntil 约束。
 */
export function computeNextRunAt(task: ScheduledTask, fromTime = Date.now()): number | null {
  if (!task.enabled) return null

  if (task.repeat === 'once') {
    if (task.runAt != null && task.runAt > fromTime) return task.runAt
    return null
  }

  // 生效起点尚未到达时，从起点开始推算第一次触发
  let effectiveFrom = fromTime
  if (task.activeFrom != null && task.activeFrom > effectiveFrom) {
    effectiveFrom = task.activeFrom
  }
  // 已超过生效终点则不再调度
  if (task.activeUntil != null && effectiveFrom > task.activeUntil) {
    return null
  }

  const times = queryScheduleTimesOfDay(task)
  let best: number | null = null
  for (const time of times) {
    const { hours, minutes } = parseTimeOfDay(time)
    const candidate = computeNextRunAtForTime(task, hours, minutes, effectiveFrom)
    if (candidate != null && (best == null || candidate < best)) {
      best = candidate
    }
  }

  if (best != null && task.activeUntil != null && best > task.activeUntil) {
    return null
  }
  return best
}

/** 人类可读的生效区间后缀 */
function formatActiveRangeSuffix(task: ScheduledTask): string {
  if (task.activeFrom == null && task.activeUntil == null) return ''
  const fmt = (ms: number): string =>
    new Date(ms).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
  if (task.activeFrom != null && task.activeUntil != null) {
    return ` · ${fmt(task.activeFrom)}–${fmt(task.activeUntil)}`
  }
  if (task.activeFrom != null) return ` · 自 ${fmt(task.activeFrom)}`
  return ` · 至 ${fmt(task.activeUntil!)}`
}

/** 人类可读的调度摘要，用于列表与详情展示 */
export function formatScheduleSummary(task: ScheduledTask): string {
  const timeLabel = queryScheduleTimesOfDay(task).map(formatTimeOfDayLabel).join('、')
  const range = formatActiveRangeSuffix(task)

  if (task.repeat === 'once' && task.runAt) {
    const d = new Date(task.runAt)
    return `一次性 · ${d.toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
  }
  if (task.repeat === 'daily') {
    return `每天 ${timeLabel}${range}`
  }
  if (task.repeat === 'weekdays') {
    return `工作日 ${timeLabel}${range}`
  }
  if (task.repeat === 'weekly') {
    const day = WEEKDAY_LABELS[task.weekday ?? 1] ?? '周一'
    return `每周${day} ${timeLabel}${range}`
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
  { value: 'weekdays', label: '工作日' },
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

/**
 * 是否后台执行（不向聊天窗口推送会话）。
 * 缺省 true，与产品默认「静默跑任务」一致。
 */
export function queryRunInBackground(task: ScheduledTask): boolean {
  return task.runInBackground !== false
}

/** 定时任务卡片「执行次数」展示文案 */
export function formatScheduledTaskRunCount(task: ScheduledTask): string {
  const count = queryScheduledTaskRunCount(task)
  if (task.repeat === 'once') {
    return `${Math.min(count, 1)}/1 次`
  }
  return `${count} 次`
}
