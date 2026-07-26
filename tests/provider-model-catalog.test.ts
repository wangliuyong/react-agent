import { describe, expect, it } from 'vitest'
import {
  queryMergeModelOptionLists,
  queryModelOptionsFromProviderRecords,
  queryNormalizeProviderModelCatalog,
  queryResolvedModelOptionsForProvider
} from '../shared/types'

describe('providerModelCatalog', () => {
  it('归一化目录并去重 modelId', () => {
    const catalog = queryNormalizeProviderModelCatalog({
      dashscope: [
        { modelId: 'qwen-test', displayName: '测试', contextWindow: '128K' },
        { modelId: 'qwen-test', displayName: '重复' },
        { value: 'qwen-other', label: '其它' }
      ],
      invalid: 'not-array'
    })
    expect(catalog.dashscope).toHaveLength(2)
    expect(catalog.dashscope?.[0].modelId).toBe('qwen-test')
    expect(catalog.dashscope?.[0].contextWindow).toBe('128K')
    expect(catalog.dashscope?.[1].displayName).toBe('其它')
  })

  it('手动目录与静态列表合并，手动元数据优先', () => {
    const manual = queryModelOptionsFromProviderRecords('dashscope', [
      {
        id: 'pm-1',
        modelId: 'qwen-plus',
        displayName: '我的 Plus',
        size: '72B'
      }
    ])
    const merged = queryMergeModelOptionLists(
      [
        {
          provider: 'dashscope',
          value: 'qwen-plus',
          label: 'Qwen Plus',
          description: '内置说明'
        }
      ],
      manual
    )
    expect(merged).toHaveLength(1)
    expect(merged[0].label).toBe('我的 Plus')
    expect(merged[0].description).toContain('72B')
  })

  it('queryResolvedModelOptionsForProvider 包含登记项', () => {
    const options = queryResolvedModelOptionsForProvider('deepseek', {
      deepseek: [{ id: 'pm-x', modelId: 'deepseek-private', displayName: '私有' }]
    })
    expect(options.some((o) => o.value === 'deepseek-private')).toBe(true)
  })
})
