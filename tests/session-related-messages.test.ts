import { describe, expect, it } from 'vitest'
import type { ChatMessage, Session, TaskItem } from '../shared/types'
import { queryRelatedMessagesByTask } from '../shared/session-related-messages'
import { WORKFLOW_NODE_EXECUTIONS_KEY } from '../shared/workflow-node-execution'

function msg(id: string, role: ChatMessage['role'], content: string, extra?: Partial<ChatMessage>): ChatMessage {
  return {
    id,
    role,
    content,
    createdAt: 1,
    ...extra
  }
}

describe('queryRelatedMessagesByTask', () => {
  it('按 Agent 步骤 prompt 锚点切分消息', () => {
    const tasks: TaskItem[] = [
      { id: 'n1', title: '获取实时天气数据', status: 'done' },
      { id: 'n2', title: '生成图表', status: 'done' }
    ]
    const messages: ChatMessage[] = [
      msg('m0', 'user', '合肥天气'),
      msg('m1', 'user', '【工作流步骤】获取实时天气数据\n\n请查询天气', { hidden: true }),
      msg('m2', 'assistant', '天气晴朗'),
      msg('m3', 'user', '【工作流步骤】生成图表\n\n画图', { hidden: true }),
      msg('m4', 'assistant', '图表已生成')
    ]
    const session = { messages, tasks } as Session
    const context = {
      [WORKFLOW_NODE_EXECUTIONS_KEY]: {
        n1: {
          nodeId: 'n1',
          nodeType: 'agent',
          title: '获取实时天气数据',
          contextSnapshot: {},
          input: {
            prompt: '【工作流步骤】获取实时天气数据\n\n请查询天气'
          },
          output: {},
          executedAt: 1
        },
        n2: {
          nodeId: 'n2',
          nodeType: 'agent',
          title: '生成图表',
          contextSnapshot: {},
          input: {
            prompt: '【工作流步骤】生成图表\n\n画图'
          },
          output: {},
          executedAt: 2
        }
      }
    }

    const map = queryRelatedMessagesByTask(session, tasks, context)
    expect(map.get('n1')?.map((m) => m.id)).toEqual(['m1', 'm2'])
    expect(map.get('n2')?.map((m) => m.id)).toEqual(['m3', 'm4'])
  })

  it('优先使用 messageRange', () => {
    const tasks: TaskItem[] = [{ id: 't1', title: '工具步', status: 'done' }]
    const messages: ChatMessage[] = [
      msg('a', 'user', 'hello'),
      msg('b', 'tool', 'ok', { toolName: 'weather' })
    ]
    const session = { messages, tasks } as Session
    const context = {
      [WORKFLOW_NODE_EXECUTIONS_KEY]: {
        t1: {
          nodeId: 't1',
          nodeType: 'tool',
          title: '工具步',
          contextSnapshot: {},
          input: { toolName: 'weather' },
          output: {},
          executedAt: 1,
          messageRange: { from: 1, to: 2 }
        }
      }
    }
    const map = queryRelatedMessagesByTask(session, tasks, context)
    expect(map.get('t1')?.map((m) => m.id)).toEqual(['b'])
  })
})
