import type { Node, NodeProps } from '@xyflow/react'
import { Handle, Position } from '@xyflow/react'
import type { TaskItemStatus, WorkflowLeafNode } from '@shared/types'
import styles from './WorkflowFlowNode.module.css'

export type WorkflowRfNodeData = {
  leaf: WorkflowLeafNode
  /** 执行态：由 task_update 驱动；完成/失败后节点自行展示 */
  execStatus?: TaskItemStatus
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export type WorkflowRfNode = Node<WorkflowRfNodeData, 'workflow'>

/** 执行态 → 可读文案（title / aria） */
function queryExecStatusLabel(status: TaskItemStatus): string {
  switch (status) {
    case 'running':
      return '执行中'
    case 'done':
      return '成功'
    case 'failed':
      return '失败'
    case 'skipped':
      return '已跳过'
    case 'pending':
    default:
      return '待执行'
  }
}

/** 执行态 → 角标符号 */
function queryExecStatusMark(status: TaskItemStatus): string {
  switch (status) {
    case 'running':
      return '…'
    case 'done':
      return '✓'
    case 'failed':
      return '!'
    case 'skipped':
      return '–'
    default:
      return ''
  }
}

/** React Flow 自定义节点：标题 + 执行态；双击编辑；入/出连线桩保留 */
export function WorkflowFlowNode({
  data,
  selected
}: NodeProps & { data: WorkflowRfNodeData }): React.ReactElement {
  const { leaf, execStatus, onEdit } = data
  const statusClass =
    execStatus && execStatus !== 'pending' ? styles[`status_${execStatus}`] : ''
  const statusLabel = execStatus ? queryExecStatusLabel(execStatus) : undefined
  const statusMark = execStatus ? queryExecStatusMark(execStatus) : ''

  return (
    <div
      className={[styles.node, selected ? styles.selected : '', styles[leaf.type], statusClass]
        .filter(Boolean)
        .join(' ')}
      onDoubleClick={() => onEdit(leaf.id)}
      title={statusLabel ? `${leaf.title || '未命名步骤'} · ${statusLabel}` : '双击编辑'}
      aria-label={statusLabel}
    >
      <Handle type="target" position={Position.Top} className={styles.handle} />
      <div className={styles.body}>
        <span className={styles.title}>{leaf.title || '未命名步骤'}</span>
        {/* 终态 / 执行中由节点自行展示，不依赖全局 toast */}
        {statusMark ? (
          <span className={styles.statusMark} aria-hidden>
            {statusMark}
          </span>
        ) : null}
      </div>
      <Handle type="source" position={Position.Bottom} className={styles.handle} />
    </div>
  )
}
