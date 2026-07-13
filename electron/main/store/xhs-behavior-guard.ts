import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { getDataRoot } from './paths'

/** 单日行为统计（按本地日期 yyyy-mm-dd 分桶） */
interface XhsDailyStats {
  date: string
  publish: number
  like: number
  comment: number
  follow: number
}

interface XhsBehaviorStore {
  days: Record<string, XhsDailyStats>
}

/** 安全阈值：普通用户维度参考 */
const LIMITS = {
  publishPerDay: 2,
  publishPerWeek: 10,
  likePerDay: 20,
  commentPerDay: 10,
  followPerDay: 5
} as const

export type XhsBehaviorAction = 'publish' | 'like' | 'comment' | 'follow'

function getStorePath(): string {
  return join(getDataRoot(), 'xhs-behavior-stats.json')
}

function todayKey(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function readStore(): XhsBehaviorStore {
  const path = getStorePath()
  if (!existsSync(path)) return { days: {} }
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as XhsBehaviorStore
  } catch {
    return { days: {} }
  }
}

function writeStore(store: XhsBehaviorStore): void {
  writeFileSync(getStorePath(), JSON.stringify(store, null, 2), 'utf-8')
}

function ensureToday(store: XhsBehaviorStore): XhsDailyStats {
  const key = todayKey()
  if (!store.days[key]) {
    store.days[key] = { date: key, publish: 0, like: 0, comment: 0, follow: 0 }
  }
  return store.days[key]
}

/** 近 7 天（含今日）发布总数 */
function queryPublishCountLast7Days(store: XhsBehaviorStore): number {
  const keys = Object.keys(store.days).sort().slice(-7)
  return keys.reduce((sum, k) => sum + (store.days[k]?.publish ?? 0), 0)
}

/**
 * 深夜 0:00～6:00 禁止自动化，符合真人作息。
 * @returns 若在静默时段返回错误文案，否则 null
 */
export function queryXhsQuietHoursBlock(): string | null {
  const hour = new Date().getHours()
  if (hour >= 0 && hour < 6) {
    return '当前为深夜静默时段（0:00～6:00），已暂停小红书自动化操作以降低风控风险。请稍后再试。'
  }
  return null
}

/**
 * 用户活跃时段参考：早 8-10、午 12-14、晚 18-22。
 * 非活跃时段仅警告，不硬阻断发布。
 */
export function queryXhsOffPeakPublishWarning(): string | null {
  const hour = new Date().getHours()
  const inPeak =
    (hour >= 8 && hour < 10) ||
    (hour >= 12 && hour < 14) ||
    (hour >= 18 && hour < 22)
  if (inPeak) return null
  return '当前不在常见用户活跃时段（早 8-10、午 12-14、晚 18-22），发布可能更易被标记为异常节奏，建议分散到活跃时段。'
}

/**
 * 发布/互动前校验频次上限。
 * 超限则抛出 Error，由上层工具返回给用户。
 */
export function assertXhsBehaviorAllowed(action: XhsBehaviorAction): void {
  const quiet = queryXhsQuietHoursBlock()
  if (quiet) {
    throw new Error(quiet)
  }

  const store = readStore()
  const today = ensureToday(store)

  if (action === 'publish') {
    if (today.publish >= LIMITS.publishPerDay) {
      throw new Error(
        `今日已发布 ${today.publish} 篇笔记，已达安全上限（≤${LIMITS.publishPerDay} 篇/日）。请明日再试。`
      )
    }
    const weekPublish = queryPublishCountLast7Days(store)
    if (weekPublish >= LIMITS.publishPerWeek) {
      throw new Error(
        `近 7 日已发布 ${weekPublish} 篇，已达安全上限（≤${LIMITS.publishPerWeek} 篇/周）。请降低发布频率。`
      )
    }
    return
  }

  if (action === 'like' && today.like >= LIMITS.likePerDay) {
    throw new Error(`今日点赞已达上限（≤${LIMITS.likePerDay} 次/日）。`)
  }
  if (action === 'comment' && today.comment >= LIMITS.commentPerDay) {
    throw new Error(`今日评论已达上限（≤${LIMITS.commentPerDay} 条/日）。`)
  }
  if (action === 'follow' && today.follow >= LIMITS.followPerDay) {
    throw new Error(`今日关注操作已达上限（≤${LIMITS.followPerDay} 次/日）。`)
  }
}

/** 成功执行后递增计数 */
export function postRecordXhsBehavior(action: XhsBehaviorAction): void {
  const store = readStore()
  const today = ensureToday(store)
  today[action] += 1
  writeStore(store)
}
