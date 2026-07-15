import { describe, expect, it } from 'vitest'
import {
  MODEL_PROVIDER_OPTIONS,
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
        defaultModel: 'deepseek-chat'
      })
    )
  })

  it('仅返回当前供应商支持的模型', () => {
    expect(queryModelOptions('deepseek').map((option) => option.value)).toEqual([
      'deepseek-chat',
      'deepseek-reasoner'
    ])
    expect(queryModelOptions('dashscope')).not.toContainEqual(
      expect.objectContaining({ value: 'deepseek-chat' })
    )
  })

  it('供应商列表包含百炼与 DeepSeek', () => {
    expect(MODEL_PROVIDER_OPTIONS.map((option) => option.value)).toEqual([
      'dashscope',
      'deepseek'
    ])
  })
})
