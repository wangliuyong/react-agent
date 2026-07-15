import type { PublishPlan } from '@shared/types'

export async function queryPublishPlans(): Promise<PublishPlan[]> {
  return window.api.queryPublishPlans()
}

export async function queryPublishPlan(id: string): Promise<PublishPlan | null> {
  return window.api.queryPublishPlan(id)
}

export async function postPublishPlan(plan: PublishPlan): Promise<PublishPlan> {
  return window.api.postPublishPlan(plan)
}

export async function postDeletePublishPlan(id: string): Promise<void> {
  return window.api.postDeletePublishPlan(id)
}

/** 写：首次启动写入内置发布计划（磁盘为空时） */
export async function postInitPublishPlans(): Promise<PublishPlan[]> {
  return window.api.postInitPublishPlans()
}

/** 写：导入缺失的内置发布计划 */
export async function postImportBuiltinPublishPlans(): Promise<PublishPlan[]> {
  return window.api.postImportBuiltinPublishPlans()
}
