import { create } from 'zustand'

/** 主内容区视图：聊天 / 业务系统 / 工作台 / 发布 / 设置 / 技能 / 规则 / 定时 / 流程 / Remotion 视频 */
export type AppView =
  | 'chat'
  | 'business'
  | 'workbench'
  | 'publish'
  | 'settings'
  | 'skills'
  | 'rules'
  | 'schedule'
  | 'workflows'
  | 'remotion-video'

const VIEW_STORAGE_KEY = 'lingxi:app-view'
const SETTINGS_TAB_STORAGE_KEY = 'lingxi:settings-tab'

const APP_VIEWS: AppView[] = [
  'chat',
  'business',
  'workbench',
  'publish',
  'settings',
  'skills',
  'rules',
  'schedule',
  'workflows',
  'remotion-video'
]

/** 从 localStorage 恢复上次停留的主视图（刷新后仍停留在业务系统等页面） */
function queryPersistedView(): AppView {
  try {
    const raw = localStorage.getItem(VIEW_STORAGE_KEY)
    // 渠道已并入设置 Tab；兼容旧版持久化的独立「渠道」视图
    if (raw === 'channels') {
      try {
        localStorage.setItem(SETTINGS_TAB_STORAGE_KEY, 'channels')
      } catch {
        /* 忽略 */
      }
      return 'settings'
    }
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
