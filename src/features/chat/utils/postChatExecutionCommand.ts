import type {
  PublishPlan,
  ScheduledTask,
  WorkflowDefinition
} from '@shared/types'
import { queryRunInBackground } from '@shared/schedule-utils'
import {
  normalizePublishPlan,
  normalizePublishPlanWorkflowIds
} from '@/features/publish/types'
import { queryPublishPlans } from '@/features/publish/api'
import { postRunScheduledTask, queryScheduledTasks } from '@/features/schedule/api'
import { postRunWorkflow, queryWorkflows } from '@/features/workflows/api'
import { parseChatExecutionCommand } from './parseChatExecutionCommand'
import { queryMatchByTitle } from './queryMatchByTitle'

/** 指令未命中，应继续走普通聊天 */
export type ChatExecutionNotHandled = { handled: false }

/** 指令命中但执行失败 */
export type ChatExecutionFailed = {
  handled: true
  success: false
  message: string
}

/** 定时任务已在后台执行，无需跳转会话 */
export type ChatExecutionScheduleBackground = {
  handled: true
  success: true
  kind: 'schedule'
  runInBackground: true
  message: string
}

/** 执行成功并创建/关联会话，需跳转聊天 */
export type ChatExecutionWithSession = {
  handled: true
  success: true
  kind: 'schedule' | 'publish' | 'workflow'
  runInBackground: false
  sessionId: string
  message: string
}

export type ChatExecutionCommandResult =
  | ChatExecutionNotHandled
  | ChatExecutionFailed
  | ChatExecutionScheduleBackground
  | ChatExecutionWithSession

function formatAmbiguousMessage(
  kindLabel: string,
  matches: Array<{ title: string }>
): string {
  const names = matches.map((m) => `「${m.title}」`).join('、')
  return `找到多个${kindLabel}：${names}，请使用更完整的名称`
}

function formatNotFoundMessage(kindLabel: string, name: string): string {
  return `未找到${kindLabel}「${name}」，请检查名称或在对应页面确认`
}

/** 校验发布任务是否具备执行条件 */
function queryPublishPlanRunnableError(plan: PublishPlan): string | null {
  const normalized = normalizePublishPlan(plan)
  const kind = normalized.kind ?? 'normal'
  if (kind === 'workflow') {
    if (!normalizePublishPlanWorkflowIds(normalized).length) {
      return `发布任务「${plan.title}」尚未关联子流程`
    }
    return null
  }
  if (!normalized.subTasks.length) {
    return `发布任务「${plan.title}」尚未添加子任务`
  }
  return null
}

/** 校验流程是否具备执行条件（排除发布镜像工作流） */
function queryWorkflowRunnableError(workflow: WorkflowDefinition): string | null {
  if (workflow.templateKind === 'publish') {
    return `「${workflow.title}」为发布镜像流程，请使用「执行任务${workflow.title}」`
  }
  if (!workflow.nodes.length) {
    return `流程「${workflow.title}」尚未添加步骤`
  }
  if (!workflow.title.trim()) {
    return '流程标题不能为空'
  }
  return null
}

/**
 * 尝试将聊天消息解析为执行指令并调用既有 API。
 * 仅负责解析与 API 调用，会话跳转由调用方（useSessionStore）处理。
 */
export async function postChatExecutionCommand(
  content: string
): Promise<ChatExecutionCommandResult> {
  const command = parseChatExecutionCommand(content)
  if (!command) return { handled: false }

  const { kind, name } = command

  if (kind === 'schedule') {
    const tasks = await queryScheduledTasks()
    const matches = queryMatchByTitle(tasks, name)
    if (matches.length === 0) {
      return { handled: true, success: false, message: formatNotFoundMessage('定时任务', name) }
    }
    if (matches.length > 1) {
      return {
        handled: true,
        success: false,
        message: formatAmbiguousMessage('定时任务', matches)
      }
    }
    return postRunScheduledTaskFromChat(matches[0])
  }

  if (kind === 'publish') {
    const plans = (await queryPublishPlans()).map(normalizePublishPlan)
    const matches = queryMatchByTitle(plans, name)
    if (matches.length === 0) {
      return { handled: true, success: false, message: formatNotFoundMessage('发布任务', name) }
    }
    if (matches.length > 1) {
      return {
        handled: true,
        success: false,
        message: formatAmbiguousMessage('发布任务', matches)
      }
    }
    const plan = matches[0]
    const runnableError = queryPublishPlanRunnableError(plan)
    if (runnableError) {
      return { handled: true, success: false, message: runnableError }
    }
    return postRunPublishPlanFromChat(plan)
  }

  const workflows = (await queryWorkflows()).filter((w) => w.templateKind !== 'publish')
  const matches = queryMatchByTitle(workflows, name)
  if (matches.length === 0) {
    return { handled: true, success: false, message: formatNotFoundMessage('流程', name) }
  }
  if (matches.length > 1) {
    return {
      handled: true,
      success: false,
      message: formatAmbiguousMessage('流程', matches)
    }
  }
  const workflow = matches[0]
  const runnableError = queryWorkflowRunnableError(workflow)
  if (runnableError) {
    return { handled: true, success: false, message: runnableError }
  }
  return postRunWorkflowFromChat(workflow)
}

/** 执行定时任务：尊重后台运行配置 */
async function postRunScheduledTaskFromChat(
  task: ScheduledTask
): Promise<ChatExecutionCommandResult> {
  const result = await postRunScheduledTask(task.id)
  if (!result) {
    return { handled: true, success: false, message: '执行失败，请检查任务配置' }
  }

  if (queryRunInBackground(task)) {
    return {
      handled: true,
      success: true,
      kind: 'schedule',
      runInBackground: true,
      message: `定时任务「${task.title}」已在后台执行`
    }
  }

  if (!result.lastSessionId) {
    return { handled: true, success: false, message: '执行失败，未创建会话' }
  }

  return {
    handled: true,
    success: true,
    kind: 'schedule',
    runInBackground: false,
    sessionId: result.lastSessionId,
    message: `已启动定时任务「${task.title}」，正在主聊天窗口执行`
  }
}

/** 执行发布任务：以计划 id 启动镜像/组合工作流 */
async function postRunPublishPlanFromChat(
  plan: PublishPlan
): Promise<ChatExecutionCommandResult> {
  try {
    const { sessionId } = await postRunWorkflow(plan.id)
    const kind = plan.kind ?? 'normal'
    return {
      handled: true,
      success: true,
      kind: 'publish',
      runInBackground: false,
      sessionId,
      message:
        kind === 'workflow'
          ? `已按子流程顺序执行发布任务「${plan.title}」`
          : `已按子任务编排执行发布任务「${plan.title}」`
    }
  } catch (err) {
    return {
      handled: true,
      success: false,
      message: err instanceof Error ? err.message : '启动发布任务失败'
    }
  }
}

/** 执行通用流程工作流 */
async function postRunWorkflowFromChat(
  workflow: WorkflowDefinition
): Promise<ChatExecutionCommandResult> {
  try {
    const { sessionId } = await postRunWorkflow(workflow.id)
    return {
      handled: true,
      success: true,
      kind: 'workflow',
      runInBackground: false,
      sessionId,
      message: `已启动流程「${workflow.title}」`
    }
  } catch (err) {
    return {
      handled: true,
      success: false,
      message: err instanceof Error ? err.message : '启动流程失败'
    }
  }
}
