import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SETTINGS,
  queryAllProviderOptions,
  queryIsCustomModelProvider,
  queryNewCustomProviderId,
  queryNormalizeCustomProviders,
  queryProviderOption,
  queryRemoveCustomProvider
} from '../shared/types'
import { normalizeSettings } from '../electron/main/store/settings'

describe('自定义模型供应商', () => {
  it('生成 custom: 前缀的唯一 id', () => {
    const id = queryNewCustomProviderId()
    expect(id.startsWith('custom:')).toBe(true)
    expect(queryNewCustomProviderId()).not.toBe(id)
  })

  it('识别并移除自定义供应商', () => {
    expect(queryIsCustomModelProvider('custom:a')).toBe(true)
    expect(queryIsCustomModelProvider('dashscope')).toBe(false)
    const list = [
      {
        id: 'custom:a' as const,
        label: 'A',
        apiKeyLabel: 'API Key',
        defaultBaseUrl: 'https://a.example.com/v1',
        defaultModel: 'a'
      },
      {
        id: 'custom:b' as const,
        label: 'B',
        apiKeyLabel: 'API Key',
        defaultBaseUrl: 'https://b.example.com/v1',
        defaultModel: 'b'
      }
    ]
    expect(queryRemoveCustomProvider(list, 'custom:a').map((p) => p.id)).toEqual(['custom:b'])
    expect(queryRemoveCustomProvider(list, 'dashscope')).toEqual(list)
  })

  it('归一化自定义供应商并过滤无效项', () => {
    expect(
      queryNormalizeCustomProviders([
        {
          id: 'custom:a',
          label: '月之暗面',
          defaultBaseUrl: 'https://api.moonshot.cn/v1',
          modelsUrl: 'https://api.moonshot.cn/v1/models'
        },
        { id: 'bad', label: '无效' },
        { id: 'custom:a', label: '重复' }
      ])
    ).toEqual([
      expect.objectContaining({
        id: 'custom:a',
        label: '月之暗面',
        apiKeyLabel: 'API Key',
        defaultBaseUrl: 'https://api.moonshot.cn/v1',
        modelsUrl: 'https://api.moonshot.cn/v1/models'
      })
    ])
  })

  it('合并内置与自定义供应商选项', () => {
    const options = queryAllProviderOptions([
      {
        id: 'custom:test',
        label: '测试网关',
        apiKeyLabel: 'API Key',
        defaultBaseUrl: 'https://gw.example.com/v1',
        defaultModel: 'gpt-4o-mini',
        modelsUrl: 'https://gw.example.com/v1/models'
      }
    ])
    expect(options.map((o) => o.value)).toContain('dashscope')
    expect(options.map((o) => o.value)).toContain('custom:test')
    expect(
      queryProviderOption('custom:test', [
        {
          id: 'custom:test',
          label: '测试网关',
          apiKeyLabel: 'API Key',
          defaultBaseUrl: 'https://gw.example.com/v1',
          defaultModel: 'gpt-4o-mini',
          modelsUrl: 'https://gw.example.com/v1/models'
        }
      ])
    ).toMatchObject({
      label: '测试网关',
      modelsUrl: 'https://gw.example.com/v1/models'
    })
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

  it('删除自定义供应商后归一化回退顶层与连接 provider', () => {
    const normalized = normalizeSettings({
      customProviders: [],
      provider: 'custom:gone' as never,
      apiKey: 'sk-gone',
      baseUrl: 'https://gone.example.com/v1',
      model: 'gone-model',
      connections: [
        {
          id: 'c1',
          label: '已删供应商连接',
          provider: 'custom:gone',
          apiKey: 'sk-gone',
          baseUrl: 'https://gone.example.com/v1',
          model: 'gone-model',
          capabilities: ['chat']
        }
      ],
      defaultConnectionId: 'c1'
    })
    expect(normalized.customProviders).toEqual([])
    expect(normalized.provider).toBe(DEFAULT_SETTINGS.provider)
    expect(normalized.connections.find((c) => c.id === 'c1')?.provider).toBe(
      DEFAULT_SETTINGS.provider
    )
  })
})
