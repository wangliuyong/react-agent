import type { PublishPlan, WorkflowDefinition } from '../../../shared/types'
import { normalizePublishPlanKind } from '../../../shared/publish-normalize'
import { compilePublishPlanToWorkflow } from '../../../shared/compile-publish-workflow'
import { queryPublishPlan } from '../store/plans'
import {
  postDeleteWorkflow,
  postWorkflow,
  queryWorkflow
} from '../store/workflows'

/**
 * 将「普通」发布计划 upsert 为同 id 工作流。
 * 流程任务只引用已有工作流，不做镜像覆盖。
 */
export function syncPublishPlanWorkflow(plan: PublishPlan): WorkflowDefinition | null {
  if (normalizePublishPlanKind(plan.kind) === 'workflow') {
    return null
  }
  const compiled = compilePublishPlanToWorkflow(plan)
  const existing = queryWorkflow(compiled.id)
  return postWorkflow({
    ...compiled,
    createdAt: existing?.createdAt ?? compiled.createdAt
  })
}

/**
 * 删除计划时：仅移除普通任务的镜像工作流，不删除流程任务所关联的真实流程。
 */
export function postDeletePublishPlanWorkflow(planId: string): void {
  const plan = queryPublishPlan(planId)
  if (plan && normalizePublishPlanKind(plan.kind) === 'workflow') {
    return
  }
  postDeleteWorkflow(planId)
}

/**
 * 惰性迁移：工作流缺失时从「普通」计划编译；流程任务返回关联工作流。
 */
export function queryOrMigratePublishWorkflow(planId: string): WorkflowDefinition | null {
  const plan = queryPublishPlan(planId)
  if (plan && normalizePublishPlanKind(plan.kind) === 'workflow') {
    const wid = plan.workflowId?.trim()
    return wid ? queryWorkflow(wid) : null
  }

  const existing = queryWorkflow(planId)
  if (existing && existing.nodes.length > 0) {
    return existing
  }
  if (!plan) return existing
  if (!plan.subTasks.length) return existing
  return syncPublishPlanWorkflow(plan)
}

/** 解析发布计划对应的可执行工作流 id（供调度 / 运行入口复用） */
export function queryPublishPlanRunnableWorkflowId(planId: string): string | null {
  return queryOrMigratePublishWorkflow(planId)?.id ?? null
}
