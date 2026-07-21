import type { ChatMessage, Session, TaskItem, WorkflowRun } from '@shared/types'
import type { NodeExecutionContext, NotifyContextDebug, SessionContextSummary } from '../types'

/** 将对象格式化为缩进 JSON，便于业务系统展示 */
export function formatContextJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
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

/**
 * 按任务标题 / 工具名 / 工作流步骤标记，匹配与该节点相关的消息。
 * 工作流引擎会在 Agent 步骤前写入「【工作流步骤】标题」类内容。
 */
function queryRelatedMessagesForTask(session: Session, task: TaskItem): ChatMessage[] {
  const title = task.title.trim()
  if (!title) return []

  return session.messages.filter((msg) => {
    const content = msg.content ?? ''
    if (content.includes(title)) return true
    if (content.includes(`【工作流步骤】${title}`)) return true
    if (msg.toolName && title.toLowerCase().includes(msg.toolName.toLowerCase())) return true
    if (content.includes(`等待确认：${title}`)) return true
    return false
  })
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
        contextJson: formatContextJson(context ?? {})
      }
    ]
  }

  return tasks.map((task) => {
    const contextSlice = queryContextSliceForTask(context, task)
    const notifyDebug = queryNotifyDebugFromContextSlice(contextSlice)
    return {
      task,
      relatedMessages: queryRelatedMessagesForTask(session, task),
      contextSlice,
      contextJson: formatContextJson(contextSlice),
      notifyDebug
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
