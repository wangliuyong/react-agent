import { describe, expect, it } from 'vitest'
import { tool } from '@langchain/core/tools'
import { AIMessage } from '@langchain/core/messages'
import { z } from 'zod'
import { FuzzyToolNode } from '../electron/main/agent/tools/fuzzy-tool-node'

describe('FuzzyToolNode', () => {
  it('工具名轻微拼写偏差时仍能执行', async () => {
    const ping = tool(
      async ({ msg }: { msg: string }) => `pong:${msg}`,
      {
        name: 'fetch_hot_topics',
        description: 'test',
        schema: z.object({ msg: z.string() })
      }
    )
    const node = new FuzzyToolNode([ping])
    const result = await node.invoke({
      messages: [
        new AIMessage({
          content: '',
          tool_calls: [
            {
              name: 'fetch_hot_topic',
              args: { msg: 'ok' },
              id: 'tc1',
              type: 'tool_call'
            }
          ]
        })
      ]
    })

    const messages = (result as { messages: Array<{ content: string; status?: string }> })
      .messages
    expect(messages).toHaveLength(1)
    expect(messages[0]?.content).toBe('pong:ok')
    expect(messages[0]?.status).not.toBe('error')
  })

  it('完全无关的工具名仍报 not found（错误消息回传）', async () => {
    const ping = tool(async () => 'ok', {
      name: 'query_weather',
      description: 'test',
      schema: z.object({})
    })
    const node = new FuzzyToolNode([ping])
    const result = await node.invoke({
      messages: [
        new AIMessage({
          content: '',
          tool_calls: [
            {
              name: 'totally_unknown_xyz',
              args: {},
              id: 'tc2',
              type: 'tool_call'
            }
          ]
        })
      ]
    })
    const messages = (result as { messages: Array<{ content: string; status?: string }> })
      .messages
    expect(messages[0]?.status).toBe('error')
    expect(String(messages[0]?.content)).toContain('not found')
  })
})
