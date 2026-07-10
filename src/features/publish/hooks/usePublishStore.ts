import { create } from 'zustand'
import type { PublishPlan } from '@shared/types'
import {
  postDeletePublishPlan,
  postPublishPlan,
  queryPublishPlans
} from '../api'
import { createEmptyPlan, createEmptySubTask } from '../types'

interface PublishState {
  plans: PublishPlan[]
  activePlanId: string | null
  hydrate: () => Promise<void>
  setActive: (id: string | null) => void
  createPlan: () => Promise<PublishPlan>
  savePlan: (plan: PublishPlan) => Promise<void>
  removePlan: (id: string) => Promise<void>
  addDemoPlan: () => Promise<PublishPlan>
}

export const usePublishStore = create<PublishState>((set, get) => ({
  plans: [],
  activePlanId: null,

  hydrate: async () => {
    const plans = await queryPublishPlans()
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
    const next = { ...plan, updatedAt: Date.now() }
    await postPublishPlan(next)
    set((s) => ({
      plans: s.plans.map((p) => (p.id === next.id ? next : p))
    }))
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

  /** 预置截图同款「小红书任务」示例，方便开箱体验 */
  addDemoPlan: async () => {
    const plan = createEmptyPlan()
    plan.title = '小红书任务'
    plan.description = ''
    plan.subTasks = [
      createEmptySubTask({
        title: '体育 发布',
        channel: '小红书',
        topic: '体育',
        autoPublish: true,
        contentPrompt:
          '内容主题：搜罗昨日最新 nba 信息、交易、球星评论等。配图：从相关新闻来源网页用 fetch_web_images 抓取封面图（本地上传可选）。确认点：如果需要登录。'
      }),
      createEmptySubTask({
        title: '人工智能 发布',
        channel: '小红书',
        topic: '人工智能',
        autoPublish: true,
        contentPrompt:
          '内容主题：搜罗昨日 ai 最新热门新闻。标题要求：不超过 20 个字。配图：从相关新闻来源网页抓取（本地上传可选）。确认点：如果需要登录。'
      })
    ]
    await postPublishPlan(plan)
    set((s) => ({ plans: [plan, ...s.plans], activePlanId: plan.id }))
    return plan
  }
}))
