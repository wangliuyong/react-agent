import type { Node, NodeProps } from '@xyflow/react'
import { Handle, Position } from '@xyflow/react'
import type { WorkflowConditionNode } from '@shared/types'
import styles from './WorkflowConditionFlowNode.module.css'

export type WorkflowConditionRfData = {
  condition: WorkflowConditionNode
  onEdit: (id: string) => void
}

export type WorkflowConditionRfNode = Node<WorkflowConditionRfData, 'workflowCondition'>

/** 画布条件节点：多出口 Handle（id = case.key），双击编辑元数据 */
export function WorkflowConditionFlowNode({
  data,
  selected
}: NodeProps & { data: WorkflowConditionRfData }): React.ReactElement {
  const { condition, onEdit } = data
  const modeLabel = condition.mode === 'agent' ? 'Agent 选路' : '表达式'
  return (
    <div
      className={`${styles.node} ${selected ? styles.selected : ''}`}
      onDoubleClick={() => onEdit(condition.id)}
      title="双击编辑条件"
    >
      <Handle type="target" position={Position.Top} className={styles.handle} />
      <span className={styles.title}>{condition.title || '条件分支'}</span>
      <span className={styles.mode}>{modeLabel}</span>
      <div className={styles.handles}>
        {condition.cases.map((arm) => (
          <div key={arm.key} className={styles.branchWrap}>
            <span className={styles.branchTag}>{arm.label || arm.key}</span>
            <Handle
              type="source"
              position={Position.Bottom}
              id={arm.key}
              className={`${styles.handle} ${styles.handleOut}`}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
