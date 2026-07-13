import type { PublishPlan, PublishSubTask } from '@shared/types'

export { buildSubTaskPrompt, buildPublishPlanPrompt } from '@shared/publish-prompt'

export function createEmptyPlan(): PublishPlan {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    title: '未命名发布计划',
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
    channel: '小红书',
    topic: '',
    autoPublish: true,
    contentPrompt: '',
    ...partial
  }
}
