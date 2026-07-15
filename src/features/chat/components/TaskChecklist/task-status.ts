import type { TaskItemStatus } from '@shared/types'

/** 任务清单节点在界面中的状态，包含仅由暂停态派生出的展示状态。 */
export type ChecklistTaskStatus = TaskItemStatus | 'paused'

interface ChecklistExecutionState {
  running: boolean
  canResume: boolean
}

/**
 * 根据任务持久化状态与当前执行状态，计算节点在任务清单中的展示状态。
 */
export function queryChecklistTaskStatus(
  status: TaskItemStatus,
  execution: ChecklistExecutionState
): ChecklistTaskStatus {
  // Agent 已停止但清单仍可恢复时，原 running 节点实际处于暂停状态。
  // 恢复执行会先把全局 running 设回 true，因此节点会自然恢复为 running。
  if (status === 'running' && !execution.running && execution.canResume) {
    return 'paused'
  }
  return status
}
