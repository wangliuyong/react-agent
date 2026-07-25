/**
 * 判断会话是否处于执行中（仅依赖进程内 runningSessionIds）。
 * 落盘任务状态在刷新后可能短暂滞后，不可单独作为执行中依据。
 */
export function queryIsSessionRunning(
  sessionId: string,
  runningSessionIds: ReadonlySet<string>
): boolean {
  return runningSessionIds.has(sessionId)
}
