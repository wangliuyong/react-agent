import { create } from 'zustand'
import type { AgentRule, AgentRuleUpsertInput } from '@shared/types'
import { postAgentRule, postDeleteAgentRule, queryAgentRules } from '../api'
import { createEmptyRule } from '../types'

interface RulesState {
  rules: AgentRule[]
  loading: boolean
  hydrate: () => Promise<void>
  createRuleDraft: () => AgentRuleUpsertInput
  saveRule: (input: AgentRuleUpsertInput) => Promise<AgentRule>
  removeRule: (id: string) => Promise<void>
  /** 切换启用状态：读盘对象后整对象 upsert，保持与 postAgentRule 契约一致 */
  toggleEnabled: (id: string, enabled: boolean) => Promise<void>
}

export const useRulesStore = create<RulesState>((set, get) => ({
  rules: [],
  loading: false,

  hydrate: async () => {
    set({ loading: true })
    try {
      const rules = await queryAgentRules()
      set({ rules })
    } finally {
      set({ loading: false })
    }
  },

  createRuleDraft: () => createEmptyRule(),

  saveRule: async (input) => {
    const saved = await postAgentRule(input)
    const rules = get().rules
    const exists = rules.some((r) => r.id === saved.id)
    const next = exists
      ? rules.map((r) => (r.id === saved.id ? saved : r))
      : [...rules, saved]
    // 与主进程一致：按 updatedAt 降序展示
    next.sort((a, b) => b.updatedAt - a.updatedAt)
    set({ rules: next })
    return saved
  },

  removeRule: async (id) => {
    await postDeleteAgentRule(id)
    set({ rules: get().rules.filter((r) => r.id !== id) })
  },

  toggleEnabled: async (id, enabled) => {
    const rule = get().rules.find((r) => r.id === id)
    if (!rule) return
    await get().saveRule({
      id: rule.id,
      name: rule.name,
      description: rule.description,
      content: rule.content,
      enabled
    })
  }
}))
