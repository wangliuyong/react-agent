import type { TaskItem } from './types'

/**
 * 是否可将当前任务清单总结为技能。
 * 条件：Agent 未运行、无 await_user 挂起、至少一个 done 步骤、无 running/pending 步骤。
 */
export function queryCanSummarizeTasksToSkill(
  tasks: TaskItem[],
  running: boolean,
  awaitUserReason: string | null | undefined
): boolean {
  if (running || awaitUserReason) return false
  if (tasks.length === 0) return false

  const hasDone = tasks.some((t) => t.status === 'done')
  if (!hasDone) return false

  const hasIncomplete = tasks.some((t) => t.status === 'running' || t.status === 'pending')
  return !hasIncomplete
}

/** 成功执行步骤数量（status === done） */
export function querySuccessfulTaskCount(tasks: TaskItem[]): number {
  return tasks.filter((t) => t.status === 'done').length
}
