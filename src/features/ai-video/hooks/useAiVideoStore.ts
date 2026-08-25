import { create } from 'zustand'
import type { AiVideoProject, AiVideoNodeEvent } from '@shared/ai-video'
import {
  queryAiVideoProjects,
  queryAiVideoProject,
  postAiVideoProject,
  postDeleteAiVideoProject,
  postCreateAiVideoProject,
  onAiVideoNodeEvent
} from '../api'

interface AiVideoState {
  projects: AiVideoProject[]
  activeProject: AiVideoProject | null
  loaded: boolean
  saving: boolean
  hydrate: () => Promise<void>
  postCreate: (title?: string) => Promise<AiVideoProject>
  postOpen: (id: string) => Promise<AiVideoProject | null>
  postSave: (project: AiVideoProject) => Promise<AiVideoProject>
  postDelete: (id: string) => Promise<void>
  postApplyEvent: (event: AiVideoNodeEvent) => void
  postSetActive: (project: AiVideoProject | null) => void
}

export const useAiVideoStore = create<AiVideoState>((set, get) => ({
  projects: [],
  activeProject: null,
  loaded: false,
  saving: false,

  hydrate: async () => {
    const projects = await queryAiVideoProjects()
    set({ projects, loaded: true })
  },

  postCreate: async (title) => {
    const project = await postCreateAiVideoProject(title)
    set((s) => ({
      projects: [project, ...s.projects.filter((p) => p.id !== project.id)],
      activeProject: project
    }))
    return project
  },

  postOpen: async (id) => {
    const project = await queryAiVideoProject(id)
    if (project) set({ activeProject: project })
    return project
  },

  postSave: async (project) => {
    set({ saving: true })
    try {
      const saved = await postAiVideoProject(project)
      set((s) => ({
        activeProject: saved,
        projects: [saved, ...s.projects.filter((p) => p.id !== saved.id)].sort(
          (a, b) => b.updatedAt - a.updatedAt
        ),
        saving: false
      }))
      return saved
    } catch (err) {
      set({ saving: false })
      throw err
    }
  },

  postDelete: async (id) => {
    await postDeleteAiVideoProject(id)
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      activeProject: s.activeProject?.id === id ? null : s.activeProject
    }))
  },

  postApplyEvent: (event) => {
    if (event.project) {
      const project = event.project
      set((s) => ({
        activeProject:
          s.activeProject?.id === project.id ? project : s.activeProject,
        projects: s.projects.map((p) => (p.id === project.id ? project : p))
      }))
      return
    }
    const { activeProject } = get()
    if (!activeProject || activeProject.id !== event.projectId) return
    const nodes = activeProject.canvas.nodes.map((n) =>
      n.id === event.nodeId
        ? {
            ...n,
            status: event.status,
            errorMessage: event.errorMessage,
            result: event.result ?? n.result
          }
        : n
    )
    set({
      activeProject: {
        ...activeProject,
        canvas: { ...activeProject.canvas, nodes }
      }
    })
  },

  postSetActive: (project) => set({ activeProject: project })
}))

/** 订阅主进程节点事件（应用启动后或进入画布时调用一次即可） */
let unsubscribe: (() => void) | null = null

export function postBindAiVideoEvents(): void {
  if (unsubscribe) return
  unsubscribe = onAiVideoNodeEvent((event) => {
    useAiVideoStore.getState().postApplyEvent(event)
  })
}
