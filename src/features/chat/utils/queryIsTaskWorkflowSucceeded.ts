import type { Session, TaskItem } from '@shared/types'
import { querySessionType } from './querySessionType'

/** 任务项是否处于成功终态（完成或已跳过） */
function queryIsTaskTerminalSuccess(status: TaskItem['status']): boolean {
  return status === 'done' || status === 'skipped'
}

/**
 * 任务流程会话是否已全部成功执行完毕。
 * 用于在流程 / 发布 / 定时类会话完成后禁用输入区发送，避免用户误发消息干扰已结束的任务。
 */
export function queryIsTaskWorkflowSucceeded(
  session: Session | null | undefined,
  running: boolean,
  awaitUserReason: string | null
): boolean {
  if (!session || running || awaitUserReason) return false

  const tasks = session.tasks ?? []
  if (tasks.length === 0) return false

  const sessionType = querySessionType(session)
  if (sessionType === 'chat') return false

  return tasks.every((task) => queryIsTaskTerminalSuccess(task.status))
}
