import type { WorkflowNode } from './types'

/** 判断流程定义是否包含渠道通知节点（含并行组/条件分支内嵌） */
export function queryWorkflowHasNotifyNode(nodes: WorkflowNode[]): boolean {
  for (const node of nodes) {
    if (node.type === 'notify') return true
    if (node.type === 'parallel') {
      if (node.children.some((child) => child.type === 'notify')) return true
    }
    if (node.type === 'condition') {
      for (const arm of node.cases) {
        if (arm.nodes.some((child) => child.type === 'notify')) return true
      }
    }
  }
  return false
}
