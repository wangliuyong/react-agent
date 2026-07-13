import type { ScheduledTask } from '@shared/types'

/** 创建空白定时任务草稿（尚未落盘） */
export function createEmptyScheduledTask(): ScheduledTask {
  const now = Date.now()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(9, 0, 0, 0)

  return {
    id: crypto.randomUUID(),
    title: '未命名定时任务',
    description: '',
    enabled: true,
    repeat: 'daily',
    timeOfDay: '09:00',
    weekday: 1,
    runAt: tomorrow.getTime(),
    actionType: 'publish_plan',
    publishPlanId: undefined,
    customPrompt: '',
    createdAt: now,
    updatedAt: now
  }
}
