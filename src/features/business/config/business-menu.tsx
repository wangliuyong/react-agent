import type { BusinessMenuItem } from '../types'

/** 业务系统左侧菜单（AppShell 侧边栏与内容区共用） */
export const BUSINESS_MENUS: BusinessMenuItem[] = [
  {
    key: 'history',
    label: '历史对话',
    icon: <HistoryOutlined />,
    description: '查看、删除与上下文追溯'
  }
]
