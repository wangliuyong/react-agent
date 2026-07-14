import type { Node, NodeProps } from '@xyflow/react'
import { Handle, Position } from '@xyflow/react'
import type { WorkflowLeafNode } from '@shared/types'
import { queryNodeTypeLabel } from '../../types'
import styles from './WorkflowFlowNode.module.css'

export type WorkflowRfNodeData = {
  leaf: WorkflowLeafNode
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export type WorkflowRfNode = Node<WorkflowRfNodeData, 'workflow'>

/** React Flow 自定义节点：展示类型/标题，支持入出连线桩 */
export function WorkflowFlowNode({
  data,
  selected
}: NodeProps & { data: WorkflowRfNodeData }): React.ReactElement {
  const { leaf, onEdit, onDelete } = data
  return (
    <div
      className={`${styles.node} ${selected ? styles.selected : ''} ${styles[leaf.type]}`}
      onDoubleClick={() => onEdit(leaf.id)}
    >
      <Handle type="target" position={Position.Top} className={styles.handle} />
      <div className={styles.head}>
        <Tag className={styles.tag}>{queryNodeTypeLabel(leaf.type)}</Tag>
        <span className={styles.title}>{leaf.title}</span>
      </div>
      <div className={styles.summary}>
        {leaf.type === 'agent' && (leaf.prompt.slice(0, 48) || '（未填提示词）')}
        {leaf.type === 'tool' && (leaf.toolName || '（未选工具）')}
        {leaf.type === 'await_user' && (leaf.reason || '等待确认')}
      </div>
      <div className={styles.actions}>
        <Button
          type="link"
          size="small"
          onClick={(e) => {
            e.stopPropagation()
            onEdit(leaf.id)
          }}
        >
          编辑
        </Button>
        <Button
          type="link"
          size="small"
          danger
          onClick={(e) => {
            e.stopPropagation()
            onDelete(leaf.id)
          }}
        >
          删除
        </Button>
      </div>
      <Handle type="source" position={Position.Bottom} className={styles.handle} />
    </div>
  )
}
