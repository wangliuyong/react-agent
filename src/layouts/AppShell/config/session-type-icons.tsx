import type { SessionType } from '@shared/types'

/** 会话类型 → 侧边栏历史项图标（与主导航语义对齐） */
export const SESSION_TYPE_ICONS: Record<SessionType, React.ReactNode> = {
  chat: <MessageOutlined />,
  publish: <CloudUploadOutlined />,
  schedule: <ClockCircleOutlined />,
  workflow: <AppstoreOutlined />
}

/** 历史对话类型筛选值：全部 + 各业务类型 */
export type SessionTypeFilter = 'all' | SessionType

/**
 * 历史对话类型筛选 Segmented 选项。
 * 图标与 SESSION_TYPE_ICONS、侧边栏主导航保持一致，便于扫读与识别。
 */
export const SESSION_TYPE_FILTER_OPTIONS: {
  label: string
  value: SessionTypeFilter
  icon: React.ReactNode
}[] = [
  { label: '全部', value: 'all', icon: <UnorderedListOutlined /> },
  { label: '对话', value: 'chat', icon: SESSION_TYPE_ICONS.chat },
  { label: '发布', value: 'publish', icon: SESSION_TYPE_ICONS.publish },
  { label: '定时', value: 'schedule', icon: SESSION_TYPE_ICONS.schedule },
  { label: '流程', value: 'workflow', icon: SESSION_TYPE_ICONS.workflow }
]
