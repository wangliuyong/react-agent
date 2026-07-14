import type { PublishPlan, PublishPlanKind, PublishSubTask } from './types'
import { normalizePublishSubTaskChannels } from './publish-channels'

/**
 * 归一化单个子任务：兼容旧版 channel 单字段，统一为 channels[]。
 * 主进程读盘、渲染进程 hydrate、写盘前均应调用，避免热更新后两端字段不一致。
 */
export function normalizePublishSubTask(
  sub: PublishSubTask & { channel?: unknown }
): PublishSubTask {
  const { channel: _legacyChannel, ...rest } = sub
  return {
    ...rest,
    channels: normalizePublishSubTaskChannels(sub)
  }
}

/** 兼容缺省 / 非法 kind，统一为 normal | workflow */
export function normalizePublishPlanKind(kind: unknown): PublishPlanKind {
  return kind === 'workflow' ? 'workflow' : 'normal'
}

/** 归一化发布计划：子任务 + 分类字段 */
export function normalizePublishPlan(plan: PublishPlan): PublishPlan {
  const kind = normalizePublishPlanKind(plan.kind)
  return {
    ...plan,
    kind,
    workflowId:
      kind === 'workflow' ? (plan.workflowId?.trim() || undefined) : undefined,
    subTasks: plan.subTasks.map((sub) =>
      normalizePublishSubTask(sub as PublishSubTask & { channel?: unknown })
    )
  }
}
