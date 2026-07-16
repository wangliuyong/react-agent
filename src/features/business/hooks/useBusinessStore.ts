import { create } from 'zustand'
import type { BusinessMenuKey } from '../types'

const MENU_STORAGE_KEY = 'lingxi:business-menu'

const BUSINESS_MENUS: BusinessMenuKey[] = ['history']

/** 从 localStorage 恢复业务系统左侧菜单选中项 */
function queryPersistedActiveMenu(): BusinessMenuKey {
  try {
    const raw = localStorage.getItem(MENU_STORAGE_KEY)
    if (raw && BUSINESS_MENUS.includes(raw as BusinessMenuKey)) {
      return raw as BusinessMenuKey
    }
  } catch {
    /* 忽略 */
  }
  return 'history'
}

function postPersistActiveMenu(menu: BusinessMenuKey): void {
  try {
    localStorage.setItem(MENU_STORAGE_KEY, menu)
  } catch {
    /* 忽略 */
  }
}

interface BusinessState {
  /** 业务系统当前选中的左侧菜单 */
  activeMenu: BusinessMenuKey
  setActiveMenu: (menu: BusinessMenuKey) => void
}

/** 业务系统 UI 状态：菜单选中（刷新后保持） */
export const useBusinessStore = create<BusinessState>((set) => ({
  activeMenu: queryPersistedActiveMenu(),
  setActiveMenu: (activeMenu) => {
    postPersistActiveMenu(activeMenu)
    set({ activeMenu })
  }
}))
