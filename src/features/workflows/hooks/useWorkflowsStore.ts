import { create } from 'zustand'
import type { WorkflowDefinition } from '@shared/types'
import {
  postDeleteWorkflow,
  postRunWorkflow,
  postWorkflow,
  queryWorkflows
} from '../api'
import { createEmptyWorkflow } from '../types'

interface WorkflowsState {
  workflows: WorkflowDefinition[]
  activeId: string | null
  loading: boolean
  running: boolean
  hydrate: () => Promise<void>
  setActiveId: (id: string | null) => void
  createDraft: () => Promise<WorkflowDefinition>
  saveWorkflow: (workflow: WorkflowDefinition) => Promise<WorkflowDefinition>
  removeWorkflow: (id: string) => Promise<void>
  /** 启动编排引擎并返回 sessionId */
  runWorkflow: (id: string) => Promise<string>
}

export const useWorkflowsStore = create<WorkflowsState>((set, get) => ({
  workflows: [],
  activeId: null,
  loading: false,
  running: false,

  hydrate: async () => {
    set({ loading: true })
    try {
      const workflows = await queryWorkflows()
      const { activeId } = get()
      const nextActive =
        activeId && workflows.some((w) => w.id === activeId)
          ? activeId
          : (workflows[0]?.id ?? null)
      set({ workflows, activeId: nextActive })
    } finally {
      set({ loading: false })
    }
  },

  setActiveId: (id) => set({ activeId: id }),

  createDraft: async () => {
    const draft = createEmptyWorkflow()
    const saved = await get().saveWorkflow(draft)
    set({ activeId: saved.id })
    return saved
  },

  saveWorkflow: async (workflow) => {
    const saved = await postWorkflow({
      ...workflow,
      updatedAt: Date.now()
    })
    const list = get().workflows
    const exists = list.some((w) => w.id === saved.id)
    const next = exists
      ? list.map((w) => (w.id === saved.id ? saved : w))
      : [...list, saved]
    next.sort((a, b) => b.updatedAt - a.updatedAt)
    set({ workflows: next })
    return saved
  },

  removeWorkflow: async (id) => {
    await postDeleteWorkflow(id)
    const next = get().workflows.filter((w) => w.id !== id)
    const activeId = get().activeId === id ? (next[0]?.id ?? null) : get().activeId
    set({ workflows: next, activeId })
  },

  runWorkflow: async (id) => {
    set({ running: true })
    try {
      const result = await postRunWorkflow(id)
      return result.sessionId
    } finally {
      set({ running: false })
    }
  }
}))
