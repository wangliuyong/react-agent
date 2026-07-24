import type { ChatMessage, MessageRole, Session, TaskItem, WorkflowRun } from '@shared/types'
import { queryRelatedMessagesByTask } from '@shared/session-related-messages'
import { queryNodeExecution } from '@shared/workflow-node-execution'
import type { NodeExecutionContext, NotifyContextDebug, SessionContextSummary } from '../types'

/** 关联消息区块说明：为何按角色留存对话记录 */
export const RELATED_MESSAGES_PURPOSE =
  '区分对话双方，完整留存一轮交互的输入与输出记录。'

/**
 * 消息角色 Tooltip 文案。
 * user / assistant 用于区分指令与回复；其余角色补充调试语义。
 */
export function queryMessageRoleTooltip(role: MessageRole): string | undefined {
  switch (role) {
    case 'user':
      return '代表用户下发的指令、提问'
    case 'assistant':
      return '代表 AI 助手输出的回复内容（天气简报、流程结束提示都属于这一类）'
    case 'system':
      return '系统提示或内部约束，一般不直接对用户展示'
    case 'tool':
      return '工具调用结果，供助手继续推理或写入工作流上下文'
    default:
      return undefined
  }
}

/** 将对象格式化为缩进 JSON，便于业务系统展示 */
export function formatContextJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

/** 从节点出参解析渠道通知请求快照 */
function queryNotifyDebugFromNodeOutput(
  output: Record<string, unknown>
): NotifyContextDebug | undefined {
  for (const [key, value] of Object.entries(output)) {
    if (!key.startsWith('notify_')) continue
    if (typeof value === 'string') return { summary: value }
    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>
      const summary =
        typeof record.summary === 'string' ? record.summary : String(record.summary ?? '')
      const requestPath =
        typeof record.requestPath === 'string' ? record.requestPath : undefined
      const requestBody =
        record.requestBody && typeof record.requestBody === 'object'
          ? (record.requestBody as Record<string, unknown>)
          : undefined
      const requestHeaders =
        record.requestHeaders && typeof record.requestHeaders === 'object'
          ? (record.requestHeaders as Record<string, string>)
          : undefined
      const deduped = record.deduped === true
      return { summary, requestPath, requestBody, requestHeaders, deduped }
    }
  }
  return undefined
}

/** 从 context 切片解析渠道通知节点的请求快照（兼容旧版纯字符串） */
export function queryNotifyDebugFromContextSlice(
  contextSlice: Record<string, unknown>
): NotifyContextDebug | undefined {
  for (const [key, value] of Object.entries(contextSlice)) {
    if (!key.startsWith('notify_')) continue
    if (typeof value === 'string') {
      return { summary: value }
    }
    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>
      const summary = typeof record.summary === 'string' ? record.summary : String(record.summary ?? '')
      const requestPath =
        typeof record.requestPath === 'string' ? record.requestPath : undefined
      const requestBody =
        record.requestBody && typeof record.requestBody === 'object'
          ? (record.requestBody as Record<string, unknown>)
          : undefined
      const requestHeaders =
        record.requestHeaders && typeof record.requestHeaders === 'object'
          ? (record.requestHeaders as Record<string, string>)
          : undefined
      const deduped = record.deduped === true
      return { summary, requestPath, requestBody, requestHeaders, deduped }
    }
  }
  return undefined
}

/** 从 WorkflowRun.context 中提取与任务节点 id 相关的键值 */
function queryContextSliceForTask(
  context: Record<string, unknown> | undefined,
  task: TaskItem
): Record<string, unknown> {
  if (!context) return {}
  const slice: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(context)) {
    if (
      key === task.id ||
      key.includes(task.id) ||
      key === `toast_${task.id}` ||
      (task.title && key.toLowerCase().includes(task.title.slice(0, 8).toLowerCase()))
    ) {
      slice[key] = value
    }
  }
  return slice
}

/** 构建会话级上下文摘要 */
export function querySessionContextSummary(
  session: Session,
  workflowRun: WorkflowRun | null
): SessionContextSummary {
  return {
    session,
    workflowRun,
    workflowContextJson: formatContextJson(workflowRun?.context ?? {}),
    messageCount: session.messages.length,
    taskCount: session.tasks?.length ?? 0
  }
}

/**
 * 为每个任务节点生成执行上下文：关联消息 + context 切片。
 * 无 tasks 时退化为整段对话作为单节点展示。
 */
export function queryNodeExecutionContexts(
  session: Session,
  workflowRun: WorkflowRun | null
): NodeExecutionContext[] {
  const tasks = session.tasks ?? []
  const context = workflowRun?.context
  const relatedByTask = queryRelatedMessagesByTask(session, tasks, context)

  if (tasks.length === 0) {
    return [
      {
        task: {
          id: session.id,
          title: '对话',
          status: 'done'
        },
        relatedMessages: session.messages,
        contextSlice: context ?? {},
        contextJson: formatContextJson(context ?? {}),
        nodeInput: {},
        nodeInputJson: '{}',
        nodeOutput: {},
        nodeOutputJson: '{}'
      }
    ]
  }

  return tasks.map((task) => {
    const execution = queryNodeExecution(context, task.id)
    const contextSlice =
      execution?.contextSnapshot ?? queryContextSliceForTask(context, task)
    const nodeInput = execution?.input ?? {}
    const nodeOutput = execution?.output ?? {}
    const notifyDebug =
      queryNotifyDebugFromNodeOutput(nodeOutput) ??
      queryNotifyDebugFromContextSlice(contextSlice)
    return {
      task,
      relatedMessages: relatedByTask.get(task.id) ?? [],
      contextSlice,
      contextJson: formatContextJson(contextSlice),
      nodeInput,
      nodeInputJson: formatContextJson(nodeInput),
      nodeOutput,
      nodeOutputJson: formatContextJson(nodeOutput),
      notifyDebug,
      skipped: nodeOutput.skipped === true
    }
  })
}

/** 会话类型中文标签 */
export function querySessionTypeLabel(type: Session['type'] | undefined): string {
  switch (type) {
    case 'publish':
      return '发布'
    case 'schedule':
      return '定时'
    case 'workflow':
      return '流程'
    default:
      return '对话'
  }
}

/** 任务状态 Tag 颜色 */
export function queryTaskStatusColor(
  status: TaskItem['status']
): 'default' | 'processing' | 'success' | 'error' | 'warning' {
  switch (status) {
    case 'running':
      return 'processing'
    case 'done':
      return 'success'
    case 'failed':
      return 'error'
    case 'skipped':
      return 'warning'
    default:
      return 'default'
  }
}

/** 任务状态中文 */
export function queryTaskStatusLabel(status: TaskItem['status']): string {
  switch (status) {
    case 'pending':
      return '待执行'
    case 'running':
      return '执行中'
    case 'done':
      return '已完成'
    case 'failed':
      return '失败'
    case 'skipped':
      return '已跳过'
    default:
      return status
  }
}
