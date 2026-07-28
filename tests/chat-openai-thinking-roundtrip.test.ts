import { describe, expect, it } from 'vitest'
import { AIMessage, HumanMessage, ToolMessage } from '@langchain/core/messages'
import { postInjectReasoningContent } from '../electron/main/agent/chat-openai-thinking-roundtrip'

describe('DeepSeek thinking reasoning_content 回传', () => {
  it('给带 tool_calls 的 assistant 请求消息补上 reasoning_content', () => {
    const lcMessages = [
      new HumanMessage('查热点'),
      new AIMessage({
        content: '先列方案',
        tool_calls: [
          {
            id: 'call_1',
            name: 'present_plan_choices',
            args: {},
            type: 'tool_call'
          }
        ],
        additional_kwargs: { reasoning_content: '需要用户先选选题' }
      }),
      new ToolMessage({
        content: '{"ok":true}',
        tool_call_id: 'call_1',
        name: 'present_plan_choices'
      })
    ]

    const apiMessages = [
      { role: 'user', content: '查热点' },
      {
        role: 'assistant',
        content: '先列方案',
        tool_calls: [{ id: 'call_1', type: 'function', function: { name: 'present_plan_choices', arguments: '{}' } }]
      },
      { role: 'tool', tool_call_id: 'call_1', content: '{"ok":true}' }
    ]

    const patched = postInjectReasoningContent(lcMessages, apiMessages)
    expect(patched[1]).toEqual({
      ...apiMessages[1],
      reasoning_content: '需要用户先选选题'
    })
    expect(patched[0]).toEqual(apiMessages[0])
    expect(patched[2]).toEqual(apiMessages[2])
  })

  it('已有 reasoning_content 时不覆盖', () => {
    const lcMessages = [
      new AIMessage({
        content: '',
        tool_calls: [{ id: 'c1', name: 'x', args: {}, type: 'tool_call' }],
        additional_kwargs: { reasoning_content: 'from-lc' }
      })
    ]
    const apiMessages = [
      {
        role: 'assistant',
        content: '',
        tool_calls: [{ id: 'c1' }],
        reasoning_content: 'already'
      }
    ]

    expect(postInjectReasoningContent(lcMessages, apiMessages)[0]?.reasoning_content).toBe(
      'already'
    )
  })
})
