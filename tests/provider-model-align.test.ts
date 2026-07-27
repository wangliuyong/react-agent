import { describe, expect, it } from 'vitest'
import { normalizeSettings } from '../electron/main/store/settings'
import {
  queryInitialProviderDrafts,
  queryModelApiSavePatch
} from '../src/features/settings/components/SettingsPage/settingsFormSync'
import {
  DEFAULT_CONNECTION_IDS,
  queryAlignConnectionsToActiveProvider,
  queryBuildDefaultConnections,
  queryIsModelAllowedForProvider,
  queryModelConnection,
  queryResolveModelForProvider,
  querySyncTopLevelModelToConnections,
  type AppSettings
} from '../shared/types'

describe('queryIsModelAllowedForProvider / queryResolveModelForProvider', () => {
  it('DeepSeek 拒绝 Ofox 风格模型 id', () => {
    expect(
      queryIsModelAllowedForProvider('deepseek', 'anthropic/claude-opus-4.5')
    ).toBe(false)
    expect(queryResolveModelForProvider('deepseek', 'anthropic/claude-opus-4.5')).toBe(
      'deepseek-v4-flash'
    )
  })

  it('本机目录登记的模型可通过校验', () => {
    const catalog = {
      ofox: [{ modelId: 'anthropic/claude-opus-4.5', label: 'Claude Opus 4.5' }]
    }
    expect(
      queryIsModelAllowedForProvider('ofox', 'anthropic/claude-opus-4.5', catalog)
    ).toBe(true)
    expect(
      queryResolveModelForProvider('ofox', 'anthropic/claude-opus-4.5', catalog)
    ).toBe('anthropic/claude-opus-4.5')
  })

  it('OpenAI 兼容 / 自定义供应商不强制白名单', () => {
    expect(queryIsModelAllowedForProvider('openai_compatible', 'my-custom-llm')).toBe(true)
    expect(queryIsModelAllowedForProvider('custom:gw', 'anything-goes')).toBe(true)
  })
})

describe('queryAlignConnectionsToActiveProvider', () => {
  it('切换到 Ofox 时把默认聊天连接校正为 Ofox，避免 Claude 模型打到 DeepSeek', () => {
    const connections = queryBuildDefaultConnections({
      apiKey: 'sk-deepseek',
      provider: 'deepseek',
      baseUrl: 'https://api.deepseek.com'
    })
    const aligned = queryAlignConnectionsToActiveProvider({
      connections,
      activeProvider: 'ofox',
      activeCreds: {
        apiKey: 'sk-ofox',
        baseUrl: 'https://api.ofox.io/v1',
        model: 'anthropic/claude-opus-4.5'
      },
      defaultConnectionId: DEFAULT_CONNECTION_IDS.default,
      catalog: {
        ofox: [{ modelId: 'anthropic/claude-opus-4.5', label: 'Claude Opus 4.5' }]
      }
    })

    const settings: AppSettings = {
      ...normalizeSettings({}),
      provider: 'ofox',
      apiKey: 'sk-ofox',
      baseUrl: 'https://api.ofox.io/v1',
      model: aligned.model,
      connections: aligned.connections,
      defaultConnectionId: aligned.defaultConnectionId
    }
    const used = queryModelConnection(settings, 'default')
    expect(used.provider).toBe('ofox')
    expect(used.baseUrl).toContain('api.ofox.io')
    expect(used.model).toBe('anthropic/claude-opus-4.5')
    expect(aligned.model).toBe('anthropic/claude-opus-4.5')
  })

  it('非法模型回退到供应商默认模型', () => {
    const connections = queryBuildDefaultConnections({
      apiKey: 'sk-deepseek',
      provider: 'deepseek',
      baseUrl: 'https://api.deepseek.com'
    })
    const aligned = queryAlignConnectionsToActiveProvider({
      connections,
      activeProvider: 'deepseek',
      activeCreds: {
        apiKey: 'sk-deepseek',
        baseUrl: 'https://api.deepseek.com',
        model: 'anthropic/claude-opus-4.5'
      },
      defaultConnectionId: DEFAULT_CONNECTION_IDS.default
    })
    expect(aligned.model).toBe('deepseek-v4-flash')
    const def = aligned.connections.find((c) => c.id === DEFAULT_CONNECTION_IDS.default)
    expect(def?.model).toBe('deepseek-v4-flash')
  })
})

describe('保存「模型与 API」时校正默认连接', () => {
  it('从 DeepSeek 切到 Ofox 后，对话默认连接使用 Ofox endpoint', () => {
    const settings = normalizeSettings({
      provider: 'deepseek',
      apiKey: 'sk-deepseek',
      baseUrl: 'https://api.deepseek.com',
      model: 'deepseek-v4-flash',
      connections: queryBuildDefaultConnections({
        apiKey: 'sk-deepseek',
        provider: 'deepseek',
        baseUrl: 'https://api.deepseek.com'
      }),
      defaultConnectionId: DEFAULT_CONNECTION_IDS.default,
      providerModelCatalog: {
        ofox: [{ modelId: 'anthropic/claude-opus-4.5', label: 'Claude Opus 4.5' }]
      }
    })
    const drafts = queryInitialProviderDrafts(settings)
    drafts.ofox = {
      apiKey: 'sk-ofox',
      baseUrl: 'https://api.ofox.io/v1',
      model: 'anthropic/claude-opus-4.5'
    }
    const patch = queryModelApiSavePatch({
      activeProvider: 'ofox',
      drafts,
      settings,
      maxTurns: 40,
      fullAccess: false,
      thinkingEnabled: false,
      customProviders: [],
      providerModelCatalog: settings.providerModelCatalog
    })
    const next = normalizeSettings({ ...settings, ...patch })
    const used = queryModelConnection(next, 'general')
    expect(next.provider).toBe('ofox')
    expect(used.provider).toBe('ofox')
    expect(used.model).toBe('anthropic/claude-opus-4.5')
    expect(next.model).toBe('anthropic/claude-opus-4.5')
  })
})

describe('聊天栏只改 model 时校验并写回正确连接', () => {
  it('顶层为 Ofox 时，切换 Claude 模型不会写进 DeepSeek 连接', () => {
    // 模拟历史脏数据：顶层已是 Ofox，默认连接仍是 DeepSeek
    const current = normalizeSettings({
      provider: 'ofox',
      apiKey: 'sk-ofox',
      baseUrl: 'https://api.ofox.io/v1',
      model: 'openai/gpt-4o-mini',
      connections: queryBuildDefaultConnections({
        apiKey: 'sk-deepseek',
        provider: 'deepseek',
        baseUrl: 'https://api.deepseek.com'
      }),
      defaultConnectionId: DEFAULT_CONNECTION_IDS.default,
      providerModelCatalog: {
        ofox: [{ modelId: 'anthropic/claude-opus-4.5', label: 'Claude Opus 4.5' }]
      }
    })

    const synced = querySyncTopLevelModelToConnections(current, {
      model: 'anthropic/claude-opus-4.5'
    })
    const next = normalizeSettings({
      ...current,
      model: synced.model,
      connections: synced.connections,
      defaultConnectionId: synced.defaultConnectionId
    })
    const used = queryModelConnection(next, 'default')
    expect(used.provider).toBe('ofox')
    expect(used.baseUrl).toContain('api.ofox.io')
    expect(used.model).toBe('anthropic/claude-opus-4.5')
    expect(next.model).toBe('anthropic/claude-opus-4.5')
  })
})
