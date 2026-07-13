import {
  readdirSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
  existsSync
} from 'fs'
import { join } from 'path'
import type { ScheduledTask } from '../../../shared/types'
import { computeNextRunAt } from '../../../shared/schedule-utils'
import { getSchedulesDir } from './paths'

/** 保存前根据 enabled / repeat 重算 nextRunAt */
export function normalizeScheduledTask(task: ScheduledTask): ScheduledTask {
  const next = {
    ...task,
    updatedAt: Date.now(),
    nextRunAt: computeNextRunAt(task) ?? undefined
  }
  // 一次性任务执行后 enabled 仍可能为 true，但 nextRunAt 为空表示不再调度
  return next
}

export function queryScheduledTasks(): ScheduledTask[] {
  const dir = getSchedulesDir()
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'))
  const list: ScheduledTask[] = []
  for (const file of files) {
    try {
      list.push(JSON.parse(readFileSync(join(dir, file), 'utf-8')) as ScheduledTask)
    } catch {
      // 损坏文件跳过
    }
  }
  return list.sort((a, b) => {
    const aNext = a.nextRunAt ?? Number.MAX_SAFE_INTEGER
    const bNext = b.nextRunAt ?? Number.MAX_SAFE_INTEGER
    if (aNext !== bNext) return aNext - bNext
    return b.updatedAt - a.updatedAt
  })
}

export function queryScheduledTask(id: string): ScheduledTask | null {
  const path = join(getSchedulesDir(), `${id}.json`)
  if (!existsSync(path)) return null
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as ScheduledTask
  } catch {
    return null
  }
}

export function postScheduledTask(task: ScheduledTask): ScheduledTask {
  const normalized = normalizeScheduledTask(task)
  const path = join(getSchedulesDir(), `${normalized.id}.json`)
  writeFileSync(path, JSON.stringify(normalized, null, 2), 'utf-8')
  return normalized
}

export function postDeleteScheduledTask(id: string): void {
  const path = join(getSchedulesDir(), `${id}.json`)
  if (existsSync(path)) unlinkSync(path)
}
