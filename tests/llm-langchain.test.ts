import { describe, expect, it } from 'vitest'
import type { AppSettings } from '../shared/types'
import { queryChatModelConfig } from '../electron/main/agent/llm-langchain'

const BASE_SETTINGS: AppSettings = {
  provider: 'dashscope',
  apiKey: 'test-key',
  baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  model: 'qwen-plus',
  fullAccess: false,
  maxTurns: 40
}

describe('聊天模型配置', () => {
  it('生成 DeepSeek OpenAI 兼容配置', () => {
    expect(
      queryChatModelConfig({
        ...BASE_SETTINGS,
        provider: 'deepseek',
        apiKey: 'sk-deepseek',
        baseUrl: 'https://api.deepseek.com',
        model: 'deepseek-reasoner'
      })
    ).toEqual(
      expect.objectContaining({
        apiKey: 'sk-deepseek',
        model: 'deepseek-reasoner',
        configuration: { baseURL: 'https://api.deepseek.com' }
      })
    )
  })

  it('缺少密钥时提示当前供应商', () => {
    expect(() =>
      queryChatModelConfig({
        ...BASE_SETTINGS,
        provider: 'deepseek',
        apiKey: ''
      })
    ).toThrow('未配置 DeepSeek API Key')
  })

  /**
   * DeepSeek V4 默认开启 thinking；工具多轮时 API 要求回传 reasoning_content。
   * ChatOpenAI 不会在后续请求带回该字段，ReAct 第二轮会 HTTP 400。
   * 因此官方 DeepSeek 供应商显式关闭 thinking，保证 Agent 工具循环可用。
   * 文档：https://api-docs.deepseek.com/guides/thinking_mode
   */
  it('DeepSeek 供应商关闭 thinking，避免工具多轮缺少 reasoning_content', () => {
    expect(
      queryChatModelConfig({
        ...BASE_SETTINGS,
        provider: 'deepseek',
        apiKey: 'sk-deepseek',
        baseUrl: 'https://api.deepseek.com',
        model: 'deepseek-v4-flash'
      })
    ).toEqual(
      expect.objectContaining({
        modelKwargs: { thinking: { type: 'disabled' } }
      })
    )
  })

  it('百炼供应商不注入 DeepSeek thinking 参数', () => {
    expect(queryChatModelConfig(BASE_SETTINGS).modelKwargs).toBeUndefined()
  })
})
