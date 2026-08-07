import { AIMessage, HumanMessage, ToolMessage } from '@langchain/core/messages'
import type { LLMResult } from '@langchain/core/outputs'
import { describe, expect, it } from 'vitest'
import {
  queryEstimateTokensFromText,
  queryTextFromBaseMessage,
  queryTextFromLlmResult,
  queryTokensFromLlmResult,
  queryTokensFromUsageMetadata
} from '../electron/main/agent/token-usage'

describe('Agent token 用量记录', () => {
  it('从 usage_metadata 解析 total_tokens', () => {
    expect(
      queryTokensFromUsageMetadata({
        input_tokens: 120,
        output_tokens: 80,
        total_tokens: 200
      })
    ).toBe(200)
  })

  it('usage_metadata 缺 total 时用 input + output', () => {
    expect(
      queryTokensFromUsageMetadata({
        input_tokens: 50,
        output_tokens: 30
      })
    ).toBe(80)
  })

  it('从 LLMResult.llmOutput.tokenUsage 解析', () => {
    const result: LLMResult = {
      generations: [[]],
      llmOutput: {
        tokenUsage: {
          promptTokens: 100,
          completionTokens: 40,
          totalTokens: 140
        }
      }
    }
    expect(queryTokensFromLlmResult(result)).toBe(140)
  })

  it('从 generations 内 AIMessage.usage_metadata 解析', () => {
    const result: LLMResult = {
      generations: [
        [
          {
            text: 'ok',
            message: new AIMessage({
              content: 'ok',
              usage_metadata: {
                input_tokens: 10,
                output_tokens: 5,
                total_tokens: 15
              }
            })
          }
        ]
      ]
    }
    expect(queryTokensFromLlmResult(result)).toBe(15)
  })

  it('无 usage 信息时返回 0（由估算兜底）', () => {
    const result: LLMResult = {
      generations: [[{ text: 'ok', message: new AIMessage('ok') }]]
    }
    expect(queryTokensFromLlmResult(result)).toBe(0)
  })
})

describe('Token 字符估算（仅模型交互文本）', () => {
  it('英文字符按 0.3 token 估算', () => {
    // 10 个英文字符 → 3 token
    expect(queryEstimateTokensFromText('abcdefghij')).toBeCloseTo(3, 5)
  })

  it('中文字符按 0.6 token 估算', () => {
    // 10 个中文字符 → 6 token
    expect(queryEstimateTokensFromText('一二三四五六七八九十')).toBeCloseTo(6, 5)
  })

  it('中英混合按各自系数累加', () => {
    // 2 中文 (1.2) + 4 英文 (1.2) = 2.4
    expect(queryEstimateTokensFromText('你好abcd')).toBeCloseTo(2.4, 5)
  })

  it('空文本为 0', () => {
    expect(queryEstimateTokensFromText('')).toBe(0)
  })

  it('从消息提取纯文本交互内容（忽略图片等非文本块）', () => {
    const message = new HumanMessage({
      content: [
        { type: 'text', text: '分析这张图' },
        { type: 'image_url', image_url: { url: 'data:image/png;base64,xxx' } }
      ]
    })
    expect(queryTextFromBaseMessage(message)).toBe('分析这张图')
  })

  it('助手 tool_calls 计入模型输出文本', () => {
    const message = new AIMessage({
      content: '',
      tool_calls: [{ id: 'c1', name: 'search', args: { q: '天气' } }]
    })
    const text = queryTextFromBaseMessage(message)
    expect(text).toContain('search')
    expect(text).toContain('天气')
  })

  it('工具结果消息计入后续送入模型的交互文本', () => {
    const message = new ToolMessage({
      content: '查询成功：晴',
      tool_call_id: 'c1',
      name: 'search'
    })
    expect(queryTextFromBaseMessage(message)).toContain('查询成功：晴')
  })

  it('从 LLMResult 提取补全文本（含 reasoning）', () => {
    const result: LLMResult = {
      generations: [
        [
          {
            text: '最终回答',
            message: new AIMessage({
              content: '最终回答',
              additional_kwargs: { reasoning_content: '先想一步' }
            })
          }
        ]
      ]
    }
    const text = queryTextFromLlmResult(result)
    expect(text).toContain('最终回答')
    expect(text).toContain('先想一步')
  })

  it('无 usage 时可用 prompt+completion 估算总量', () => {
    const prompt = '你好世界' // 4 中文 → 2.4
    const completion = 'hello' // 5 英文 → 1.5
    const estimated = queryEstimateTokensFromText(prompt + completion)
    expect(estimated).toBeCloseTo(3.9, 5)
  })
})
