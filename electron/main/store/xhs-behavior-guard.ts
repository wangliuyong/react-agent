import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { getDataRoot } from './paths'
import { querySession } from './sessions'

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
  /** 最近一次成功发布的时间戳（用于观察期 48h 间隔） */
  lastPublishAt?: number
}

/** 解封后观察期天数（自 OBSERVATION_START 起算） */
const OBSERVATION_DAYS = 14
const OBSERVATION_START = '2026-08-04'

/** 安全阈值 */
const LIMITS = {
  publishPerDayStable: 1,
  publishPerDayObservation: 1,
  publishPerWeekStable: 7,
  publishPerWeekObservation: 3,
  minHoursBetweenPublishObservation: 48
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

function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function isDateInRange(key: string, start: string, end: string): boolean {
  const t = parseDateKey(key).getTime()
  return t >= parseDateKey(start).getTime() && t <= parseDateKey(end).getTime()
}

function queryInObservationPeriod(): boolean {
  const today = todayKey()
  if (parseDateKey(today) < parseDateKey(OBSERVATION_START)) return false
  const end = new Date(parseDateKey(OBSERVATION_START))
  end.setDate(end.getDate() + OBSERVATION_DAYS)
  const endKey = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`
  return isDateInRange(today, OBSERVATION_START, endKey)
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
 * 仅允许 8:00～23:00 发布；0:00～6:00 由 queryXhsQuietHoursBlock 另行禁止。
 */
export function queryXhsPublishWindowBlock(): string | null {
  const now = new Date()
  const minutes = now.getHours() * 60 + now.getMinutes()
  const windowStart = 8 * 60
  const windowEnd = 23 * 60
  const inWindow = minutes >= windowStart && minutes <= windowEnd
  if (inWindow) return null
  return (
    '当前不在允许的小红书脚本发布时段（8:00～23:00）。' +
    '请改在允许时段由本人在场手动启动发布；深夜 0:00～6:00 亦禁止自动化。'
  )
}

/**
 * 深夜 0:00～6:00 禁止自动化。
 */
export function queryXhsQuietHoursBlock(): string | null {
  const hour = new Date().getHours()
  if (hour >= 0 && hour < 6) {
    return '当前为深夜静默时段（0:00～6:00），已暂停小红书自动化操作以降低风控风险。请稍后再试。'
  }
  return null
}

/**
 * @deprecated 已由 queryXhsPublishWindowBlock 硬约束；保留兼容仅作提示
 */
export function queryXhsOffPeakPublishWarning(): string | null {
  const block = queryXhsPublishWindowBlock()
  return block
}

/**
 * 定时任务 / 无人值守编排会话禁止走小红书拟人发布，规避「AI 托管」判定。
 */
export function queryXhsUnattendedBlock(sessionId?: string): string | null {
  if (!sessionId) return null
  const session = querySession(sessionId)
  if (!session) return null
  if (session.title.startsWith('[定时]')) {
    return (
      '检测到当前会话来自定时任务自动触发。小红书发布已禁止无人值守执行，' +
      '请由本人在场于聊天中手动发起发布，或关闭相关定时任务中的小红书步骤。'
    )
  }
  if (session.title.startsWith('[流程]')) {
    return (
      '检测到当前会话来自流程自动编排。小红书拟人发布仅支持人工主动触发的一次性会话，' +
      '请在工作台手动执行发布步骤，勿用定时/后台流程托管发文。'
    )
  }
  return null
}

function queryObservationIntervalBlock(store: XhsBehaviorStore): string | null {
  if (!queryInObservationPeriod()) return null
  const last = store.lastPublishAt
  if (!last) return null
  const elapsedH = (Date.now() - last) / (1000 * 60 * 60)
  if (elapsedH < LIMITS.minHoursBetweenPublishObservation) {
    const waitH = Math.ceil(LIMITS.minHoursBetweenPublishObservation - elapsedH)
    return `解封观察期内每 2 天最多发布 1 条。距上次发布未满 48 小时，请约 ${waitH} 小时后再试，或改用手动网页发布。`
  }
  return null
}

/**
 * 发布/互动前校验。互动类自动化已永久禁用。
 */
export function assertXhsBehaviorAllowed(action: XhsBehaviorAction, sessionId?: string): void {
  const unattended = queryXhsUnattendedBlock(sessionId)
  if (unattended) throw new Error(unattended)

  const quiet = queryXhsQuietHoursBlock()
  if (quiet) throw new Error(quiet)

  if (action === 'like' || action === 'comment' || action === 'follow') {
    throw new Error('小红书点赞/评论/关注等互动自动化已永久关闭，请改用手动操作。')
  }

  if (action !== 'publish') return

  const windowBlock = queryXhsPublishWindowBlock()
  if (windowBlock) throw new Error(windowBlock)

  const store = readStore()
  const today = ensureToday(store)
  const observation = queryInObservationPeriod()
  const dayLimit = observation
    ? LIMITS.publishPerDayObservation
    : LIMITS.publishPerDayStable
  const weekLimit = observation
    ? LIMITS.publishPerWeekObservation
    : LIMITS.publishPerWeekStable

  const intervalBlock = queryObservationIntervalBlock(store)
  if (intervalBlock) throw new Error(intervalBlock)

  if (today.publish >= dayLimit) {
    throw new Error(`今日已发布 ${today.publish} 篇笔记，已达安全上限（≤${dayLimit} 篇/日）。请明日再试。`)
  }
  const weekPublish = queryPublishCountLast7Days(store)
  if (weekPublish >= weekLimit) {
    throw new Error(
      `近 7 日已发布 ${weekPublish} 篇，已达${observation ? '观察期' : ''}安全上限（≤${weekLimit} 篇/周）。请降低发布频率。`
    )
  }
}

/** 成功执行后递增计数 */
export function postRecordXhsBehavior(action: XhsBehaviorAction): void {
  const store = readStore()
  const today = ensureToday(store)
  today[action] += 1
  if (action === 'publish') {
    store.lastPublishAt = Date.now()
  }
  writeStore(store)
}
