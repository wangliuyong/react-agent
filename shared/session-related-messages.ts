import type { ChatMessage, Session, TaskItem } from './types'
import {
  queryMessagesForNodeExecution,
  queryNodeExecution,
  type WorkflowNodeExecutionRecord
} from './workflow-node-execution'

const WORKFLOW_STEP_PREFIX = '【工作流步骤】'
const WORKFLOW_CONDITION_PREFIX = '【条件分支】'

/** 归一化标题，便于模糊匹配 */
function queryNormalizeTitle(title: string): string {
  return title.trim().replace(/\s+/g, ' ')
}

/** 两则标题是否指向同一步骤 */
function queryTaskTitlesMatch(a: string, b: string): boolean {
  const na = queryNormalizeTitle(a)
  const nb = queryNormalizeTitle(b)
  if (!na || !nb) return false
  return na === nb || na.includes(nb) || nb.includes(na)
}

/** 从工作流注入的 user 消息首行解析步骤标题 */
function queryWorkflowStepTitleFromContent(content: string): string | null {
  const text = content.trim()
  if (text.startsWith(WORKFLOW_STEP_PREFIX)) {
    return text.slice(WORKFLOW_STEP_PREFIX.length).split('\n')[0]?.trim() || null
  }
  if (text.startsWith(WORKFLOW_CONDITION_PREFIX)) {
    return text.slice(WORKFLOW_CONDITION_PREFIX.length).split('\n')[0]?.trim() || null
  }
  return null
}

/**
 * 根据节点执行入参（Agent prompt / 标题）在会话中定位本步起始消息下标。
 * 兼容 hideFromUi 落盘与标题微调后的旧会话。
 */
function queryMessageAnchorIndex(
  messages: ChatMessage[],
  task: TaskItem,
  execution?: WorkflowNodeExecutionRecord
): number {
  if (execution?.messageRange) {
    return execution.messageRange.from
  }

  const prompt = execution?.input?.prompt
  if (typeof prompt === 'string' && prompt.trim()) {
    const trimmedPrompt = prompt.trim()
    const firstLine = trimmedPrompt.split('\n')[0]?.trim()
    const byFull = messages.findIndex(
      (m) => m.role === 'user' && (m.content ?? '').trim() === trimmedPrompt
    )
    if (byFull >= 0) return byFull
    if (firstLine) {
      const byLine = messages.findIndex(
        (m) => m.role === 'user' && (m.content ?? '').trim().startsWith(firstLine)
      )
      if (byLine >= 0) return byLine
    }
  }

  const title = execution?.title ?? task.title
  if (title.trim()) {
    const marker = `${WORKFLOW_STEP_PREFIX}${title.trim()}`
    const byMarker = messages.findIndex((m) => (m.content ?? '').includes(marker))
    if (byMarker >= 0) return byMarker
    const bracket = `【${title.trim()}】`
    const byBracket = messages.findIndex((m) => (m.content ?? '').includes(bracket))
    if (byBracket >= 0) return byBracket
  }

  for (let i = 0; i < messages.length; i++) {
    const stepTitle = queryWorkflowStepTitleFromContent(messages[i].content ?? '')
    if (stepTitle && queryTaskTitlesMatch(stepTitle, task.title)) {
      return i
    }
  }

  return -1
}

/** 旧版启发式：按标题 / 工具名子串匹配单条消息 */
function queryRelatedMessagesLegacy(session: Session, task: TaskItem): ChatMessage[] {
  const title = task.title.trim()
  if (!title) return []

  return session.messages.filter((msg) => {
    const content = msg.content ?? ''
    if (content.includes(title)) return true
    if (content.includes(`${WORKFLOW_STEP_PREFIX}${title}`)) return true
    if (content.includes(`【${title}】`)) return true
    if (msg.toolName && title.toLowerCase().includes(msg.toolName.toLowerCase())) return true
    if (content.includes(`等待确认：${title}`)) return true
    return false
  })
}

interface TaskAnchor {
  taskId: string
  from: number
  execution?: WorkflowNodeExecutionRecord
}

/**
 * 为每个任务节点计算关联消息列表。
 * 优先使用落盘的 messageRange；否则按执行顺序与 prompt 锚点切分会话。
 */
export function queryRelatedMessagesByTask(
  session: Session,
  tasks: TaskItem[],
  workflowContext?: Record<string, unknown>
): Map<string, ChatMessage[]> {
  const messages = session.messages
  const result = new Map<string, ChatMessage[]>(tasks.map((t) => [t.id, []]))
  if (messages.length === 0 || tasks.length === 0) return result

  const anchors: TaskAnchor[] = []
  for (const task of tasks) {
    const execution = queryNodeExecution(workflowContext, task.id)
    if (execution?.messageRange) {
      anchors.push({ taskId: task.id, from: execution.messageRange.from, execution })
      continue
    }
    const from = queryMessageAnchorIndex(messages, task, execution)
    if (from >= 0) {
      anchors.push({ taskId: task.id, from, execution })
    }
  }

  anchors.sort((a, b) => a.from - b.from || (a.execution?.executedAt ?? 0) - (b.execution?.executedAt ?? 0))

  for (let i = 0; i < anchors.length; i++) {
    const { taskId, from, execution } = anchors[i]
    let to = messages.length
    if (execution?.messageRange) {
      to = execution.messageRange.to
    } else if (i + 1 < anchors.length) {
      to = anchors[i + 1].from
    }
    const slice = messages.slice(from, Math.max(from, to))
    if (slice.length > 0) {
      result.set(taskId, slice)
    }
  }

  for (const task of tasks) {
    const execution = queryNodeExecution(workflowContext, task.id)
    const ranged = queryMessagesForNodeExecution(messages, execution)
    if (ranged.length > 0) {
      result.set(task.id, ranged)
      continue
    }
    if ((result.get(task.id)?.length ?? 0) > 0) continue

    const legacy = queryRelatedMessagesLegacy(session, task)
    if (legacy.length > 0) {
      result.set(task.id, legacy)
      continue
    }

    const toolName = execution?.input?.toolName
    if (typeof toolName === 'string' && toolName) {
      const toolMsgs = messages.filter((m) => m.role === 'tool' && m.toolName === toolName)
      if (toolMsgs.length > 0) {
        result.set(task.id, toolMsgs)
      }
    }
  }

  const assigned = new Set<string>()
  for (const list of Array.from(result.values())) {
    for (const m of list) assigned.add(m.id)
  }
  const unassigned = messages.filter((m) => !assigned.has(m.id))
  if (unassigned.length > 0 && anchors.length === 0) {
    const activeTasks = tasks.filter((t) => t.status !== 'pending' && t.status !== 'skipped')
    const targets = activeTasks.length > 0 ? activeTasks : tasks
    if (targets.length === 1) {
      result.set(targets[0].id, messages)
    } else if (targets.length > 1) {
      const chunk = Math.ceil(messages.length / targets.length)
      targets.forEach((task, index) => {
        if ((result.get(task.id)?.length ?? 0) > 0) return
        result.set(task.id, messages.slice(index * chunk, (index + 1) * chunk))
      })
    }
  }

  return result
}

/** 单个任务的关联消息（供技能摘要等调用） */
export function queryRelatedMessagesForTask(
  session: Session,
  task: TaskItem,
  workflowContext?: Record<string, unknown>
): ChatMessage[] {
  return queryRelatedMessagesByTask(session, [task], workflowContext).get(task.id) ?? []
}
