import { create } from 'zustand'
import type { PublishPlan } from '@shared/types'
import {
  postDeletePublishPlan,
  postPublishPlan,
  queryPublishPlans
} from '../api'
import { createEmptyPlan, createEmptySubTask, normalizePublishPlan } from '../types'

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
    const plans = (await queryPublishPlans()).map(normalizePublishPlan)
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

  /** 预置示例计划：含单渠道与多渠道子任务，方便开箱体验 */
  addDemoPlan: async () => {
    const plan = createEmptyPlan()
    plan.title = '多渠道发布任务'
    plan.description = '单任务多渠道 + 分渠道串行示例'
    plan.kind = 'normal'
    plan.subTasks = [
      createEmptySubTask({
        title: '人工智能 · 小红书 + 抖音',
        channels: ['xhs', 'douyin'],
        topic: '人工智能',
        autoPublish: true,
        contentPrompt:
          '内容主题：搜罗昨日 ai 最新热门新闻。配图：从相关新闻来源网页用 fetch_web_images 抓取封面图（本地上传可选）。确认点：如果需要登录。'
      }),
      createEmptySubTask({
        title: '体育 · 小红书',
        channels: ['xhs'],
        topic: '体育',
        autoPublish: true,
        contentPrompt:
          '内容主题：搜罗昨日最新 nba 信息、交易、球星评论等。配图：从相关新闻来源网页抓取（本地上传可选）。确认点：如果需要登录。'
      })
    ]
    await postPublishPlan(plan)
    set((s) => ({ plans: [plan, ...s.plans], activePlanId: plan.id }))
    return plan
  }
}))
