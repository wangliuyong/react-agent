import type { PublishPlan, PublishSubTask } from './types'
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

/** 归一化发布计划内全部子任务 */
export function normalizePublishPlan(plan: PublishPlan): PublishPlan {
  return {
    ...plan,
    subTasks: plan.subTasks.map((sub) =>
      normalizePublishSubTask(sub as PublishSubTask & { channel?: unknown })
    )
  }
}
