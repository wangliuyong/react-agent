import type { ScheduledTask, Session } from '../../../shared/types'
import { IpcChannels } from '../../../shared/types'
import { computeNextRunAt } from '../../../shared/schedule-utils'
import { queryPublishPlan } from '../store/plans'
import { queryPublishPlanRunnableWorkflowId } from '../workflow/migrate-publish'
import { postSession } from '../store/sessions'
import {
  postScheduledTask,
  queryScheduledTask,
  queryScheduledTasks
} from '../store/schedules'
import { queryWorkflow } from '../store/workflows'
import {
  bindSessionAbort,
  releaseSessionAbort,
  runAgentStep
} from '../agent/loop'
import { emitAgentEvent } from '../agent/graph-bridge'
import { postRunWorkflow } from '../workflow/engine'
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
    type: 'schedule',
    tokenUsed: 0,
    createdAt: now,
    updatedAt: now
  }
}

/**
 * 包装定时自定义指令：强调成功即止，避免模型对 notify 等工具连发两轮。
 */
function buildScheduleCustomPrompt(userPrompt: string): string {
  return [
    '[定时任务自动触发]',
    '',
    '执行约束（必须遵守）：',
    '1. 严格按下方指令完成任务；',
    '2. 任一相关工具返回成功后立即结束，不要再调用任何工具；',
    '3. 禁止对相同渠道、相同正文重复发送通知。',
    '',
    userPrompt
  ].join('\n')
}

/**
 * 自定义指令走单步 ReAct（非多智能体路由），结束后回写定时任务状态。
 */
async function postRunScheduleCustomPrompt(sessionId: string, prompt: string): Promise<void> {
  bindSessionAbort(sessionId)
  try {
    const result = await runAgentStep({
      sessionId,
      prompt: buildScheduleCustomPrompt(prompt)
    })
    const reason =
      result === 'completed'
        ? 'end_turn'
        : result === 'max_turns'
          ? 'max_turns'
          : result === 'aborted'
            ? 'aborted'
            : 'error'
    emitAgentEvent({ type: 'done', sessionId, reason })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    emitAgentEvent({ type: 'error', sessionId, message })
    emitAgentEvent({ type: 'done', sessionId, reason: 'error' })
  } finally {
    releaseSessionAbort(sessionId)
  }
}

function markTaskFailed(task: ScheduledTask): ScheduledTask {
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

/**
 * 解析定时任务应对应的工作流 id。
 * publish_plan → 计划镜像工作流；workflow → 显式 workflowId。
 */
function resolveWorkflowId(task: ScheduledTask): string | null {
  if (task.actionType === 'workflow') {
    const id = task.workflowId?.trim()
    if (!id) return null
    return queryWorkflow(id) ? id : null
  }
  if (task.actionType === 'publish_plan') {
    if (!task.publishPlanId) return null
    // 确认计划仍在；普通→镜像工作流，流程→关联 workflowId
    if (!queryPublishPlan(task.publishPlanId)) return null
    return queryPublishPlanRunnableWorkflowId(task.publishPlanId)
  }
  return null
}

/**
 * 触发单个定时任务。
 * - publish_plan / workflow：编排引擎
 * - custom_prompt：单步 ReAct（不再走多智能体聊天图，降低通知类指令连发）
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

  if (task.actionType === 'custom_prompt') {
    const prompt = task.customPrompt?.trim()
    if (!prompt) return markTaskFailed(task)

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

    void postRunScheduleCustomPrompt(session.id, prompt)
    return running
  }

  const workflowId = resolveWorkflowId(task)
  if (!workflowId) return markTaskFailed(task)

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

  try {
    await postRunWorkflow(workflowId, { session })
  } catch {
    return markTaskFailed({ ...running, lastRunStatus: 'failed' })
  }

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
