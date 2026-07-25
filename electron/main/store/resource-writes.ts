import type { AgentRuleUpsertInput, PublishPlan, ScheduledTask } from '../../../shared/types'
import { postAgentRule } from './rules'
import { postPublishPlan } from './plans'
import { postScheduledTask } from './schedules'
import { syncPublishPlanWorkflow } from '../workflow/migrate-publish'
import {
  emitAgentRulesUpdate,
  emitPublishPlansUpdate,
  emitScheduleUpdate
} from './resource-notify'

/**
 * 保存定时任务并通知渲染进程刷新列表。
 * IPC 与 Agent 工具共用，避免仅写盘不广播。
 */
export function postScheduledTaskAndNotify(task: ScheduledTask): ScheduledTask {
  const saved = postScheduledTask(task)
  emitScheduleUpdate()
  return saved
}

/**
 * 保存发布计划并同步镜像工作流（与 IPC postPublishPlan 行为一致）。
 */
export function postPublishPlanAndSync(plan: PublishPlan): PublishPlan {
  const saved = postPublishPlan(plan)
  try {
    syncPublishPlanWorkflow(saved)
  } catch {
    /* 执行时会惰性迁移 */
  }
  emitPublishPlansUpdate()
  return saved
}

/** 保存规则并通知渲染进程刷新列表 */
export function postAgentRuleAndNotify(input: AgentRuleUpsertInput) {
  const saved = postAgentRule(input)
  emitAgentRulesUpdate()
  return saved
}
