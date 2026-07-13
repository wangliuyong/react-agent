import type { NavItem } from '../types'

/** 侧边栏主导航静态配置（图标与路由 key 一一对应） */
export const NAV_ITEMS: NavItem[] = [
  { key: 'skills', label: '技能市场', icon: <ThunderboltOutlined /> },
  { key: 'rules', label: '规则', icon: <UnorderedListOutlined />, placeholder: true },
  { key: 'channels', label: '渠道', icon: <ApiOutlined /> },
  { key: 'publish', label: '发布', icon: <CloudUploadOutlined /> },
  { key: 'schedule', label: '定时任务', icon: <ClockCircleOutlined /> }
]

/** 按 view key 查找导航项，用于占位页展示 */
export function queryNavItem(view: NavItem['key']): NavItem | undefined {
  return NAV_ITEMS.find((item) => item.key === view)
}
