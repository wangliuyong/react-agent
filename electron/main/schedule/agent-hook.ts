import type { AgentEvent, ScheduledTask } from '../../../shared/types'
import { IpcChannels } from '../../../shared/types'
import { computeNextRunAt } from '../../../shared/schedule-utils'
import { postScheduledTask, queryScheduledTask, queryScheduledTasks } from '../store/schedules'
import { getMainWindow } from '../window'

/** 会话 id → 定时任务 id */
const sessionTaskMap = new Map<string, string>()

/** 正在执行中的任务 id */
const runningTaskIds = new Set<string>()

function emitScheduleUpdate(): void {
  const win = getMainWindow()
  if (win && !win.isDestroyed()) {
    win.webContents.send(IpcChannels.onScheduleUpdate, queryScheduledTasks())
  }
}

/** 登记本次定时触发创建的会话，供 Agent 结束时回写状态 */
export function registerScheduleSession(sessionId: string, taskId: string): void {
  sessionTaskMap.set(sessionId, taskId)
  runningTaskIds.add(taskId)
}

export function isScheduleTaskRunning(taskId: string): boolean {
  return runningTaskIds.has(taskId)
}

export function markScheduleTaskRunning(taskId: string): void {
  runningTaskIds.add(taskId)
}

/** Agent loop emit 时调用，在 done 事件后更新定时任务状态 */
export function handleScheduleAgentDone(event: AgentEvent): void {
  if (event.type !== 'done') return
  const taskId = sessionTaskMap.get(event.sessionId)
  if (!taskId) return

  sessionTaskMap.delete(event.sessionId)
  runningTaskIds.delete(taskId)

  const task = queryScheduledTask(taskId)
  if (!task) return

  const success = event.reason === 'end_turn' || event.reason === 'max_turns'
  const next: ScheduledTask = {
    ...task,
    lastRunStatus: success ? 'success' : 'failed',
    updatedAt: Date.now()
  }

  if (task.repeat === 'once') {
    next.enabled = false
    next.nextRunAt = undefined
  } else {
    next.nextRunAt = computeNextRunAt({ ...next, enabled: next.enabled }) ?? undefined
  }

  postScheduledTask(next)
  emitScheduleUpdate()
}
