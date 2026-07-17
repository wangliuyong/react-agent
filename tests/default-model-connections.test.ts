import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CONNECTION_IDS,
  DEFAULT_ROLE_MODEL_MAP,
  queryBuildDefaultConnections,
  queryMergeDefaultRoleModelMap,
  queryModelConnection,
  querySeedDefaultConnections,
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
      maxTurns: 40,
      launchAtLogin: false
    } satisfies AppSettings

    expect(queryModelConnection(settings, 'general').id).toBe(DEFAULT_CONNECTION_IDS.default)
  })
})
