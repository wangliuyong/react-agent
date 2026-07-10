import { create } from 'zustand'
import type { AppSettings } from '@shared/types'
import { DEFAULT_SETTINGS } from '@shared/types'

interface SettingsState {
  settings: AppSettings
  loaded: boolean
  hydrate: () => Promise<void>
  postSettings: (partial: Partial<AppSettings>) => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: { ...DEFAULT_SETTINGS },
  loaded: false,
  hydrate: async () => {
    const settings = await window.api.querySettings()
    set({ settings, loaded: true })
  },
  postSettings: async (partial) => {
    const settings = await window.api.postSettings(partial)
    set({ settings })
  }
}))
