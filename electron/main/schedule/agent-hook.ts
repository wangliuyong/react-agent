import type { AgentEvent, ChatMessage, ScheduledTask } from '../../../shared/types'
import { IpcChannels } from '../../../shared/types'
import { computeNextRunAt } from '../../../shared/schedule-utils'
import { normalizeNotifyChannelIds } from '../../../shared/publish-normalize'
import { postScheduledTask, queryScheduledTask, queryScheduledTasks } from '../store/schedules'
import { querySession } from '../store/sessions'
import { postScheduleTaskNotify } from '../notify/send'
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

/** 取会话中最后一条有正文的 assistant 消息，作为定时任务汇报正文 */
function queryLastAssistantContent(messages: ChatMessage[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]
    if (msg.role === 'assistant') {
      const text = msg.content?.trim()
      if (text) return text
    }
  }
  return null
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

  // workflow_success：编排引擎整流程成功；end_turn/max_turns：单次 ReAct
  const success =
    event.reason === 'end_turn' ||
    event.reason === 'max_turns' ||
    event.reason === 'workflow_success'
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

  // 成功后自动推送飞书富文本（主进程转换 Markdown，无需 Agent 再调 notify_message）
  if (success) {
    const notifyIds = normalizeNotifyChannelIds(task.notifyChannels)
    if (notifyIds.length > 0) {
      const session = querySession(event.sessionId)
      const content = session ? queryLastAssistantContent(session.messages) : null
      if (content) {
        void postScheduleTaskNotify({
          taskTitle: task.title,
          content,
          notifyChannelIds: notifyIds
        })
      }
    }
  }
}
