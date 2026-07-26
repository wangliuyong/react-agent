import type { Session } from '@shared/types'
import { queryAreAllTasksSettled } from './queryAreAllTasksSettled'
import { querySessionType } from './querySessionType'

/**
 * 流程类会话任务已全部落定后，忽略迟到的 thinking/text 增量重新标记「执行中」。
 */
export function queryShouldIgnoreAgentStreamForSession(
  session: Session | null | undefined
): boolean {
  if (!session) return false
  const sessionType = querySessionType(session)
  if (sessionType === 'chat') return false
  return queryAreAllTasksSettled(session.tasks)
}
