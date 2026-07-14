import type {
  PublishPlan,
  WorkflowConditionNode,
  WorkflowDefinition,
  WorkflowLeafNode,
  WorkflowNode,
  WorkflowParallelNode
} from '../../../shared/types'
import { normalizePublishPlanWorkflowIds } from '../../../shared/publish-normalize'
import { queryWorkflow } from '../store/workflows'

/** 为避免多子流程节点 id 冲突，统一加前缀 */
function remapLeaf(node: WorkflowLeafNode, prefix: string): WorkflowLeafNode {
  return { ...node, id: `${prefix}__${node.id}` }
}

function remapNode(node: WorkflowNode, prefix: string): WorkflowNode {
  if (node.type === 'parallel') {
    const parallel: WorkflowParallelNode = {
      ...node,
      id: `${prefix}__${node.id}`,
      children: node.children.map((c) => remapLeaf(c, prefix))
    }
    return parallel
  }
  if (node.type === 'condition') {
    const condition: WorkflowConditionNode = {
      ...node,
      id: `${prefix}__${node.id}`,
      cases: node.cases.map((arm) => ({
        ...arm,
        nodes: arm.nodes.map((c) => remapLeaf(c, prefix))
      }))
    }
    return condition
  }
  return remapLeaf(node, prefix)
}

/**
 * 将流程任务的多个子流程按序拼接为可执行组合工作流（id = 计划 id）。
 * 子流程之间插入 await_user，避免一口气跑完无确认。
 */
export function compileWorkflowPlanToDefinition(plan: PublishPlan): WorkflowDefinition {
  const ids = normalizePublishPlanWorkflowIds(plan)
  const now = Date.now()
  const nodes: WorkflowNode[] = []

  for (let i = 0; i < ids.length; i++) {
    const wid = ids[i]
    const child = queryWorkflow(wid)
    if (!child?.nodes.length) continue

    const prefix = `sub${i}_${wid}`
    // 子流程之间暂停确认，避免一口气串行跑完
    if (nodes.length > 0) {
      nodes.push({
        id: `${prefix}__gate`,
        type: 'await_user',
        title: `进入下一子流程：${child.title}`,
        reason: `上一段子流程已结束。确认后继续执行「${child.title}」（${child.nodes.length} 步）。`
      })
    }
    for (const n of child.nodes) {
      nodes.push(remapNode(n, prefix))
    }
  }

  return {
    id: plan.id,
    title: plan.title,
    description:
      plan.description ||
      `由流程任务自动组合（${ids.length} 个子流程）`,
    templateKind: 'publish',
    nodes,
    createdAt: plan.createdAt || now,
    updatedAt: plan.updatedAt || now
  }
}
