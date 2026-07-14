import type { Session, SessionType } from '@shared/types'

/** 发布类会话首条用户消息的特征片段（与 buildPublishPlanPrompt 输出对齐） */
const PUBLISH_PROMPT_MARKERS = ['请按顺序串行执行以下', '请帮我在', '发布一条内容']

/**
 * 解析会话类型：优先读持久化字段，旧数据按标题与首条消息启发式推断。
 */
export function querySessionType(
  session: Pick<Session, 'type' | 'title' | 'messages'>
): SessionType {
  if (session.type) return session.type

  // 定时任务会话标题带 [定时] 前缀（见 scheduler.createScheduleSession）
  if (session.title.startsWith('[定时]')) return 'schedule'

  // 工作流引擎创建的会话标题带 [流程] 前缀
  if (session.title.startsWith('[流程]')) return 'workflow'

  const firstUser = session.messages.find((m) => m.role === 'user')
  if (
    firstUser &&
    PUBLISH_PROMPT_MARKERS.some((marker) => firstUser.content.includes(marker))
  ) {
    return 'publish'
  }

  return 'chat'
}
