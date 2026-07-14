import type OpenAI from 'openai'
import type { TaskItem } from '../../../../shared/types'

/** 工具权限级别：敏感操作需用户确认或完全访问模式 */
export type ToolPermission = 'safe' | 'sensitive' | 'dangerous'

export interface ToolContext {
  sessionId: string
  fullAccess: boolean
  /** 附件路径（用户本轮上传） */
  attachmentPaths: string[]
  /** 向 UI 推送 await_user 等事件 */
  emitAwaitUser: (reason: string) => Promise<void>
  /** 更新任务清单（含 workflow skipped） */
  updateTasks: (updater: (tasks: TaskItem[]) => TaskItem[]) => void
  signal?: AbortSignal
}

export interface AgentTool {
  name: string
  description: string
  permission: ToolPermission
  parameters: Record<string, unknown>
  execute: (args: Record<string, unknown>, ctx: ToolContext) => Promise<string>
}

/** 转为 OpenAI tools schema */
export function toOpenAiTools(tools: AgentTool[]): OpenAI.Chat.Completions.ChatCompletionTool[] {
  return tools.map((t) => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters
    }
  }))
}
