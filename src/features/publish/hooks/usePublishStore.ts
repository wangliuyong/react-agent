import { create } from 'zustand'
import type { PublishPlan } from '@shared/types'
import {
  postDeletePublishPlan,
  postImportBuiltinPublishPlans,
  postInitPublishPlans,
  postPublishPlan,
  queryPublishPlans
} from '../api'
import { createEmptyPlan, normalizePublishPlan } from '../types'

interface PublishState {
  plans: PublishPlan[]
  activePlanId: string | null
  hydrate: () => Promise<void>
  setActive: (id: string | null) => void
  createPlan: () => Promise<PublishPlan>
  savePlan: (plan: PublishPlan) => Promise<void>
  removePlan: (id: string) => Promise<void>
  /** 导入内置发布计划（按固定 id 去重，不覆盖已有数据） */
  addBuiltinPlans: () => Promise<PublishPlan[]>
}

export const usePublishStore = create<PublishState>((set, get) => ({
  plans: [],
  activePlanId: null,

  hydrate: async () => {
    // 首次启动或磁盘为空时，自动写入内置发布计划
    let plans = (await queryPublishPlans()).map(normalizePublishPlan)
    if (plans.length === 0) {
      plans = (await postInitPublishPlans()).map(normalizePublishPlan)
    }
    set({
      plans,
      activePlanId: plans[0]?.id ?? null
    })
  },

  setActive: (id) => set({ activePlanId: id }),

  createPlan: async () => {
    const plan = createEmptyPlan()
    await postPublishPlan(plan)
    set((s) => ({ plans: [plan, ...s.plans], activePlanId: plan.id }))
    return plan
  },

  savePlan: async (plan) => {
    const next = normalizePublishPlan({ ...plan, updatedAt: Date.now() })
    const saved = await postPublishPlan(next)
    set((s) => {
      const exists = s.plans.some((p) => p.id === saved.id)
      return {
        plans: exists
          ? s.plans.map((p) => (p.id === saved.id ? saved : p))
          : [saved, ...s.plans],
        activePlanId: exists ? s.activePlanId : saved.id
      }
    })
  },

  removePlan: async (id) => {
    await postDeletePublishPlan(id)
    set((s) => {
      const plans = s.plans.filter((p) => p.id !== id)
      return {
        plans,
        activePlanId: s.activePlanId === id ? (plans[0]?.id ?? null) : s.activePlanId
      }
    })
  },

  /** 导入内置发布计划：多渠道 + 小红书快速发布 */
  addBuiltinPlans: async () => {
    const plans = (await postImportBuiltinPublishPlans()).map(normalizePublishPlan)
    set({
      plans,
      activePlanId: get().activePlanId ?? plans[0]?.id ?? null
    })
    return plans
  }
}))
