import type { WorkflowRun } from '@shared/types'

/** 读：全部工作流运行记录 */
export async function queryWorkflowRuns(): Promise<WorkflowRun[]> {
  return window.api.queryWorkflowRuns()
}

/** 读：按会话取最近一次工作流运行（含节点 context） */
export async function queryLatestWorkflowRunBySession(
  sessionId: string
): Promise<WorkflowRun | null> {
  return window.api.queryLatestWorkflowRunBySession(sessionId)
}
