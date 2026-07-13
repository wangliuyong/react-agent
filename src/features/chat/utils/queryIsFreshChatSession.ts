import type { Session } from '@shared/types'
import { querySessionType } from './querySessionType'

/**
 * 是否为「新对话」空会话：标题未改、无消息、类型为普通聊天。
 * 用于侧边栏「新对话」入口高亮，以及与历史列表选中态互斥。
 */
export function queryIsFreshChatSession(
  session: Pick<Session, 'title' | 'messages' | 'type'> | null | undefined
): boolean {
  if (!session) return false
  return (
    session.title === '新对话' &&
    session.messages.length === 0 &&
    querySessionType(session) === 'chat'
  )
}
