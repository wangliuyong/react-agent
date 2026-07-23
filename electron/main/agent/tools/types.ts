import type { ModelCapability, TaskItem, ToolProgressPayload, UserChoiceOption } from '../../../../shared/types'
import type { UserContinueResult } from '../choice-resolver'

/** 工具权限级别：敏感操作需用户确认或完全访问模式 */
export type ToolPermission = 'safe' | 'sensitive' | 'dangerous'

export interface ToolContext {
  sessionId: string
  fullAccess: boolean
  /** 附件路径（用户本轮上传） */
  attachmentPaths: string[]
  /**
   * 暂停执行并等待用户确认；可选结构化方案列表。
   * @returns 用户选择结果（含 choiceId / choiceLabel / userInput）
   */
  emitAwaitUser: (
    reason: string,
    choices?: UserChoiceOption[]
  ) => Promise<UserContinueResult>
  /** 更新任务清单（含 workflow skipped） */
  updateTasks: (updater: (tasks: TaskItem[]) => TaskItem[]) => void
  signal?: AbortSignal
  /** 读取当前任务模型能力（供 switch_model / 路由模型使用） */
  queryActiveCapability?: () => ModelCapability | undefined
  /**
   * 写入当前任务模型能力，并应同步推送 model_switch 事件。
   * 为什么：ReAct 中途换模后 UI 与下一轮 LLM 选型需一致。
   */
  postActiveCapability?: (capability: ModelCapability) => void
  /** 推送长耗时工具进度到 UI（如 Remotion 渲染） */
  emitToolProgress?: (toolName: string, progress: ToolProgressPayload) => void
}

export interface AgentTool {
  name: string
  description: string
  permission: ToolPermission
  parameters: Record<string, unknown>
  execute: (args: Record<string, unknown>, ctx: ToolContext) => Promise<string>
}
