import { describe, expect, it } from 'vitest'
import {
  queryAllProviderOptions,
  queryNewCustomProviderId,
  queryNormalizeCustomProviders,
  queryProviderOption
} from '../shared/types'
import { normalizeSettings } from '../electron/main/store/settings'

describe('自定义模型供应商', () => {
  it('生成 custom: 前缀的唯一 id', () => {
    const id = queryNewCustomProviderId()
    expect(id.startsWith('custom:')).toBe(true)
    expect(queryNewCustomProviderId()).not.toBe(id)
  })

  it('归一化自定义供应商并过滤无效项', () => {
    expect(
      queryNormalizeCustomProviders([
        { id: 'custom:a', label: '月之暗面', defaultBaseUrl: 'https://api.moonshot.cn/v1' },
        { id: 'bad', label: '无效' },
        { id: 'custom:a', label: '重复' }
      ])
    ).toEqual([
      expect.objectContaining({
        id: 'custom:a',
        label: '月之暗面',
        apiKeyLabel: 'API Key',
        defaultBaseUrl: 'https://api.moonshot.cn/v1'
      })
    ])
  })

  it('合并内置与自定义供应商选项', () => {
    const options = queryAllProviderOptions([
      {
        id: 'custom:test',
        label: '测试网关',
        apiKeyLabel: '网关 Key',
        defaultBaseUrl: 'https://gw.example.com/v1',
        defaultModel: 'gpt-4o-mini'
      }
    ])
    expect(options.map((o) => o.value)).toContain('dashscope')
    expect(options.map((o) => o.value)).toContain('custom:test')
    expect(queryProviderOption('custom:test', [
      {
        id: 'custom:test',
        label: '测试网关',
        apiKeyLabel: '网关 Key',
        defaultBaseUrl: 'https://gw.example.com/v1',
        defaultModel: 'gpt-4o-mini'
      }
    ]).label).toBe('测试网关')
  })

  it('设置归一化持久化 customProviders', () => {
    const normalized = normalizeSettings({
      customProviders: [
        {
          id: 'custom:gw',
          label: '本地网关',
          apiKeyLabel: 'API Key',
          defaultBaseUrl: 'http://localhost:11434/v1',
          defaultModel: 'llama3'
        }
      ],
      provider: 'custom:gw' as never
    })
    expect(normalized.customProviders).toHaveLength(1)
    expect(normalized.customProviders[0]?.label).toBe('本地网关')
  })
})
