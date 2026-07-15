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

/** 写：首次启动写入内置定时任务（磁盘为空时） */
export async function postInitScheduledTasks(): Promise<ScheduledTask[]> {
  return window.api.postInitScheduledTasks()
}

/** 写：导入缺失的内置定时任务 */
export async function postImportBuiltinScheduledTasks(): Promise<ScheduledTask[]> {
  return window.api.postImportBuiltinScheduledTasks()
}
