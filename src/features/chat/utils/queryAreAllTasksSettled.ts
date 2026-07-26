import type { TaskItem } from '@shared/types'

/**
 * 任务清单是否已全部进入终态（无 pending / running）。
 * 用于流程/定时/发布会话在结束节点完成后复位 UI 执行态。
 */
export function queryAreAllTasksSettled(tasks: TaskItem[] | undefined | null): boolean {
  if (!tasks?.length) return false
  return tasks.every(
    (t) => t.status === 'done' || t.status === 'skipped' || t.status === 'failed'
  )
}
