import type { PublishPlan, PublishSubTask } from '@shared/types'
import type { PublishChannelId } from '@shared/publish-channels'

export { buildSubTaskPrompt, buildPublishPlanPrompt } from '@shared/publish-prompt'
export { normalizePublishPlan, normalizePublishSubTask } from '@shared/publish-normalize'
export {
  PUBLISH_CHANNELS,
  queryEnabledPublishChannels,
  queryPublishChannelLabel,
  queryPublishChannelLabels,
  normalizePublishChannelId,
  normalizePublishSubTaskChannels
} from '@shared/publish-channels'
export type { PublishChannelId } from '@shared/publish-channels'

export function createEmptyPlan(): PublishPlan {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    title: '',
    description: '',
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
    topic: '',
    autoPublish: true,
    contentPrompt: '',
    ...partial
  }
}
