import type { AgentEvent, ChatMessage, ScheduledTask } from '../../../shared/types'
import { IpcChannels } from '../../../shared/types'
import { computeNextRunAt } from '../../../shared/schedule-utils'
import { normalizeNotifyChannelIds } from '../../../shared/publish-normalize'
import { postScheduledTask, queryScheduledTask, queryScheduledTasks } from '../store/schedules'
import { queryPublishPlan } from '../store/plans'
import { querySession } from '../store/sessions'
import { queryLatestWorkflowRunBySession } from '../store/workflow-runs'
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

/** 取会话中最后一条有正文的 assistant 消息，作为任务汇报正文 */
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

/** 将 Markdown 结果转为飞书 post 富文本并推送 */
function postTaskResultFeishuNotify(args: {
  title: string
  sessionId: string
  notifyChannelIds: string[]
}): void {
  const { title, sessionId, notifyChannelIds } = args
  if (notifyChannelIds.length === 0) return
  const session = querySession(sessionId)
  const content = session ? queryLastAssistantContent(session.messages) : null
  if (!content) return
  void postScheduleTaskNotify({
    taskTitle: title,
    content,
    notifyChannelIds
  })
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

/** Agent loop emit 时调用，在 done 事件后更新定时任务状态并推送飞书富文本 */
export function handleScheduleAgentDone(event: AgentEvent): void {
  if (event.type !== 'done') return

  const success =
    event.reason === 'end_turn' ||
    event.reason === 'max_turns' ||
    event.reason === 'workflow_success'

  const taskId = sessionTaskMap.get(event.sessionId)
  if (taskId) {
    sessionTaskMap.delete(event.sessionId)
    runningTaskIds.delete(taskId)

    const task = queryScheduledTask(taskId)
    if (task) {
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

      if (success) {
        postTaskResultFeishuNotify({
          title: task.title,
          sessionId: event.sessionId,
          notifyChannelIds: normalizeNotifyChannelIds(task.notifyChannels)
        })
      }
    }
    return
  }

  // 发布工作台「流程任务」手动运行：工作流 id 即计划 id，按 plan.notifyChannels 推送 post 富文本
  if (success && event.reason === 'workflow_success') {
    const run = queryLatestWorkflowRunBySession(event.sessionId)
    const workflowId = run?.workflowId
    if (!workflowId) return
    const plan = queryPublishPlan(workflowId)
    if (!plan) return
    postTaskResultFeishuNotify({
      title: plan.title,
      sessionId: event.sessionId,
      notifyChannelIds: normalizeNotifyChannelIds(plan.notifyChannels)
    })
  }
}
