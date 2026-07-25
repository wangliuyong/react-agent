import type { AgentRule, PublishPlan, ScheduledTask } from '../../../shared/types'
import { IpcChannels } from '../../../shared/types'
import { queryAgentRules } from './rules'
import { queryPublishPlans } from './plans'
import { queryScheduledTasks } from './schedules'
import { getMainWindow } from '../window'

/** 向渲染进程推送最新定时任务列表（调度器、Agent 工具、IPC 保存共用） */
export function emitScheduleUpdate(): void {
  const win = getMainWindow()
  if (win && !win.isDestroyed()) {
    win.webContents.send(IpcChannels.onScheduleUpdate, queryScheduledTasks())
  }
}

/** 向渲染进程推送最新发布计划列表 */
export function emitPublishPlansUpdate(): void {
  const win = getMainWindow()
  if (win && !win.isDestroyed()) {
    win.webContents.send(IpcChannels.onPublishPlansUpdate, queryPublishPlans())
  }
}

/** 向渲染进程推送最新 Agent 规则列表 */
export function emitAgentRulesUpdate(): void {
  const win = getMainWindow()
  if (win && !win.isDestroyed()) {
    win.webContents.send(IpcChannels.onAgentRulesUpdate, queryAgentRules())
  }
}
