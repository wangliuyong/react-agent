import type { ScheduledTask } from '@shared/types'

export async function queryScheduledTasks(): Promise<ScheduledTask[]> {
  return window.api.queryScheduledTasks()
}

export async function queryScheduledTask(id: string): Promise<ScheduledTask | null> {
  return window.api.queryScheduledTask(id)
}

export async function postScheduledTask(task: ScheduledTask): Promise<ScheduledTask> {
  return window.api.postScheduledTask(task)
}

export async function postDeleteScheduledTask(id: string): Promise<void> {
  return window.api.postDeleteScheduledTask(id)
}

/** 立即触发定时任务（主进程创建会话并跑 Agent） */
export async function postRunScheduledTask(id: string): Promise<ScheduledTask | null> {
  return window.api.postRunScheduledTask(id)
}
