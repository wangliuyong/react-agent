import { AIMessage } from '@langchain/core/messages'
import type { LLMResult } from '@langchain/core/outputs'
import { describe, expect, it } from 'vitest'
import {
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

  it('无 usage 信息时返回 0', () => {
    const result: LLMResult = {
      generations: [[{ text: 'ok', message: new AIMessage('ok') }]]
    }
    expect(queryTokensFromLlmResult(result)).toBe(0)
  })
})
