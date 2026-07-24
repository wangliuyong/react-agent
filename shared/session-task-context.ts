import type { ChatMessage, Session, TaskItem } from './types'
import { queryRelatedMessagesForTask } from './session-related-messages'

/** 任务执行上下文：关联消息 + 工作流 context 切片 */
export interface TaskExecutionContext {
  task: TaskItem
  relatedMessages: ChatMessage[]
  contextSlice: Record<string, unknown>
}

/** 将对象格式化为缩进 JSON，便于 LLM 阅读 */
export function formatContextJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
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

/** 筛选成功执行的任务（仅 status === done，不含失败/跳过/待执行） */
export function querySuccessfulTasks(tasks: TaskItem[]): TaskItem[] {
  return tasks.filter((task) => task.status === 'done')
}

/**
 * 为每个成功任务节点生成执行上下文：关联消息 + context 切片。
 * 仅包含 status === done 的步骤，剔除失败与未执行项。
 */
export function querySuccessfulTaskExecutionContexts(
  session: Session,
  workflowContext?: Record<string, unknown>
): TaskExecutionContext[] {
  const successfulTasks = querySuccessfulTasks(session.tasks ?? [])
  return successfulTasks.map((task) => ({
    task,
    relatedMessages: queryRelatedMessagesForTask(session, task, workflowContext),
    contextSlice: queryContextSliceForTask(workflowContext, task)
  }))
}

/** 将消息列表压缩为 LLM 可读的文本摘要（限制长度避免超 token） */
export function formatMessagesForLlm(messages: ChatMessage[], maxChars = 4000): string {
  const lines: string[] = []
  let total = 0

  for (const msg of messages) {
    const role = msg.role === 'user' ? '用户' : msg.role === 'assistant' ? '助手' : msg.role
    const toolSuffix = msg.toolName ? ` [工具: ${msg.toolName}]` : ''
    const content = (msg.content ?? '').trim()
    if (!content) continue

    const line = `- ${role}${toolSuffix}: ${content.slice(0, 800)}`
    if (total + line.length > maxChars) {
      lines.push('- …（后续消息已截断）')
      break
    }
    lines.push(line)
    total += line.length
  }

  return lines.length > 0 ? lines.join('\n') : '（无关联对话）'
}
