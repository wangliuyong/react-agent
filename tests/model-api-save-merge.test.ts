import { describe, expect, it } from 'vitest'
import { normalizeSettings } from '../electron/main/store/settings'
import {
  queryInitialProviderDrafts,
  queryModelApiSavePatch
} from '../src/features/settings/components/SettingsPage/settingsFormSync'
import { DEFAULT_CONNECTION_IDS, queryBuildDefaultConnections } from '../shared/types'

describe('模型与 API 保存合并', () => {
  it('切换为 Ofox 后顶层 provider 与 apiKey 保留', () => {
    const settings = normalizeSettings({
      provider: 'deepseek',
      apiKey: 'sk-deepseek',
      baseUrl: 'https://api.deepseek.com',
      model: 'deepseek-chat',
      connections: queryBuildDefaultConnections({
        apiKey: 'sk-deepseek',
        provider: 'deepseek',
        baseUrl: 'https://api.deepseek.com'
      }),
      defaultConnectionId: DEFAULT_CONNECTION_IDS.default
    })
    const drafts = queryInitialProviderDrafts(settings)
    drafts.ofox = {
      apiKey: 'sk-ofox',
      baseUrl: 'https://api.ofox.io/v1',
      model: 'openai/gpt-4o-mini'
    }
    const patch = queryModelApiSavePatch({
      activeProvider: 'ofox',
      drafts,
      settings,
      maxTurns: 40,
      fullAccess: false,
      thinkingEnabled: false,
      customProviders: [],
      providerModelCatalog: {}
    })
    const next = normalizeSettings({ ...settings, ...patch })
    expect(next.provider).toBe('ofox')
    expect(next.apiKey).toBe('sk-ofox')
    expect(queryInitialProviderDrafts(next).ofox?.apiKey).toBe('sk-ofox')
  })

  it('当前选用非 Ofox 时仍持久化 Ofox API Key', () => {
    const settings = normalizeSettings({
      provider: 'deepseek',
      apiKey: 'sk-deepseek',
      baseUrl: 'https://api.deepseek.com',
      model: 'deepseek-chat',
      connections: queryBuildDefaultConnections({
        apiKey: 'sk-deepseek',
        provider: 'deepseek',
        baseUrl: 'https://api.deepseek.com'
      }),
      defaultConnectionId: DEFAULT_CONNECTION_IDS.default
    })
    const drafts = queryInitialProviderDrafts(settings)
    drafts.ofox = {
      apiKey: 'sk-ofox',
      baseUrl: 'https://api.ofox.io/v1',
      model: 'openai/gpt-4o-mini'
    }
    const patch = queryModelApiSavePatch({
      activeProvider: 'deepseek',
      drafts,
      settings,
      maxTurns: 40,
      fullAccess: false,
      thinkingEnabled: false,
      customProviders: [],
      providerModelCatalog: {}
    })
    const next = normalizeSettings({ ...settings, ...patch })
    expect(queryInitialProviderDrafts(next).ofox?.apiKey).toBe('sk-ofox')
  })

  it('保存运行参数时不会用空草稿覆盖已配置的 API Key', () => {
    const settings = normalizeSettings({
      provider: 'deepseek',
      apiKey: 'sk-deepseek',
      baseUrl: 'https://api.deepseek.com',
      model: 'deepseek-chat',
      connections: queryBuildDefaultConnections({
        apiKey: 'sk-deepseek',
        provider: 'deepseek',
        baseUrl: 'https://api.deepseek.com'
      }),
      defaultConnectionId: DEFAULT_CONNECTION_IDS.default
    })
    const patch = queryModelApiSavePatch({
      activeProvider: 'deepseek',
      drafts: {
        deepseek: { apiKey: '', baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat' }
      },
      settings,
      maxTurns: 50,
      fullAccess: false,
      thinkingEnabled: false,
      customProviders: [],
      providerModelCatalog: {}
    })
    const next = normalizeSettings({ ...settings, ...patch })
    expect(next.apiKey).toBe('sk-deepseek')
  })
})
