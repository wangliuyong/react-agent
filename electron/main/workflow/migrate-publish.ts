import type { PublishPlan, WorkflowDefinition } from '../../../shared/types'
import { compilePublishPlanToWorkflow } from '../../../shared/compile-publish-workflow'
import { queryPublishPlan } from '../store/plans'
import {
  postDeleteWorkflow,
  postWorkflow,
  queryWorkflow
} from '../store/workflows'

/**
 * 将发布计划 upsert 为同 id 工作流，供引擎 / 定时任务统一执行。
 */
export function syncPublishPlanWorkflow(plan: PublishPlan): WorkflowDefinition {
  const compiled = compilePublishPlanToWorkflow(plan)
  const existing = queryWorkflow(compiled.id)
  return postWorkflow({
    ...compiled,
    createdAt: existing?.createdAt ?? compiled.createdAt
  })
}

/** 删除计划时同步移除镜像工作流（忽略不存在） */
export function postDeletePublishPlanWorkflow(planId: string): void {
  postDeleteWorkflow(planId)
}

/**
 * 惰性迁移：工作流缺失时从计划编译；计划也不存在则返回 null。
 */
export function queryOrMigratePublishWorkflow(planId: string): WorkflowDefinition | null {
  const existing = queryWorkflow(planId)
  if (existing && existing.nodes.length > 0) {
    return existing
  }
  const plan = queryPublishPlan(planId)
  if (!plan) return existing
  if (!plan.subTasks.length) return existing
  return syncPublishPlanWorkflow(plan)
}
