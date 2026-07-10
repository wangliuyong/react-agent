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
