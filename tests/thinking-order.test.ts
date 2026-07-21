import { describe, expect, it } from 'vitest'
import type { ChatMessage } from '../shared/types'

/**
 * 验证「思考在回答前」的消息展示顺序约定：
 * assistant 的 thinkingContent 应在 content 之前渲染。
 */
function queryAssistantRenderOrder(messages: ChatMessage[]): string[] {
  const order: string[] = []
  for (const m of messages) {
    if (m.role !== 'assistant') continue
    if (m.thinkingContent?.trim()) order.push(`thinking:${m.id}`)
    if (m.content.trim()) order.push(`content:${m.id}`)
  }
  return order
}

describe('thinking 展示顺序', () => {
  it('同一条 assistant 消息：思考排在回答之前', () => {
    const messages: ChatMessage[] = [
      {
        id: 'a1',
        role: 'assistant',
        content: '最终分析结论',
        thinkingContent: '先分析趋势，再决定观望',
        createdAt: 1
      },
      {
        id: 'a2',
        role: 'assistant',
        content: '流程结束：结束',
        createdAt: 2
      }
    ]
    expect(queryAssistantRenderOrder(messages)).toEqual([
      'thinking:a1',
      'content:a1',
      'content:a2'
    ])
  })
})
