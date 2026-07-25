import { AIMessage } from '@langchain/core/messages'
import type { LLMResult } from '@langchain/core/outputs'
import { describe, expect, it } from 'vitest'
import {
  queryPromptTokensFromLlmResult,
  queryTokensFromLlmResult,
  queryTokensFromUsageMetadata
} from '../electron/main/agent/token-usage'
import { queryFormatContextUsageLabel } from '../shared/types'

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

  it('从 LLMResult 解析 prompt tokens（当前上下文占用，不含 completion）', () => {
    const result: LLMResult = {
      generations: [[]],
      llmOutput: {
        tokenUsage: {
          promptTokens: 128_000,
          completionTokens: 2_000,
          totalTokens: 130_000
        }
      }
    }
    expect(queryPromptTokensFromLlmResult(result)).toBe(128_000)
  })

  it('从 usage_metadata.input_tokens 解析当前上下文占用', () => {
    const result: LLMResult = {
      generations: [
        [
          {
            text: 'ok',
            message: new AIMessage({
              content: 'ok',
              usage_metadata: {
                input_tokens: 45_000,
                output_tokens: 1_200,
                total_tokens: 46_200
              }
            })
          }
        ]
      ]
    }
    expect(queryPromptTokensFromLlmResult(result)).toBe(45_000)
  })
})

describe('上下文占用展示', () => {
  it('格式化为 占用/上限，占用取最近一次 prompt tokens', () => {
    expect(queryFormatContextUsageLabel(45_000, 1_024_000)).toBe('45k/1024k')
    expect(queryFormatContextUsageLabel(0, 1_024_000)).toBe('0/1024k')
  })

  it('不足 1k 时展示原始 token 数', () => {
    expect(queryFormatContextUsageLabel(800, 128_000)).toBe('800/128k')
  })
})
