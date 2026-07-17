import type { TaskItem } from './types'

/**
 * 将任务清单中仍为 running 的项重置为 pending。
 * 用于用户主动中断后落盘，避免刷新页面从 running 误判为仍在执行。
 */
export function pauseRunningTasks(tasks: TaskItem[]): TaskItem[] {
  return tasks.map((t) =>
    t.status === 'running' ? { ...t, status: 'pending' as const } : t
  )
}

/** 任务清单是否包含 running 项（中断前需重置） */
export function queryHasRunningTasks(tasks: TaskItem[]): boolean {
  return tasks.some((t) => t.status === 'running')
}
