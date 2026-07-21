import type { ScheduledTask } from '@shared/types'

/** 创建空白定时任务草稿（尚未落盘） */
export function createEmptyScheduledTask(): ScheduledTask {
  const now = Date.now()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(9, 0, 0, 0)

  return {
    id: crypto.randomUUID(),
    title: '',
    description: '',
    // 默认不启用，避免新建后被调度器到点自动执行
    enabled: false,
    repeat: 'daily',
    timeOfDay: '09:00',
    weekday: 1,
    runAt: tomorrow.getTime(),
    actionType: 'publish_plan',
    publishPlanId: undefined,
    customPrompt: '',
    notifyChannels: [],
    /** 默认后台执行，不打扰主聊天窗口 */
    runInBackground: true,
    runCount: 0,
    createdAt: now,
    updatedAt: now
  }
}
