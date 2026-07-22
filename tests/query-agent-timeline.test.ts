import { describe, expect, it } from 'vitest'
import type { ChatMessage } from '../shared/types'
import {
  queryAgentTimeline,
  queryIsSyntheticToolCallContent,
  queryTimelineEndsWithToolGroup
} from '../src/features/chat/utils/queryAgentTimeline'

function msg(partial: Partial<ChatMessage> & Pick<ChatMessage, 'id' | 'role'>): ChatMessage {
  return {
    content: '',
    createdAt: 0,
    ...partial
  }
}

describe('queryIsSyntheticToolCallContent', () => {
  it('识别合成调用工具文案', () => {
    expect(queryIsSyntheticToolCallContent('调用工具: a, b')).toBe(true)
    expect(queryIsSyntheticToolCallContent('  调用工具: browser_navigate  ')).toBe(true)
  })

  it('普通叙述不算合成', () => {
    expect(queryIsSyntheticToolCallContent('我将打开三个标签页搜索')).toBe(false)
    expect(queryIsSyntheticToolCallContent('')).toBe(false)
  })
})

describe('queryAgentTimeline', () => {
  it('将 assistant + 配对 tool 收拢为一步', () => {
    const messages = [
      msg({ id: 'u1', role: 'user', content: '搜一下' }),
      msg({
        id: 'a1',
        role: 'assistant',
        content: '先建任务再开浏览器',
        toolCalls: [
          { id: 'c1', name: 'update_task_list', args: {} },
          { id: 'c2', name: 'browser_navigate', args: {} }
        ]
      }),
      msg({
        id: 't1',
        role: 'tool',
        content: 'ok tasks',
        toolName: 'update_task_list',
        toolCallId: 'c1'
      }),
      msg({
        id: 't2',
        role: 'tool',
        content: 'ok nav',
        toolName: 'browser_navigate',
        toolCallId: 'c2'
      }),
      msg({ id: 'a2', role: 'assistant', content: '汇总如下…' })
    ]

    const timeline = queryAgentTimeline(messages)
    expect(timeline).toHaveLength(3)
    expect(timeline[0]).toMatchObject({ kind: 'user' })
    expect(timeline[1]).toMatchObject({
      kind: 'step',
      tools: [{ id: 't1' }, { id: 't2' }]
    })
    expect(timeline[2]).toMatchObject({
      kind: 'step',
      assistant: { id: 'a2' },
      tools: []
    })
  })

  it('工具结果按 toolCalls 声明顺序排列', () => {
    const messages = [
      msg({
        id: 'a1',
        role: 'assistant',
        content: '调用工具: a, b',
        toolCalls: [
          { id: 'c1', name: 'a', args: {} },
          { id: 'c2', name: 'b', args: {} }
        ]
      }),
      // 返回顺序与声明相反
      msg({ id: 't2', role: 'tool', content: 'b', toolCallId: 'c2', toolName: 'b' }),
      msg({ id: 't1', role: 'tool', content: 'a', toolCallId: 'c1', toolName: 'a' })
    ]
    const step = queryAgentTimeline(messages)[0]
    expect(step?.kind).toBe('step')
    if (step?.kind === 'step') {
      expect(step.tools.map((t) => t.id)).toEqual(['t1', 't2'])
    }
  })

  it('无法配对的 tool 记为 orphanTool', () => {
    const messages = [
      msg({ id: 't0', role: 'tool', content: '@@stock_chart@@{}', toolName: 'query_ashare_kline' })
    ]
    const timeline = queryAgentTimeline(messages)
    expect(timeline).toEqual([
      expect.objectContaining({ kind: 'orphanTool', message: expect.objectContaining({ id: 't0' }) })
    ])
  })

  it('遇非本轮 toolCallId 停止吞并', () => {
    const messages = [
      msg({
        id: 'a1',
        role: 'assistant',
        content: '一步',
        toolCalls: [{ id: 'c1', name: 'a', args: {} }]
      }),
      msg({ id: 't1', role: 'tool', content: 'a', toolCallId: 'c1', toolName: 'a' }),
      msg({ id: 't-orphan', role: 'tool', content: 'x', toolCallId: 'other', toolName: 'x' })
    ]
    const timeline = queryAgentTimeline(messages)
    expect(timeline).toHaveLength(2)
    expect(timeline[0]).toMatchObject({ kind: 'step', tools: [{ id: 't1' }] })
    expect(timeline[1]).toMatchObject({ kind: 'orphanTool', message: { id: 't-orphan' } })
  })
})

describe('queryTimelineEndsWithToolGroup', () => {
  it('末步已有工具结果时为 true', () => {
    const items = queryAgentTimeline([
      msg({
        id: 'a1',
        role: 'assistant',
        content: '调用工具: a',
        toolCalls: [{ id: 'c1', name: 'a', args: {} }]
      }),
      msg({ id: 't1', role: 'tool', content: 'ok', toolCallId: 'c1', toolName: 'a' })
    ])
    expect(queryTimelineEndsWithToolGroup(items)).toBe(true)
  })

  it('仅有 toolCalls 尚无结果时为 false', () => {
    const items = queryAgentTimeline([
      msg({
        id: 'a1',
        role: 'assistant',
        content: '调用工具: a',
        toolCalls: [{ id: 'c1', name: 'a', args: {} }]
      })
    ])
    expect(queryTimelineEndsWithToolGroup(items)).toBe(false)
  })

  it('最终回答后为 false', () => {
    const items = queryAgentTimeline([
      msg({
        id: 'a1',
        role: 'assistant',
        content: '调用工具: a',
        toolCalls: [{ id: 'c1', name: 'a', args: {} }]
      }),
      msg({ id: 't1', role: 'tool', content: 'ok', toolCallId: 'c1', toolName: 'a' }),
      msg({ id: 'a2', role: 'assistant', content: '完成' })
    ])
    expect(queryTimelineEndsWithToolGroup(items)).toBe(false)
  })
})
