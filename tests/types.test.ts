import { describe, expect, it } from 'vitest'
import {
  MODEL_PROVIDER_OPTIONS,
  queryBuildDefaultConnections,
  queryChatModelOptionsFromCatalog,
  queryModelOptions,
  queryProviderOption
} from '../shared/types'

describe('模型供应商配置', () => {
  it('提供 DeepSeek 官方服务及默认配置', () => {
    expect(queryProviderOption('deepseek')).toEqual(
      expect.objectContaining({
        value: 'deepseek',
        label: 'DeepSeek',
        defaultBaseUrl: 'https://api.deepseek.com',
        defaultModel: 'deepseek-v4-flash'
      })
    )
  })

  it('提供 OfoxAI 聚合网关及默认配置', () => {
    expect(queryProviderOption('ofox')).toEqual(
      expect.objectContaining({
        value: 'ofox',
        label: 'OfoxAI',
        defaultBaseUrl: 'https://api.ofox.io/v1',
        defaultModel: 'openai/gpt-4o-mini',
        modelsUrl: 'https://api.ofox.io/v1/models'
      })
    )
  })

  it('默认模型列表与 DeepSeek /models 文档示例一致', () => {
    // 文档示例：https://api-docs.deepseek.com/zh-cn/api/list-models
    expect(queryModelOptions('deepseek').map((option) => option.value)).toEqual([
      'deepseek-v4-flash',
      'deepseek-v4-pro'
    ])
    expect(queryModelOptions('dashscope')).not.toContainEqual(
      expect.objectContaining({ value: 'deepseek-chat' })
    )
  })

  it('OfoxAI 静态兜底模型使用 provider/model-name 格式', () => {
    expect(queryModelOptions('ofox').map((option) => option.value)).toEqual([
      'openai/gpt-4o-mini',
      'openai/gpt-4o',
      'anthropic/claude-sonnet-4.6'
    ])
  })

  it('OfoxAI 种子连接使用聚合网关与带前缀的模型 id', () => {
    const connections = queryBuildDefaultConnections({
      apiKey: 'sk-ofox',
      provider: 'ofox'
    })
    expect(connections[0]).toEqual(
      expect.objectContaining({
        provider: 'ofox',
        apiKey: 'sk-ofox',
        baseUrl: 'https://api.ofox.io/v1',
        model: 'openai/gpt-4o-mini'
      })
    )
    expect(connections.find((c) => c.id === 'conn-reason')?.model).toBe(
      'anthropic/claude-sonnet-4.6'
    )
    // 媒体能力仍走百炼
    expect(connections.find((c) => c.id === 'conn-media')?.provider).toBe('dashscope')
  })

  it('供应商列表包含百炼、DeepSeek、OfoxAI 与 OpenAI 兼容', () => {
    expect(MODEL_PROVIDER_OPTIONS.map((option) => option.value)).toEqual([
      'dashscope',
      'deepseek',
      'ofox',
      'openai_compatible'
    ])
  })

  it('聊天下拉仅返回当前供应商本机登记模型', () => {
    const catalog = {
      dashscope: [
        { id: 'r1', modelId: 'qwen-max', displayName: '通义 Max' }
      ],
      deepseek: [
        { id: 'r2', modelId: 'deepseek-v4-flash', displayName: 'V4 Flash' }
      ]
    }
    expect(queryChatModelOptionsFromCatalog('dashscope', catalog).map((m) => m.value)).toEqual([
      'qwen-max'
    ])
    expect(queryChatModelOptionsFromCatalog('deepseek', catalog).map((m) => m.value)).toEqual([
      'deepseek-v4-flash'
    ])
    expect(queryChatModelOptionsFromCatalog('ofox', catalog)).toEqual([])
  })
})
