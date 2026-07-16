import type { AppView } from '@/stores/app-store'
import type { SessionType } from '@shared/types'

/** 侧边栏主导航项配置 */
export interface NavItem {
  key: AppView
  label: string
  icon: React.ReactNode
  /** 占位视图，功能尚未实现 */
  placeholder?: boolean
}

/** 历史会话列表项（展示层 DTO，与 store Session 字段对齐） */
export interface SessionHistoryItem {
  id: string
  title: string
  updatedAt: number
  /** 会话类型，用于历史列表图标 */
  type: SessionType
  /** 是否正在执行，用于历史列表图标 loading */
  running: boolean
}
