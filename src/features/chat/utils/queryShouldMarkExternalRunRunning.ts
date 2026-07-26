import type { Session } from '@shared/types'
import { queryAreAllTasksSettled } from './queryAreAllTasksSettled'
import { querySessionType } from './querySessionType'

const WORKFLOW_FINISHED_MESSAGE =
  /流程执行完毕|流程已中止|流程执行失败/

/**
 * 外部编排（流程/定时/发布）在 IPC 返回后调用 beginExternalRun。
 * 极短流程可能在返回前已 done 并落盘；此时不应再把 UI 标成「执行中」。
 */
export function queryShouldMarkExternalRunRunning(
  session: Session | null | undefined
): boolean {
  if (!session) return true

  if (session.messages.some(
    (m) => m.role === 'assistant' && WORKFLOW_FINISHED_MESSAGE.test(m.content)
  )) {
    return false
  }

  if (querySessionType(session) === 'chat') return true
  if (queryAreAllTasksSettled(session.tasks)) return false

  return true
}
