import { create } from 'zustand'
import type { ProjectSkill, ProjectSkillDetail, SkillImportPreview, SkillTemplate, SkillUpsertInput } from '@shared/types'
import {
  postDeleteProjectSkill,
  postImportSkillFromUrl,
  postInstallSkillTemplate,
  postProjectSkill,
  postSkillStates,
  queryProjectSkillDetail,
  queryProjectSkills,
  querySkillImportPreview,
  querySkillTemplates
} from '../api'
import { createEmptySkill } from '../types'

interface SkillsState {
  skills: ProjectSkill[]
  activeSkillId: string | null
  detail: ProjectSkillDetail | null
  templates: SkillTemplate[]
  loading: boolean
  hydrate: () => Promise<void>
  setActive: (id: string | null) => Promise<void>
  toggleEnabled: (id: string, enabled: boolean) => Promise<void>
  refresh: () => Promise<void>
  /** 返回新建技能默认表单值 */
  createSkillDraft: () => SkillUpsertInput
  saveSkill: (input: SkillUpsertInput) => Promise<ProjectSkillDetail>
  removeSkill: (id: string) => Promise<void>
  loadTemplates: () => Promise<SkillTemplate[]>
  installTemplate: (templateId: string, targetId?: string) => Promise<ProjectSkillDetail>
  previewImport: (url: string) => Promise<SkillImportPreview>
  importFromUrl: (url: string, targetId?: string) => Promise<ProjectSkillDetail>
}

export const useSkillsStore = create<SkillsState>((set, get) => ({
  skills: [],
  activeSkillId: null,
  detail: null,
  templates: [],
  loading: false,

  hydrate: async () => {
    set({ loading: true })
    try {
      const skills = await queryProjectSkills()
      const activeSkillId = skills[0]?.id ?? null
      set({ skills, activeSkillId })
      if (activeSkillId) {
        const detail = await queryProjectSkillDetail(activeSkillId)
        set({ detail })
      }
    } finally {
      set({ loading: false })
    }
  },

  setActive: async (id) => {
    set({ activeSkillId: id, detail: null })
    if (!id) return
    const detail = await queryProjectSkillDetail(id)
    set({ detail })
  },

  toggleEnabled: async (id, enabled) => {
    await postSkillStates({ [id]: { enabled } })
    set((s) => ({
      skills: s.skills.map((sk) => (sk.id === id ? { ...sk, enabled } : sk)),
      detail: s.detail?.id === id ? { ...s.detail, enabled } : s.detail
    }))
  },

  refresh: async () => {
    const { activeSkillId } = get()
    const skills = await queryProjectSkills()
    set({ skills })
    if (activeSkillId) {
      const detail = await queryProjectSkillDetail(activeSkillId)
      set({ detail })
    }
  },

  createSkillDraft: () => createEmptySkill(),

  saveSkill: async (input) => {
    const detail = await postProjectSkill(input)
    const skills = await queryProjectSkills()
    set({ skills, activeSkillId: detail.id, detail })
    return detail
  },

  removeSkill: async (id) => {
    await postDeleteProjectSkill(id)
    set((s) => {
      const skills = s.skills.filter((sk) => sk.id !== id)
      const nextActiveId =
        s.activeSkillId === id ? (skills[0]?.id ?? null) : s.activeSkillId
      return {
        skills,
        activeSkillId: nextActiveId,
        detail: s.detail?.id === id ? null : s.detail
      }
    })
    const { activeSkillId } = get()
    if (activeSkillId) {
      const detail = await queryProjectSkillDetail(activeSkillId)
      set({ detail })
    } else {
      set({ detail: null })
    }
  },

  loadTemplates: async () => {
    const templates = await querySkillTemplates()
    set({ templates })
    return templates
  },

  installTemplate: async (templateId, targetId) => {
    const detail = await postInstallSkillTemplate(templateId, targetId)
    const skills = await queryProjectSkills()
    set({ skills, activeSkillId: detail.id, detail })
    return detail
  },

  previewImport: async (url) => querySkillImportPreview(url),

  importFromUrl: async (url, targetId) => {
    const detail = await postImportSkillFromUrl(url, targetId)
    const skills = await queryProjectSkills()
    set({ skills, activeSkillId: detail.id, detail })
    return detail
  }
}))
