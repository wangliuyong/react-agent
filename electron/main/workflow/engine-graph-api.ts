/**
 * 供 LangGraph 工作流编译器调用的引擎薄 API。
 * 从 engine 内部实现导出，避免 compile-to-langgraph ↔ engine 循环依赖。
 */
import type {
  Session,
  TaskItemStatus,
  WorkflowDefinition,
  WorkflowNode,
  WorkflowRun
} from '../../../shared/types'
import {
  __graphApi_executeTopLevelNode,
  __graphApi_finalizeWorkflowRun,
  __graphApi_prepareWorkflowRun
} from './engine'

export interface PreparedWorkflowRun {
  workflow: WorkflowDefinition
  session: Session
  run: WorkflowRun
  specs: Array<{ id: string; title: string; parentId?: string }>
  statusMap: Map<string, TaskItemStatus>
  startIndex: number
  signal: AbortSignal
}

export function prepareWorkflowRun(
  runId: string,
  fromStart: boolean
): PreparedWorkflowRun | null {
  return __graphApi_prepareWorkflowRun(runId, fromStart)
}

export async function executeTopLevelNodeForGraph(
  sessionId: string,
  node: WorkflowNode,
  run: WorkflowRun,
  statusMap: Map<string, TaskItemStatus>,
  specs: Array<{ id: string; title: string; parentId?: string }>,
  session: Session,
  signal: AbortSignal
): Promise<WorkflowRun> {
  return __graphApi_executeTopLevelNode(
    sessionId,
    node,
    run,
    statusMap,
    specs,
    session,
    signal
  )
}

export function finalizeWorkflowRun(
  runId: string,
  sessionId: string,
  outcome: 'success' | 'aborted' | 'failed',
  errorMessage?: string
): void {
  __graphApi_finalizeWorkflowRun(runId, sessionId, outcome, errorMessage)
}
