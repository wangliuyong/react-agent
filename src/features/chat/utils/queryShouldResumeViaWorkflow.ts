import type { SessionType, WorkflowRun, WorkflowRunStatus } from '@shared/types'

/** 工作流运行实例允许通过引擎恢复的状态 */
const RESUMABLE_WORKFLOW_STATUSES: WorkflowRunStatus[] = ['failed', 'aborted', 'pending']

/**
 * 判断「继续」是否应走工作流引擎（postResumeWorkflow），而非向 Agent 发聊天消息。
 * 流程 / 定时 / 发布类会话在 run 处于可恢复状态时由引擎从 cursor 重试。
 */
export function queryShouldResumeViaWorkflow(
  sessionType: SessionType,
  run: WorkflowRun | null | undefined
): run is WorkflowRun {
  if (sessionType === 'chat' || !run) return false
  return RESUMABLE_WORKFLOW_STATUSES.includes(run.status)
}
