import type { WorkflowNode, WorkflowNotifyNode, WorkflowNotifyTarget } from './types'

/**
 * 解析通知节点投递目标。
 * - 显式 targets 优先
 * - 缺省视为仅渠道（兼容旧版渠道通知节点）
 */
export function queryNotifyTargets(node: WorkflowNotifyNode): WorkflowNotifyTarget[] {
  const raw = node.targets?.filter((t) => t === 'channel' || t === 'toast') ?? []
  if (raw.length) return Array.from(new Set(raw))
  return ['channel']
}

/** 是否包含渠道推送目标 */
export function queryNotifyHasChannel(node: WorkflowNotifyNode): boolean {
  return queryNotifyTargets(node).includes('channel')
}

/** 是否包含应用内 Toast 目标 */
export function queryNotifyHasToast(node: WorkflowNotifyNode): boolean {
  return queryNotifyTargets(node).includes('toast')
}

/**
 * 判断流程定义是否包含「渠道」通知节点（含并行组/条件分支内嵌）。
 * 仅 Toast 的通知节点不计入，避免误抑计划级自动推送。
 */
export function queryWorkflowHasNotifyNode(nodes: WorkflowNode[]): boolean {
  for (const node of nodes) {
    if (node.type === 'notify' && queryNotifyHasChannel(node)) return true
    if (node.type === 'parallel') {
      if (
        node.children.some(
          (child) => child.type === 'notify' && queryNotifyHasChannel(child)
        )
      ) {
        return true
      }
    }
    if (node.type === 'condition') {
      for (const arm of node.cases) {
        if (
          arm.nodes.some(
            (child) => child.type === 'notify' && queryNotifyHasChannel(child)
          )
        ) {
          return true
        }
      }
    }
  }
  return false
}
