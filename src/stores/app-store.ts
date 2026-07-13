import { create } from 'zustand'

/** 主内容区视图：聊天 / 发布工作台 / 设置 / 技能；规则等为占位 */
export type AppView = 'chat' | 'publish' | 'settings' | 'skills' | 'rules' | 'channels' | 'schedule'

interface AppState {
  view: AppView
  sidebarCollapsed: boolean
  setView: (view: AppView) => void
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>((set) => ({
  view: 'chat',
  sidebarCollapsed: false,
  setView: (view) => set({ view }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed }))
}))
