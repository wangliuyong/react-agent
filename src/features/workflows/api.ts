import type {
  WorkflowDefinition,
  WorkflowRunStartResult
} from '@shared/types'

/** 读：全部工作流定义 */
export async function queryWorkflows(): Promise<WorkflowDefinition[]> {
  return window.api.queryWorkflows()
}

/** 读：单个工作流 */
export async function queryWorkflow(id: string): Promise<WorkflowDefinition | null> {
  return window.api.queryWorkflow(id)
}

/** 写：整对象 upsert */
export async function postWorkflow(
  workflow: WorkflowDefinition
): Promise<WorkflowDefinition> {
  return window.api.postWorkflow(workflow)
}

/** 写：删除工作流 */
export async function postDeleteWorkflow(id: string): Promise<void> {
  return window.api.postDeleteWorkflow(id)
}

/** 写：启动执行，返回 sessionId 供跳转聊天 */
export async function postRunWorkflow(workflowId: string): Promise<WorkflowRunStartResult> {
  return window.api.postRunWorkflow(workflowId)
}

/** 写：从失败/中止处继续 */
export async function postResumeWorkflow(runId: string): Promise<WorkflowRunStartResult> {
  return window.api.postResumeWorkflow(runId)
}
