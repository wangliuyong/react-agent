import { AIMessage, HumanMessage, ToolMessage } from '@langchain/core/messages'
import { describe, expect, it } from 'vitest'
import {
  compactToolResult,
  queryLatestHumanMessage,
  sanitizeMessagesForModel,
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

  it('丢弃无对应 tool_calls 的孤立工具结果（进程重启冷启动场景）', () => {
    const human = new HumanMessage('生成一张猫的照片，不是网图')
    const messages = [
      new HumanMessage('生成一张猫的照片'),
      // 落盘时丢失了 tool_calls，只剩纯文本
      new AIMessage('抱歉，我目前没有直接生成图片的能力'),
      new ToolMessage({
        content: '已从网页保存 3 张配图',
        tool_call_id: 'call_orphan_1',
        name: 'fetch_web_images'
      }),
      new AIMessage('好啦，帮你找到了 3 张猫片'),
      human
    ]

    const sanitized = sanitizeMessagesForModel(messages)

    expect(sanitized).toEqual([
      messages[0],
      messages[1],
      messages[3],
      human
    ])
    expect(sanitized.some((m) => ToolMessage.isInstance(m))).toBe(false)
  })

  it('保留能配对到 tool_calls 的工具结果', () => {
    const aiWithTools = new AIMessage({
      content: '',
      tool_calls: [
        {
          id: 'call_ok',
          name: 'fetch_web_images',
          args: { pageUrl: 'https://example.com' },
          type: 'tool_call'
        }
      ]
    })
    const tool = new ToolMessage({
      content: 'ok',
      tool_call_id: 'call_ok',
      name: 'fetch_web_images'
    })
    const final = new AIMessage('完成')

    expect(sanitizeMessagesForModel([aiWithTools, tool, final])).toEqual([
      aiWithTools,
      tool,
      final
    ])
  })
})
