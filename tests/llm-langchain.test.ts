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
})
