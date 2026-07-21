import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CONNECTION_IDS,
  DEFAULT_ROLE_MODEL_MAP,
  DEFAULT_ROLE_PROMPT_OVERRIDES,
  queryBuildDefaultConnections,
  queryMergeDefaultRoleModelMap,
  queryMergeDefaultRolePromptOverrides,
  queryModelConnection,
  queryProviderCredentialsFromSettings,
  querySeedDefaultConnections,
  querySyncConnectionsProviderCredentials,
  type AppSettings,
  type ModelConnection
} from '../shared/types'
import { normalizeSettings } from '../electron/main/store/settings'

describe('默认多模型连接与角色映射', () => {
  it('出厂套装含通用/路由/推理/创作/媒体五条连接', () => {
    const list = queryBuildDefaultConnections()
    expect(list.map((c) => c.id)).toEqual([
      DEFAULT_CONNECTION_IDS.default,
      DEFAULT_CONNECTION_IDS.fast,
      DEFAULT_CONNECTION_IDS.reason,
      DEFAULT_CONNECTION_IDS.creative,
      DEFAULT_CONNECTION_IDS.media
    ])
    expect(list.find((c) => c.id === DEFAULT_CONNECTION_IDS.fast)?.model).toBe('qwen-turbo')
    expect(list.find((c) => c.id === DEFAULT_CONNECTION_IDS.reason)?.model).toBe('qwen-max')
  })

  it('单连接用户幂等补齐默认套装并继承 API Key', () => {
    const seeded = querySeedDefaultConnections([
      {
        id: DEFAULT_CONNECTION_IDS.default,
        label: '旧默认',
        provider: 'dashscope',
        apiKey: 'sk-user',
        baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        model: 'qwen-plus',
        capabilities: ['chat']
      }
    ])
    expect(seeded).toHaveLength(5)
    expect(seeded.every((c) => c.apiKey === 'sk-user' || c.provider !== 'dashscope')).toBe(true)
    expect(seeded.find((c) => c.id === DEFAULT_CONNECTION_IDS.default)?.label).toBe('旧默认')
  })

  it('用户自建多连接时不自动扩容', () => {
    const custom: ModelConnection[] = [
      {
        id: 'mine-a',
        label: 'A',
        provider: 'dashscope',
        apiKey: 'sk',
        baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        model: 'qwen-plus',
        capabilities: ['chat']
      },
      {
        id: 'mine-b',
        label: 'B',
        provider: 'dashscope',
        apiKey: 'sk',
        baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        model: 'qwen-max',
        capabilities: ['reasoning']
      }
    ]
    expect(querySeedDefaultConnections(custom)).toEqual(custom)
  })

  it('角色映射缺省键用默认，已配置键优先', () => {
    const ids = new Set(Object.values(DEFAULT_CONNECTION_IDS))
    const merged = queryMergeDefaultRoleModelMap(
      { researcher: DEFAULT_CONNECTION_IDS.creative },
      ids,
      DEFAULT_CONNECTION_IDS.default
    )
    expect(merged.supervisor).toBe(DEFAULT_CONNECTION_IDS.fast)
    expect(merged.researcher).toBe(DEFAULT_CONNECTION_IDS.creative)
    expect(merged.scriptwriter).toBe(DEFAULT_CONNECTION_IDS.creative)
    expect(merged.video).toBe(DEFAULT_CONNECTION_IDS.media)
  })

  it('normalizeSettings 后 Agent 按角色解析到不同连接', () => {
    const settings = normalizeSettings({
      apiKey: 'sk-test',
      provider: 'dashscope',
      connections: [
        {
          id: DEFAULT_CONNECTION_IDS.default,
          label: '通用',
          provider: 'dashscope',
          apiKey: 'sk-test',
          baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
          model: 'qwen-plus',
          capabilities: ['chat']
        }
      ]
    })

    expect(settings.connections.length).toBe(5)
    expect(settings.roleModelMap.supervisor).toBe(DEFAULT_CONNECTION_IDS.fast)
    expect(queryModelConnection(settings, 'supervisor').model).toBe('qwen-turbo')
    expect(queryModelConnection(settings, 'researcher').model).toBe('qwen-max')
    expect(queryModelConnection(settings, 'scriptwriter').id).toBe(
      DEFAULT_CONNECTION_IDS.creative
    )
    expect(queryModelConnection(settings, 'video').id).toBe(DEFAULT_CONNECTION_IDS.media)
  })

  it('DEFAULT_ROLE_MODEL_MAP 覆盖全部角色键', () => {
    const roles = Object.keys(DEFAULT_ROLE_MODEL_MAP)
    expect(roles).toContain('supervisor')
    expect(roles).toContain('videographer')
    expect(roles).toContain('storyboard')
  })

  it('角色设定补充缺省用默认文案，用户自定义优先', () => {
    const merged = queryMergeDefaultRolePromptOverrides({
      writer: '回复保持简洁，优先 bullet 列表'
    })
    expect(merged.general).toBe(DEFAULT_ROLE_PROMPT_OVERRIDES.general)
    expect(merged.writer).toBe('回复保持简洁，优先 bullet 列表')
    expect(merged.researcher).toContain('高级资深的内容调研员')
  })

  it('显式空字符串表示用户关闭该角色默认设定', () => {
    const merged = queryMergeDefaultRolePromptOverrides({
      general: ''
    })
    expect(merged.general).toBe('')
    expect(merged.writer).toBe(DEFAULT_ROLE_PROMPT_OVERRIDES.writer)
  })

  it('normalizeSettings 为新用户补齐默认角色设定', () => {
    const settings = normalizeSettings({
      apiKey: 'sk-test',
      provider: 'dashscope'
    })
    expect(settings.rolePromptOverrides.general).toBe(DEFAULT_ROLE_PROMPT_OVERRIDES.general)
    expect(settings.rolePromptOverrides.scriptwriter).toContain('短视频编剧')
    expect(settings.rolePromptOverrides.video).toContain('AI 视听制作专家')
  })

  it('按供应商从连接解析凭证，供设置页切换供应商回显', () => {
    const settings = {
      provider: 'deepseek',
      apiKey: 'sk-deepseek',
      baseUrl: 'https://api.deepseek.com',
      model: 'deepseek-v4-flash',
      connections: [
        {
          id: 'conn-dashscope',
          label: '百炼',
          provider: 'dashscope' as const,
          apiKey: 'sk-dashscope',
          baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
          model: 'qwen-max',
          capabilities: ['chat'] as const
        }
      ],
      defaultConnectionId: 'conn-dashscope',
      roleModelMap: {},
      fullAccess: false,
      thinkingEnabled: false,
      maxTurns: 40,
      launchAtLogin: false
    }

    expect(queryProviderCredentialsFromSettings(settings, 'dashscope').apiKey).toBe('sk-dashscope')
    expect(queryProviderCredentialsFromSettings(settings, 'deepseek').apiKey).toBe('sk-deepseek')
  })

  it('多连接空 Key 时按供应商同步「模型与 API」凭证', () => {
    const settings = {
      provider: 'dashscope',
      apiKey: 'sk-top',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      model: 'qwen-plus',
      connections: [
        {
          id: DEFAULT_CONNECTION_IDS.media,
          label: '媒体',
          provider: 'dashscope' as const,
          apiKey: '',
          baseUrl: '',
          model: '',
          capabilities: ['vision'] as const
        }
      ],
      defaultConnectionId: DEFAULT_CONNECTION_IDS.default,
      roleModelMap: {},
      fullAccess: false,
      thinkingEnabled: false,
      maxTurns: 40,
      launchAtLogin: false
    }

    const synced = querySyncConnectionsProviderCredentials(settings.connections, settings)
    expect(synced[0]?.apiKey).toBe('sk-top')
    expect(synced[0]?.baseUrl).toContain('dashscope.aliyuncs.com')
    expect(synced[0]?.model).toBe('qwen-plus')
  })
})

describe('queryModelConnection 回退', () => {
  it('映射指向不存在的 id 时回退默认连接', () => {
    const settings = {
      provider: 'dashscope',
      apiKey: 'sk',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      model: 'qwen-plus',
      connections: queryBuildDefaultConnections({ apiKey: 'sk' }),
      defaultConnectionId: DEFAULT_CONNECTION_IDS.default,
      roleModelMap: { general: 'missing-id' },
      fullAccess: false,
      thinkingEnabled: false,
      maxTurns: 40,
      launchAtLogin: false
    } satisfies AppSettings

    expect(queryModelConnection(settings, 'general').id).toBe(DEFAULT_CONNECTION_IDS.default)
  })
})
