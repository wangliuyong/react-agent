import type { ChatMessage, Session, TaskItem, WorkflowRun } from '@shared/types'

/** 顶栏模式：灵犀助手 / 业务系统 */
export type ChatMode = 'assistant' | 'business'

/** 业务系统左侧菜单项 */
export type BusinessMenuKey = 'history'

/** 业务系统菜单配置 */
export interface BusinessMenuItem {
  key: BusinessMenuKey
  label: string
  icon: React.ReactNode
  description?: string
}

/** 会话级上下文摘要（业务系统「查看上下文」） */
export interface SessionContextSummary {
  session: Session
  /** 关联的工作流运行（publish / schedule / workflow 会话可能有） */
  workflowRun: WorkflowRun | null
  /** 格式化后的 workflow context JSON */
  workflowContextJson: string
  /** 消息总数 */
  messageCount: number
  /** 任务节点总数 */
  taskCount: number
}

/** 单个任务节点（工作流步骤）的执行上下文 */
export interface NodeExecutionContext {
  task: TaskItem
  /** 与该节点相关的消息（按标题 / 工具名 / 步骤标记匹配） */
  relatedMessages: ChatMessage[]
  /** 从 WorkflowRun.context 中提取的与该节点相关的键值 */
  contextSlice: Record<string, unknown>
  /** 格式化的 context JSON，便于 Drawer 展示 */
  contextJson: string
}
