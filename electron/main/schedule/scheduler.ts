import type { ScheduledTask, Session } from '../../../shared/types'
import { IpcChannels } from '../../../shared/types'
import { buildPublishPlanPrompt } from '../../../shared/publish-prompt'
import { computeNextRunAt } from '../../../shared/schedule-utils'
import { queryPublishPlan } from '../store/plans'
import { postSession } from '../store/sessions'
import {
  postScheduledTask,
  queryScheduledTask,
  queryScheduledTasks
} from '../store/schedules'
import { runAgentChat } from '../agent/loop'
import { getMainWindow } from '../window'
import {
  isScheduleTaskRunning,
  markScheduleTaskRunning,
  registerScheduleSession
} from './agent-hook'

/** 调度器轮询间隔（毫秒） */
const TICK_MS = 30_000

let tickTimer: ReturnType<typeof setInterval> | null = null

function emitScheduleUpdate(): void {
  const win = getMainWindow()
  if (win && !win.isDestroyed()) {
    win.webContents.send(IpcChannels.onScheduleUpdate, queryScheduledTasks())
  }
}

function createScheduleSession(task: ScheduledTask): Session {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    title: `[定时] ${task.title}`,
    messages: [],
    tasks: [],
    tokenUsed: 0,
    createdAt: now,
    updatedAt: now
  }
}

/** 根据任务配置构建 Agent 指令 */
function buildTaskPrompt(task: ScheduledTask): string | null {
  if (task.actionType === 'custom_prompt') {
    const prompt = task.customPrompt?.trim()
    return prompt || null
  }
  if (!task.publishPlanId) return null
  const plan = queryPublishPlan(task.publishPlanId)
  if (!plan) return null
  return buildPublishPlanPrompt(plan)
}

/**
 * 触发单个定时任务：创建会话并异步跑 Agent。
 * manual=true 时跳过 nextRunAt 校验（立即执行按钮）。
 */
export async function triggerScheduledTask(
  taskId: string,
  manual = false
): Promise<ScheduledTask | null> {
  const task = queryScheduledTask(taskId)
  if (!task) return null
  if (!manual && !task.enabled) return task
  if (isScheduleTaskRunning(taskId)) return task

  const prompt = buildTaskPrompt(task)
  if (!prompt) {
    const failed: ScheduledTask = {
      ...task,
      lastRunAt: Date.now(),
      lastRunStatus: 'failed',
      updatedAt: Date.now()
    }
    if (task.repeat === 'once') {
      failed.enabled = false
      failed.nextRunAt = undefined
    } else {
      failed.nextRunAt = computeNextRunAt({ ...task, enabled: true }) ?? undefined
    }
    const saved = postScheduledTask(failed)
    emitScheduleUpdate()
    return saved
  }

  markScheduleTaskRunning(taskId)
  const session = createScheduleSession(task)
  postSession(session)
  registerScheduleSession(session.id, taskId)

  const running: ScheduledTask = {
    ...task,
    lastRunAt: Date.now(),
    lastRunStatus: 'running',
    lastSessionId: session.id,
    updatedAt: Date.now()
  }
  postScheduledTask(running)
  emitScheduleUpdate()

  void runAgentChat({
    sessionId: session.id,
    content: `[定时任务自动触发]\n\n${prompt}`
  })

  return running
}

function tick(): void {
  const now = Date.now()
  const tasks = queryScheduledTasks()
  for (const task of tasks) {
    if (!task.enabled || task.lastRunStatus === 'running') continue
    if (task.nextRunAt == null || task.nextRunAt > now) continue
    void triggerScheduledTask(task.id, false)
  }
}

/** 应用就绪后启动调度器 */
export function startScheduleService(): void {
  if (tickTimer) return
  tick()
  tickTimer = setInterval(tick, TICK_MS)
}

export function stopScheduleService(): void {
  if (tickTimer) {
    clearInterval(tickTimer)
    tickTimer = null
  }
}
