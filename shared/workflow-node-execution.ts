/**
 * 工作流节点执行记录：写入 WorkflowRun.context，供历史对话排查入参/出参。
 */

/** context 中存放各节点执行记录的键名（内部字段，不参与模板插值） */
export const WORKFLOW_NODE_EXECUTIONS_KEY = '__nodeExecutions__' as const

/** 不参与展示与 diff 的内部 context 键 */
export const WORKFLOW_INTERNAL_CONTEXT_KEYS = new Set<string>([
  WORKFLOW_NODE_EXECUTIONS_KEY,
  '__branchKeys'
])

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
  outputOverride?: Record<string, unknown>
): Record<string, unknown> {
  const record: WorkflowNodeExecutionRecord = {
    nodeId: node.id,
    nodeType: node.type,
    title: node.title,
    contextSnapshot: queryContextSnapshotForDisplay(beforeContext),
    input,
    output: outputOverride ?? queryContextOutputDiff(beforeContext, afterContext),
    executedAt: Date.now()
  }
  return patchNodeExecution(afterContext, record)
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
