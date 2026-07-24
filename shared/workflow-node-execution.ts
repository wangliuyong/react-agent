/**
 * 工作流节点执行记录：写入 WorkflowRun.context，供历史对话排查入参/出参。
 */

import type { ChatMessage } from './types'

/** context 中存放各节点执行记录的键名（内部字段，不参与模板插值） */
export const WORKFLOW_NODE_EXECUTIONS_KEY = '__nodeExecutions__' as const

/** 不参与展示与 diff 的内部 context 键 */
export const WORKFLOW_INTERNAL_CONTEXT_KEYS = new Set<string>([
  WORKFLOW_NODE_EXECUTIONS_KEY,
  '__branchKeys'
])

/** 节点执行期间会话 messages 的下标区间 [from, to) */
export interface WorkflowNodeMessageRange {
  from: number
  to: number
}

/** 单个节点的执行快照 */
export interface WorkflowNodeExecutionRecord {
  nodeId: string
  nodeType: string
  title?: string
  /** 节点执行时可用的 context 快照（不含内部键） */
  contextSnapshot: Record<string, unknown>
  /** 节点入参（模板解析后 / 业务入参） */
  input: Record<string, unknown>
  /** 节点出参（写入全局 context 的键值） */
  output: Record<string, unknown>
  executedAt: number
  /** 本节点执行期间新增（或写入）的会话消息下标区间，供历史上下文按节点归类 */
  messageRange?: WorkflowNodeMessageRange
}

/** 从 workflow context 读取全部节点执行记录 */
export function queryNodeExecutions(
  context: Record<string, unknown> | undefined
): Record<string, WorkflowNodeExecutionRecord> {
  const raw = context?.[WORKFLOW_NODE_EXECUTIONS_KEY]
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  return raw as Record<string, WorkflowNodeExecutionRecord>
}

/** 读取指定节点的执行记录 */
export function queryNodeExecution(
  context: Record<string, unknown> | undefined,
  nodeId: string
): WorkflowNodeExecutionRecord | undefined {
  return queryNodeExecutions(context)[nodeId]
}

/** 过滤内部键，得到可展示的 context 快照 */
export function queryContextSnapshotForDisplay(
  context: Record<string, unknown>
): Record<string, unknown> {
  const snapshot: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(context)) {
    if (WORKFLOW_INTERNAL_CONTEXT_KEYS.has(key)) continue
    snapshot[key] = value
  }
  return snapshot
}

/** 计算节点执行后相对执行前新增的 context 键值（出参 diff） */
export function queryContextOutputDiff(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): Record<string, unknown> {
  const output: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(after)) {
    if (WORKFLOW_INTERNAL_CONTEXT_KEYS.has(key)) continue
    const prev = before[key]
    if (!(key in before) || JSON.stringify(prev) !== JSON.stringify(value)) {
      output[key] = value
    }
  }
  return output
}

/** 将节点执行记录合并进 context */
export function patchNodeExecution(
  context: Record<string, unknown>,
  record: WorkflowNodeExecutionRecord
): Record<string, unknown> {
  const prev = queryNodeExecutions(context)
  return {
    ...context,
    [WORKFLOW_NODE_EXECUTIONS_KEY]: {
      ...prev,
      [record.nodeId]: record
    }
  }
}

/**
 * 节点执行完成后，把入参/出参快照写入 context。
 * @param outputOverride 显式出参；缺省时用 before/after diff
 */
export function patchContextWithNodeExecution(
  beforeContext: Record<string, unknown>,
  afterContext: Record<string, unknown>,
  node: { id: string; type: string; title?: string },
  input: Record<string, unknown>,
  outputOverride?: Record<string, unknown>,
  messageRange?: WorkflowNodeMessageRange
): Record<string, unknown> {
  const record: WorkflowNodeExecutionRecord = {
    nodeId: node.id,
    nodeType: node.type,
    title: node.title,
    contextSnapshot: queryContextSnapshotForDisplay(beforeContext),
    input,
    output: outputOverride ?? queryContextOutputDiff(beforeContext, afterContext),
    executedAt: Date.now(),
    ...(messageRange ? { messageRange } : {})
  }
  return patchNodeExecution(afterContext, record)
}

/** 按节点执行记录截取关联消息 */
export function queryMessagesForNodeExecution(
  messages: ChatMessage[],
  record: WorkflowNodeExecutionRecord | undefined
): ChatMessage[] {
  if (!record?.messageRange) return []
  const { from, to } = record.messageRange
  if (from < 0 || to <= from || from >= messages.length) return []
  return messages.slice(from, Math.min(to, messages.length))
}

/** 标记节点被跳过（条件分支未选中） */
export function patchContextWithSkippedNode(
  context: Record<string, unknown>,
  node: { id: string; type: string; title?: string },
  reason: string
): Record<string, unknown> {
  const record: WorkflowNodeExecutionRecord = {
    nodeId: node.id,
    nodeType: node.type,
    title: node.title,
    contextSnapshot: queryContextSnapshotForDisplay(context),
    input: {},
    output: { skipped: true, reason },
    executedAt: Date.now()
  }
  return patchNodeExecution(context, record)
}

/**
 * 并行 tool 节点合并 context：保留各子节点执行记录，避免 __nodeExecutions__ 被覆盖。
 */
export function mergeParallelNodeContexts(
  base: Record<string, unknown>,
  childContexts: Record<string, unknown>[]
): Record<string, unknown> {
  let merged: Record<string, unknown> = { ...base }
  const executions = { ...queryNodeExecutions(base) }
  for (const ctx of childContexts) {
    for (const [key, value] of Object.entries(ctx)) {
      if (WORKFLOW_INTERNAL_CONTEXT_KEYS.has(key)) continue
      merged[key] = value
    }
    Object.assign(executions, queryNodeExecutions(ctx))
  }
  return {
    ...merged,
    [WORKFLOW_NODE_EXECUTIONS_KEY]: executions
  }
}
