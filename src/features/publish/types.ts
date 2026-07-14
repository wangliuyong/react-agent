import type { PublishPlan, PublishPlanKind, PublishSubTask } from '@shared/types'
import type { PublishChannelId } from '@shared/publish-channels'

export { buildSubTaskPrompt, buildPublishPlanPrompt } from '@shared/publish-prompt'
export {
  normalizePublishPlan,
  normalizePublishPlanKind,
  normalizePublishPlanWorkflowIds,
  normalizePublishSubTask
} from '@shared/publish-normalize'
export {
  PUBLISH_CHANNELS,
  queryEnabledPublishChannels,
  queryPublishChannelLabel,
  queryPublishChannelLabels,
  normalizePublishChannelId,
  normalizePublishSubTaskChannels
} from '@shared/publish-channels'
export type { PublishChannelId } from '@shared/publish-channels'

/** 发布任务分类展示文案 */
export function queryPublishPlanKindLabel(kind: PublishPlanKind | undefined): string {
  return kind === 'workflow' ? '流程任务' : '普通任务'
}

export function createEmptyPlan(kind: PublishPlanKind = 'normal'): PublishPlan {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    title: '',
    description: '',
    kind,
    workflowIds: [],
    workflowId: undefined,
    notifyChannels: [],
    subTasks: [],
    createdAt: now,
    updatedAt: now
  }
}

export function createEmptySubTask(partial?: Partial<PublishSubTask>): PublishSubTask {
  return {
    id: crypto.randomUUID(),
    title: '新子任务',
    channels: ['xhs'],
    notifyChannels: [],
    topic: '',
    autoPublish: true,
    contentPrompt: '',
    ...partial
  }
}
