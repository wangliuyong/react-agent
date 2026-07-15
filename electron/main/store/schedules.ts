import {
  readdirSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
  existsSync
} from 'fs'
import { join } from 'path'
import type { ScheduledTask } from '../../../shared/types'
import { createBuiltinScheduledTasks } from '../../../shared/builtin-seeds'
import { computeNextRunAt } from '../../../shared/schedule-utils'
import { postInitPublishPlans } from './plans'
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

/**
 * 写：导入尚未存在的内置定时任务（按固定 id 去重）。
 * 定时任务可能关联发布计划，会先确保内置计划已写入。
 */
export function postImportBuiltinScheduledTasks(): ScheduledTask[] {
  // 关联的 publish_plan 依赖内置发布计划 id
  postInitPublishPlans()
  const existingIds = new Set(queryScheduledTasks().map((task) => task.id))
  for (const task of createBuiltinScheduledTasks()) {
    if (!existingIds.has(task.id)) {
      postScheduledTask(task)
    }
  }
  return queryScheduledTasks()
}

/**
 * 写：首次启动或磁盘为空时写入内置定时任务。
 * 已有用户数据时不覆盖。
 */
export function postInitScheduledTasks(): ScheduledTask[] {
  if (queryScheduledTasks().length > 0) {
    return queryScheduledTasks()
  }
  return postImportBuiltinScheduledTasks()
}
