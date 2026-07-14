import type { Node, NodeProps } from '@xyflow/react'
import { Handle, Position } from '@xyflow/react'
import type { WorkflowLeafNode } from '@shared/types'
import styles from './WorkflowFlowNode.module.css'

export type WorkflowRfNodeData = {
  leaf: WorkflowLeafNode
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export type WorkflowRfNode = Node<WorkflowRfNodeData, 'workflow'>

/** React Flow 自定义节点：仅展示标题，双击编辑；入/出连线桩保留 */
export function WorkflowFlowNode({
  data,
  selected
}: NodeProps & { data: WorkflowRfNodeData }): React.ReactElement {
  const { leaf, onEdit } = data
  return (
    <div
      className={`${styles.node} ${selected ? styles.selected : ''} ${styles[leaf.type]}`}
      onDoubleClick={() => onEdit(leaf.id)}
      title="双击编辑"
    >
      <Handle type="target" position={Position.Top} className={styles.handle} />
      <span className={styles.title}>{leaf.title || '未命名步骤'}</span>
      <Handle type="source" position={Position.Bottom} className={styles.handle} />
    </div>
  )
}
