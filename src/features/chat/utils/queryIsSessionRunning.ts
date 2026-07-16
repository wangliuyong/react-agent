import type { Session } from '@shared/types'

/**
 * 判断会话是否处于执行中。
 * 优先使用进程内 runningSessionIds；刷新后从任务清单 running 状态恢复。
 */
export function queryIsSessionRunning(
  sessionId: string,
  runningSessionIds: ReadonlySet<string>,
  session?: Session | null
): boolean {
  if (runningSessionIds.has(sessionId)) return true
  return (session?.tasks ?? []).some((t) => t.status === 'running')
}
