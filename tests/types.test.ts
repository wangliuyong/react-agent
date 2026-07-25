import { describe, expect, it } from 'vitest'
import {
  MODEL_PROVIDER_OPTIONS,
  queryFormatContextWindow,
  queryModelContextWindow,
  queryModelOptionDisplayLabel,
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

  it('提供火山方舟内置供应商及默认配置', () => {
    // 快速入门：https://www.volcengine.com/docs/82379/1399008
    expect(queryProviderOption('volcengine_ark')).toEqual(
      expect.objectContaining({
        value: 'volcengine_ark',
        label: '火山方舟',
        defaultBaseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
        defaultModel: 'doubao-seed-2-1-pro-260628'
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

  it('火山方舟静态模型列表含官方推荐模型与上下文窗口', () => {
    // 模型列表：https://www.volcengine.com/docs/82379/1330310
    const arkModels = queryModelOptions('volcengine_ark')
    expect(arkModels.map((option) => option.value)).toEqual(
      expect.arrayContaining([
        'doubao-seed-evolving',
        'doubao-seed-2-1-pro-260628',
        'doubao-seed-2-1-turbo-260628',
        'doubao-seed-2-0-pro-260215',
        'deepseek-v4-flash-260425',
        'glm-5-2-260617'
      ])
    )
    expect(
      arkModels.find((m) => m.value === 'doubao-seed-2-1-pro-260628')?.contextWindow
    ).toBe(256_000)
    expect(arkModels.find((m) => m.value === 'doubao-seed-evolving')?.contextWindow).toBe(
      1_024_000
    )
  })

  it('供应商列表包含百炼、DeepSeek、火山方舟与 OpenAI 兼容', () => {
    expect(MODEL_PROVIDER_OPTIONS.map((option) => option.value)).toEqual([
      'dashscope',
      'deepseek',
      'volcengine_ark',
      'openai_compatible'
    ])
  })

  it('下拉展示包含上下文上限，并支持按模型查询', () => {
    expect(queryFormatContextWindow(256_000)).toBe('256k')
    expect(queryModelContextWindow('doubao-seed-2-1-pro-260628')).toBe(256_000)
    expect(
      queryModelOptionDisplayLabel({
        provider: 'volcengine_ark',
        value: 'doubao-seed-2-1-pro-260628',
        label: 'Doubao Seed 2.1 Pro',
        description: '旗舰级 Agent 通用模型',
        category: '深度推理',
        contextWindow: 256_000
      })
    ).toBe('Doubao Seed 2.1 Pro · 深度推理 · 256k — 旗舰级 Agent 通用模型')
  })
})
