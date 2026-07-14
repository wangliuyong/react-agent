import { Annotation, messagesStateReducer } from '@langchain/langgraph'
import type { BaseMessage } from '@langchain/core/messages'
import type { AgentRoleName, TaskItem } from '../../../../shared/types'

/** 聊天 / 多智能体协作图状态 */
export const AgentGraphAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => []
  }),
  sessionId: Annotation<string>,
  activeAgent: Annotation<AgentRoleName>({
    reducer: (_prev, next) => next,
    default: () => 'supervisor' as AgentRoleName
  }),
  /** 下一跳路由目标（supervisor 写入） */
  nextAgent: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => 'general'
  }),
  attachmentPaths: Annotation<string[]>({
    reducer: (_prev, next) => next,
    default: () => []
  }),
  tasks: Annotation<TaskItem[]>({
    reducer: (_prev, next) => next,
    default: () => []
  })
})

export type AgentGraphState = typeof AgentGraphAnnotation.State

/** 工作流图状态：业务 context + 节点游标 */
export const WorkflowGraphAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => []
  }),
  sessionId: Annotation<string>,
  runId: Annotation<string>,
  workflowId: Annotation<string>,
  context: Annotation<Record<string, unknown>>({
    reducer: (_prev, next) => next,
    default: () => ({})
  }),
  /** 当前顶层节点下标 */
  nodeIndex: Annotation<number>({
    reducer: (_prev, next) => next,
    default: () => 0
  }),
  /** 任务状态：nodeId → status */
  statusMap: Annotation<Record<string, string>>({
    reducer: (_prev, next) => next,
    default: () => ({})
  })
})

export type WorkflowGraphState = typeof WorkflowGraphAnnotation.State
