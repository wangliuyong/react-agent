import { create } from 'zustand'
import { useAppStore } from '@/stores/app-store'
import type { BusinessMenuKey, ChatMode } from '../types'

interface BusinessState {
  /** 聊天页顶栏：助手 / 业务系统 */
  chatMode: ChatMode
  /** 业务系统当前选中的左侧菜单 */
  activeMenu: BusinessMenuKey
  setChatMode: (mode: ChatMode) => void
  setActiveMenu: (menu: BusinessMenuKey) => void
}

/** 业务系统 UI 状态：模式切换与菜单选中 */
export const useBusinessStore = create<BusinessState>((set) => ({
  chatMode: 'assistant',
  activeMenu: 'history',
  setChatMode: (chatMode) => {
    set({ chatMode })
    // 进入业务系统时确保停留在 chat 视图，以便 AppShell 侧边栏切换为业务菜单
    if (chatMode === 'business') {
      useAppStore.getState().setView('chat')
    }
  },
  setActiveMenu: (activeMenu) => set({ activeMenu })
}))
