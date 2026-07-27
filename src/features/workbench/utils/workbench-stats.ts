import type { Session, SessionType } from '@shared/types'
import { querySessionType } from '@/features/chat/utils/querySessionType'

/** 工作台图表与指标用的会话快照（避免在工具函数里依赖 store） */
export interface WorkbenchSessionSlice {
  id: string
  title: string
  tokenUsed: number
  type: SessionType
  createdAt: number
  updatedAt: number
}

const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  chat: '对话',
  publish: '发布',
  schedule: '定时',
  workflow: '流程'
}

/** 将会话列表转为工作台统计用的轻量结构 */
export function queryWorkbenchSessionSlices(sessions: Session[]): WorkbenchSessionSlice[] {
  return sessions.map((s) => ({
    id: s.id,
    title: s.title || '未命名会话',
    tokenUsed: s.tokenUsed ?? 0,
    type: querySessionType(s),
    createdAt: s.createdAt,
    updatedAt: s.updatedAt
  }))
}

/** 累计 Token（全项目会话维度，与主进程 token_usage 落盘一致） */
export function queryTotalTokenUsed(slices: WorkbenchSessionSlice[]): number {
  return slices.reduce((sum, s) => sum + (s.tokenUsed > 0 ? s.tokenUsed : 0), 0)
}

/** 近 N 日日期标签（含今天），格式 M/D */
export function queryRecentDayLabels(days: number): string[] {
  const labels: string[] = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    labels.push(`${d.getMonth() + 1}/${d.getDate()}`)
  }
  return labels
}

/** 按自然日统计会话更新次数（updatedAt 落在该日即计一次） */
export function querySessionActivityByDay(
  slices: WorkbenchSessionSlice[],
  days: number
): number[] {
  const buckets = new Array<number>(days).fill(0)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const startMs = now.getTime() - (days - 1) * 24 * 60 * 60 * 1000

  for (const slice of slices) {
    const t = slice.updatedAt || slice.createdAt
    if (t < startMs) continue
    const dayStart = new Date(t)
    dayStart.setHours(0, 0, 0, 0)
    const index = Math.round((dayStart.getTime() - startMs) / (24 * 60 * 60 * 1000))
    if (index >= 0 && index < days) {
      buckets[index] += 1
    }
  }
  return buckets
}

/** 会话类型分布（用于饼图） */
export function querySessionTypeBreakdown(
  slices: WorkbenchSessionSlice[]
): { name: string; value: number }[] {
  const counts: Record<SessionType, number> = {
    chat: 0,
    publish: 0,
    schedule: 0,
    workflow: 0
  }
  for (const slice of slices) {
    counts[slice.type] += 1
  }
  return (Object.keys(counts) as SessionType[])
    .map((type) => ({ name: SESSION_TYPE_LABELS[type], value: counts[type] }))
    .filter((item) => item.value > 0)
}

/** Token 消耗 Top N 会话（柱状图） */
export function queryTopSessionsByToken(
  slices: WorkbenchSessionSlice[],
  limit: number
): { title: string; tokens: number }[] {
  return [...slices]
    .filter((s) => s.tokenUsed > 0)
    .sort((a, b) => b.tokenUsed - a.tokenUsed)
    .slice(0, limit)
    .map((s) => ({
      title: s.title.length > 14 ? `${s.title.slice(0, 14)}…` : s.title,
      tokens: s.tokenUsed
    }))
}

/** 数字展示：大数用千分位 */
export function formatWorkbenchCount(value: number): string {
  if (!Number.isFinite(value)) return '0'
  return value.toLocaleString('zh-CN')
}
