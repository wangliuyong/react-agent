import type { Session } from '@shared/types'

/** 创建空会话对象（尚未落盘） */
export function createEmptySession(id: string): Session {
  const now = Date.now()
  return {
    id,
    title: '新对话',
    messages: [],
    tasks: [],
    tokenUsed: 0,
    createdAt: now,
    updatedAt: now
  }
}

export function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts
  const min = Math.floor(diff / 60_000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `${hour} 小时`
  const day = Math.floor(hour / 24)
  return `${day} 天`
}
