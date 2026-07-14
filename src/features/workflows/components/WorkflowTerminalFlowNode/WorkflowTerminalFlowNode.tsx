import type { Node, NodeProps } from '@xyflow/react'
import { Handle, Position } from '@xyflow/react'
import type { WorkflowTerminalNode } from '@shared/types'
import styles from './WorkflowTerminalFlowNode.module.css'

export type WorkflowTerminalRfData = {
  terminal: WorkflowTerminalNode
}

export type WorkflowTerminalRfNode = Node<WorkflowTerminalRfData, 'workflowTerminal'>

/** 开始 / 结束：胶囊节点；开始仅出、结束仅入；不可删除由画布侧控制 */
export function WorkflowTerminalFlowNode({
  data
}: NodeProps & { data: WorkflowTerminalRfData }): React.ReactElement {
  const { terminal } = data
  const isStart = terminal.type === 'start'
  return (
    <div
      className={`${styles.node} ${isStart ? styles.start : styles.end}`}
      title={isStart ? '流程开始（不可删除）' : '流程结束（不可删除）'}
    >
      {!isStart && (
        <Handle type="target" position={Position.Top} className={styles.handle} />
      )}
      <span className={styles.title}>{terminal.title}</span>
      {isStart && (
        <Handle type="source" position={Position.Bottom} className={styles.handle} />
      )}
    </div>
  )
}
