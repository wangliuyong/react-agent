import { create } from 'zustand'

/** 主内容区视图：聊天 / 业务系统 / 发布工作台 / 设置 / 技能 / 规则 / 渠道 / 定时 / 流程 */
export type AppView =
  | 'chat'
  | 'business'
  | 'publish'
  | 'settings'
  | 'skills'
  | 'rules'
  | 'channels'
  | 'schedule'
  | 'workflows'

const VIEW_STORAGE_KEY = 'lingxi:app-view'

const APP_VIEWS: AppView[] = [
  'chat',
  'business',
  'publish',
  'settings',
  'skills',
  'rules',
  'channels',
  'schedule',
  'workflows'
]

/** 从 localStorage 恢复上次停留的主视图（刷新后仍停留在业务系统等页面） */
function queryPersistedView(): AppView {
  try {
    const raw = localStorage.getItem(VIEW_STORAGE_KEY)
    if (raw && APP_VIEWS.includes(raw as AppView)) {
      return raw as AppView
    }
  } catch {
    /* 隐私模式或存储不可用时回退默认 chat */
  }
  return 'chat'
}

/** 持久化当前主视图 */
function postPersistView(view: AppView): void {
  try {
    localStorage.setItem(VIEW_STORAGE_KEY, view)
  } catch {
    /* 忽略写入失败 */
  }
}

interface AppState {
  view: AppView
  sidebarCollapsed: boolean
  setView: (view: AppView) => void
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>((set) => ({
  view: queryPersistedView(),
  sidebarCollapsed: false,
  setView: (view) => {
    postPersistView(view)
    set({ view })
  },
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed }))
}))
