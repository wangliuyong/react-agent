import { describe, expect, it } from 'vitest'
import { normalizeSettings } from '../electron/main/store/settings'
import {
  queryInitialProviderDrafts,
  queryModelApiSavePatch
} from '../src/features/settings/components/SettingsPage/settingsFormSync'
import {
  DEFAULT_CONNECTION_IDS,
  queryBuildDefaultConnections,
  queryProviderCredentialsFromSettings
} from '../shared/types'

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

  it('从 DeepSeek 切到 Ofox 再切回 DeepSeek 时，DeepSeek API Key 仍可从连接恢复', () => {
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
      defaultConnectionId: DEFAULT_CONNECTION_IDS.default
    })
    const draftsAfterOfox = queryInitialProviderDrafts(settings)
    draftsAfterOfox.ofox = {
      apiKey: 'sk-ofox',
      baseUrl: 'https://api.ofox.io/v1',
      model: 'z-ai/glm-4.7-flash:free'
    }
    const ofoxPatch = queryModelApiSavePatch({
      activeProvider: 'ofox',
      drafts: draftsAfterOfox,
      settings,
      maxTurns: 40,
      fullAccess: false,
      thinkingEnabled: false,
      customProviders: [],
      providerModelCatalog: {}
    })
    const afterOfox = normalizeSettings({ ...settings, ...ofoxPatch })
    const draftsBackDeepseek = queryInitialProviderDrafts(afterOfox)
    const deepseekPatch = queryModelApiSavePatch({
      activeProvider: 'deepseek',
      drafts: draftsBackDeepseek,
      settings: afterOfox,
      maxTurns: 40,
      fullAccess: false,
      thinkingEnabled: false,
      customProviders: [],
      providerModelCatalog: {}
    })
    const afterDeepseek = normalizeSettings({ ...afterOfox, ...deepseekPatch })
    expect(queryProviderCredentialsFromSettings(afterDeepseek, 'deepseek').apiKey).toBe(
      'sk-deepseek'
    )
    expect(queryProviderCredentialsFromSettings(afterDeepseek, 'ofox').apiKey).toBe('sk-ofox')
  })
})
