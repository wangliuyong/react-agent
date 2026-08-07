import type { Session } from '@shared/types'
import { queryIsFreshChatSession } from './queryIsFreshChatSession'

/**
 * 在会话列表中选取应复用的空「新对话」：取 updatedAt 最新的一条。
 * 无空会话时返回 undefined，调用方应真正创建。
 */
export function queryExistingFreshChatSession(
  sessions: Array<Pick<Session, 'id' | 'title' | 'messages' | 'type' | 'updatedAt'>>
): (typeof sessions)[number] | undefined {
  let best: (typeof sessions)[number] | undefined
  for (const session of sessions) {
    if (!queryIsFreshChatSession(session)) continue
    if (!best || session.updatedAt >= best.updatedAt) {
      best = session
    }
  }
  return best
}

/**
 * 将指定空会话置顶并刷新 updatedAt，其余会话相对顺序不变。
 * 用于「再次点击新对话」时让目标会话回到列表头部（即便历史区会过滤空会话）。
 */
export function queryPromoteSessionToFront(
  sessions: Session[],
  sessionId: string,
  now = Date.now()
): Session[] {
  const target = sessions.find((s) => s.id === sessionId)
  if (!target) return sessions
  const promoted: Session = { ...target, updatedAt: now }
  return [promoted, ...sessions.filter((s) => s.id !== sessionId)]
}

/**
 * 侧边栏「历史对话」：排除空「新对话」（由顶部入口高亮代表），只展示已产生内容的会话。
 */
export function queryHistorySessions<T extends Pick<Session, 'title' | 'messages' | 'type'>>(
  sessions: T[]
): T[] {
  return sessions.filter((s) => !queryIsFreshChatSession(s))
}
