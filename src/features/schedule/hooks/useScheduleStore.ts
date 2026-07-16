import { create } from 'zustand'
import type { ScheduledTask } from '@shared/types'
import {
  postDeleteScheduledTask,
  postImportBuiltinScheduledTasks,
  postInitScheduledTasks,
  postRunScheduledTask,
  postScheduledTask,
  queryScheduledTasks
} from '../api'
import { createEmptyScheduledTask } from '../types'

interface ScheduleState {
  tasks: ScheduledTask[]
  activeTaskId: string | null
  hydrate: () => Promise<void>
  setActive: (id: string | null) => void
  createTask: () => Promise<ScheduledTask>
  saveTask: (task: ScheduledTask) => Promise<ScheduledTask>
  removeTask: (id: string) => Promise<void>
  toggleEnabled: (id: string, enabled: boolean) => Promise<void>
  runNow: (id: string) => Promise<ScheduledTask | null>
  /** 导入内置定时任务（按固定 id 去重，默认未启用） */
  addBuiltinTasks: () => Promise<ScheduledTask[]>
  bindScheduleUpdates: () => () => void
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  tasks: [],
  activeTaskId: null,

  hydrate: async () => {
    // 首次启动或磁盘为空时，自动写入内置定时任务
    let tasks = await queryScheduledTasks()
    if (tasks.length === 0) {
      tasks = await postInitScheduledTasks()
    }
    set({
      tasks,
      activeTaskId: get().activeTaskId ?? tasks[0]?.id ?? null
    })
  },

  setActive: (id) => set({ activeTaskId: id }),

  createTask: async () => {
    const task = createEmptyScheduledTask()
    const saved = await postScheduledTask(task)
    set((s) => ({
      tasks: [saved, ...s.tasks],
      activeTaskId: saved.id
    }))
    return saved
  },

  saveTask: async (task) => {
    const saved = await postScheduledTask(task)
    set((s) => {
      const exists = s.tasks.some((t) => t.id === saved.id)
      return {
        tasks: exists
          ? s.tasks.map((t) => (t.id === saved.id ? saved : t))
          : [saved, ...s.tasks],
        activeTaskId: exists ? s.activeTaskId : saved.id
      }
    })
    return saved
  },

  removeTask: async (id) => {
    await postDeleteScheduledTask(id)
    set((s) => {
      const tasks = s.tasks.filter((t) => t.id !== id)
      return {
        tasks,
        activeTaskId: s.activeTaskId === id ? (tasks[0]?.id ?? null) : s.activeTaskId
      }
    })
  },

  toggleEnabled: async (id, enabled) => {
    const task = get().tasks.find((t) => t.id === id)
    if (!task) return
    await get().saveTask({ ...task, enabled })
  },

  runNow: async (id) => {
    const result = await postRunScheduledTask(id)
    if (result) {
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === result.id ? result : t))
      }))
    }
    return result
  },

  /** 导入内置定时任务：每日发布 + 昨日热点 + 周一调研 + 周五文娱 */
  addBuiltinTasks: async () => {
    const tasks = await postImportBuiltinScheduledTasks()
    set({
      tasks,
      activeTaskId: get().activeTaskId ?? tasks[0]?.id ?? null
    })
    return tasks
  },

  /** 订阅主进程调度器推送，保持列表与执行状态同步 */
  bindScheduleUpdates: () => {
    return window.api.onScheduleUpdate((tasks) => {
      set({ tasks })
    })
  }
}))
