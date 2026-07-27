import { describe, expect, it } from 'vitest'
import { AIMessage, HumanMessage, ToolMessage } from '@langchain/core/messages'
import {
  queryFormatAgentErrorMessage,
  queryLastToolNameFromMessages
} from '../electron/main/agent/query-format-agent-error'

describe('queryFormatAgentErrorMessage', () => {
  it('附加工具、角色、Agent、连接信息', () => {
    expect(
      queryFormatAgentErrorMessage('Access denied', {
        toolName: 'fetch_hot_topics',
        roleId: 'researcher',
        agentName: 'role_researcher',
        connectionLabel: '文生图',
        provider: 'dashscope',
        model: 'qwen-plus'
      })
    ).toBe(
      'Access denied（工具：fetch_hot_topics，角色：调研员，Agent：role_researcher，连接：文生图 · dashscope · qwen-plus）'
    )
  })

  it('缺省字段时只拼接已有项', () => {
    expect(
      queryFormatAgentErrorMessage('失败', {
        roleId: 'supervisor',
        agentName: 'supervisor'
      })
    ).toBe('失败（角色：调度器，Agent：supervisor）')
  })

  it('已含角色与 Agent 上下文时不重复追加', () => {
    const once = 'x（角色：b，Agent：c）'
    expect(
      queryFormatAgentErrorMessage(once, {
        toolName: 'a',
        roleName: 'b',
        agentName: 'c'
      })
    ).toBe(once)
  })
})

describe('queryLastToolNameFromMessages', () => {
  it('优先取最近的 ToolMessage 名', () => {
    const name = queryLastToolNameFromMessages([
      new HumanMessage('hi'),
      new AIMessage({
        content: '',
        tool_calls: [{ id: '1', name: 'old_tool', args: {}, type: 'tool_call' }]
      }),
      new ToolMessage({ content: 'ok', tool_call_id: '1', name: 'fetch_hot_topics' })
    ])
    expect(name).toBe('fetch_hot_topics')
  })

  it('无 ToolMessage 时取 pending tool_calls', () => {
    const name = queryLastToolNameFromMessages([
      new AIMessage({
        content: '',
        tool_calls: [
          { id: '1', name: 'generate_image', args: {}, type: 'tool_call' }
        ]
      })
    ])
    expect(name).toBe('generate_image')
  })
})
