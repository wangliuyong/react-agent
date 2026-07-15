import { AIMessage, HumanMessage, ToolMessage } from '@langchain/core/messages'
import { describe, expect, it } from 'vitest'
import {
  compactToolResult,
  queryLatestHumanMessage,
  trimMessagesToCharBudget
} from '../electron/main/agent/token-budget'

describe('Agent token 预算', () => {
  it('Supervisor 只读取最新一条用户消息', () => {
    const latest = new HumanMessage('请发布最新内容')
    const messages = [
      new HumanMessage('旧需求'),
      new AIMessage('旧回复'),
      new ToolMessage({
        content: '很长的工具结果',
        tool_call_id: 'tool-1'
      }),
      latest,
      new AIMessage('[路由] → general')
    ]

    expect(queryLatestHumanMessage(messages)).toBe(latest)
  })

  it('超长工具结果保留首尾关键信息并标记截断', () => {
    const result = compactToolResult('a'.repeat(8_000) + 'END', 1_000)

    expect(result.length).toBeLessThanOrEqual(1_000)
    expect(result).toContain('工具结果已截断')
    expect(result).toContain('原始长度: 8003')
    expect(result.endsWith('END')).toBe(true)
  })

  it('历史按字符预算保留最新消息，而不是固定消息条数', () => {
    const newest = new HumanMessage('最新问题')
    const messages = [
      new HumanMessage('a'.repeat(1_000)),
      new AIMessage('b'.repeat(1_000)),
      newest,
      new AIMessage('最新回答')
    ]

    const trimmed = trimMessagesToCharBudget(messages, 100)

    expect(trimmed).toEqual([newest, messages[3]])
  })

  it('裁剪后不会以孤立工具结果开头', () => {
    const latest = new HumanMessage('继续处理')
    const messages = [
      new AIMessage('a'.repeat(1_000)),
      new ToolMessage({
        content: '工具结果',
        tool_call_id: 'tool-1'
      }),
      latest
    ]

    expect(trimMessagesToCharBudget(messages, 100)).toEqual([latest])
  })
})
