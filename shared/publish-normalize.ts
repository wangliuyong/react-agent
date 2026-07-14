import type { PublishPlan, PublishPlanKind, PublishSubTask } from './types'
import { normalizePublishSubTaskChannels } from './publish-channels'

/** 归一化通知渠道 id 列表：去空、去重；不做 xhs 回退 */
export function normalizeNotifyChannelIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((id) => String(id ?? '').trim())
    .filter(Boolean)
    .filter((id, i, arr) => arr.indexOf(id) === i)
}

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
    channels: normalizePublishSubTaskChannels(sub),
    notifyChannels: normalizeNotifyChannelIds(sub.notifyChannels)
  }
}

/** 兼容缺省 / 非法 kind，统一为 normal | workflow */
export function normalizePublishPlanKind(kind: unknown): PublishPlanKind {
  return kind === 'workflow' ? 'workflow' : 'normal'
}

/**
 * 归一化流程任务的子流程 id 列表：优先 workflowIds，兼容旧 workflowId。
 * 去重并保持首次出现顺序。
 */
export function normalizePublishPlanWorkflowIds(plan: {
  workflowIds?: unknown
  workflowId?: unknown
}): string[] {
  const fromArray = Array.isArray(plan.workflowIds)
    ? plan.workflowIds.map((id) => String(id ?? '').trim()).filter(Boolean)
    : []
  const fromLegacy =
    typeof plan.workflowId === 'string' && plan.workflowId.trim()
      ? [plan.workflowId.trim()]
      : []
  const merged = fromArray.length > 0 ? fromArray : fromLegacy
  const seen = new Set<string>()
  const result: string[] = []
  for (const id of merged) {
    if (seen.has(id)) continue
    seen.add(id)
    result.push(id)
  }
  return result
}

/** 归一化发布计划：子任务 + 分类 + 子流程列表 + 通知渠道 */
export function normalizePublishPlan(plan: PublishPlan): PublishPlan {
  const kind = normalizePublishPlanKind(plan.kind)
  const workflowIds =
    kind === 'workflow' ? normalizePublishPlanWorkflowIds(plan) : []
  return {
    ...plan,
    kind,
    workflowIds,
    // 写盘时去掉单字段，避免与数组分叉
    workflowId: undefined,
    notifyChannels: normalizeNotifyChannelIds(plan.notifyChannels),
    subTasks: plan.subTasks.map((sub) =>
      normalizePublishSubTask(sub as PublishSubTask & { channel?: unknown })
    )
  }
}
