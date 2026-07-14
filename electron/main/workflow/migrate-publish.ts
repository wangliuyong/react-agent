import type { PublishPlan, WorkflowDefinition } from '../../../shared/types'
import {
  normalizePublishPlanKind,
  normalizePublishPlanWorkflowIds
} from '../../../shared/publish-normalize'
import { compilePublishPlanToWorkflow } from '../../../shared/compile-publish-workflow'
import { queryPublishPlan } from '../store/plans'
import {
  postDeleteWorkflow,
  postWorkflow,
  queryWorkflow
} from '../store/workflows'
import { compileWorkflowPlanToDefinition } from './compile-workflow-plan'

/**
 * 将发布计划 upsert 为同 id 工作流。
 * - 普通任务：由 subTasks 编译镜像
 * - 流程任务：将多个子流程串行组合为镜像（不修改原子流程定义）
 */
export function syncPublishPlanWorkflow(plan: PublishPlan): WorkflowDefinition | null {
  const kind = normalizePublishPlanKind(plan.kind)
  const compiled =
    kind === 'workflow'
      ? compileWorkflowPlanToDefinition(plan)
      : compilePublishPlanToWorkflow(plan)

  if (!compiled.nodes.length) {
    return null
  }

  const existing = queryWorkflow(compiled.id)
  return postWorkflow({
    ...compiled,
    createdAt: existing?.createdAt ?? compiled.createdAt
  })
}

/**
 * 删除计划时仅移除计划 id 对应的组合/镜像工作流，不删除 workflowIds 里的子流程。
 */
export function postDeletePublishPlanWorkflow(planId: string): void {
  postDeleteWorkflow(planId)
}

/**
 * 惰性迁移：普通缺省时从计划编译；流程任务按子流程列表重新组合。
 */
export function queryOrMigratePublishWorkflow(planId: string): WorkflowDefinition | null {
  const plan = queryPublishPlan(planId)
  if (!plan) {
    return queryWorkflow(planId)
  }

  if (normalizePublishPlanKind(plan.kind) === 'workflow') {
    if (!normalizePublishPlanWorkflowIds(plan).length) {
      return queryWorkflow(planId)
    }
    return syncPublishPlanWorkflow(plan)
  }

  // 普通发布计划每次从计划重编译，保证策略变更（如去掉强制确认节点）立即生效
  if (!plan.subTasks.length) {
    return queryWorkflow(planId)
  }
  return syncPublishPlanWorkflow(plan)
}

/** 解析发布计划对应的可执行工作流 id（供调度 / 运行入口复用） */
export function queryPublishPlanRunnableWorkflowId(planId: string): string | null {
  return queryOrMigratePublishWorkflow(planId)?.id ?? null
}
