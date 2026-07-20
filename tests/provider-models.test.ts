import { describe, expect, it, vi } from 'vitest'
import {
  queryDashscopeModelsBaseUrlCandidates,
  queryModelsEndpoint,
  queryModelOptionsFromListResponse,
  queryNormalizeDashscopeCompatBaseUrl,
  queryProviderModels,
  queryResolveProviderModelsCredentials
} from '../electron/main/store/provider-models'
import { normalizeSettings } from '../electron/main/store/settings'
import { DEFAULT_CONNECTION_ID } from '../shared/types'

describe('从平台拉取模型列表', () => {
  it('根据 Base URL 拼出 OpenAI 兼容的 /models 地址', () => {
    expect(queryModelsEndpoint('https://api.deepseek.com')).toBe(
      'https://api.deepseek.com/models'
    )
    expect(queryModelsEndpoint('https://api.deepseek.com/')).toBe(
      'https://api.deepseek.com/models'
    )
    expect(queryModelsEndpoint('https://api.deepseek.com/v1')).toBe(
      'https://api.deepseek.com/v1/models'
    )
    expect(queryModelsEndpoint('https://dashscope.aliyuncs.com/compatible-mode/v1')).toBe(
      'https://dashscope.aliyuncs.com/compatible-mode/v1/models'
    )
  })

  it('优先使用自定义模型列表完整链接', () => {
    expect(
      queryModelsEndpoint(
        'https://api.example.com/v1',
        'https://gw.example.com/openai/models/'
      )
    ).toBe('https://gw.example.com/openai/models')
  })

  it('百炼 Base URL 缺 /v1 时自动补齐', () => {
    expect(queryNormalizeDashscopeCompatBaseUrl('https://dashscope.aliyuncs.com/compatible-mode')).toBe(
      'https://dashscope.aliyuncs.com/compatible-mode/v1'
    )
    expect(queryNormalizeDashscopeCompatBaseUrl('')).toBe(
      'https://dashscope.aliyuncs.com/compatible-mode/v1'
    )
  })

  it('百炼候选端点包含国内 / 国际 / Coding Plan', () => {
    const candidates = queryDashscopeModelsBaseUrlCandidates(
      'https://dashscope.aliyuncs.com/compatible-mode/v1'
    )
    expect(candidates[0]).toBe('https://dashscope.aliyuncs.com/compatible-mode/v1')
    expect(candidates).toContain('https://dashscope-intl.aliyuncs.com/compatible-mode/v1')
    expect(candidates).toContain('https://coding.dashscope.aliyuncs.com/v1')
  })

  it('将平台返回的模型 id 转为可选 ModelOption，并补齐已知文案与类型', () => {
    expect(
      queryModelOptionsFromListResponse('deepseek', {
        data: [
          { id: 'deepseek-v4-flash', object: 'model', owned_by: 'deepseek' },
          { id: 'deepseek-v4-pro', object: 'model', owned_by: 'deepseek' }
        ]
      })
    ).toEqual([
      {
        provider: 'deepseek',
        value: 'deepseek-v4-flash',
        label: 'DeepSeek V4 Flash',
        description: '高速推理，推荐默认',
        category: '高速对话'
      },
      {
        provider: 'deepseek',
        value: 'deepseek-v4-pro',
        label: 'DeepSeek V4 Pro',
        description: '更强推理能力',
        category: '文本对话'
      }
    ])
  })

  it('按 DeepSeek 文档调用 GET /models 并解析示例响应', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        object: 'list',
        data: [
          { id: 'deepseek-v4-flash', object: 'model', owned_by: 'deepseek' },
          { id: 'deepseek-v4-pro', object: 'model', owned_by: 'deepseek' }
        ]
      })
    })

    const models = await queryProviderModels(
      {
        provider: 'deepseek',
        apiKey: 'sk-test',
        baseUrl: 'https://api.deepseek.com'
      },
      fetchMock as unknown as typeof fetch
    )

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.deepseek.com/models',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer sk-test'
        })
      })
    )
    expect(models.map((m) => m.value)).toEqual(['deepseek-v4-flash', 'deepseek-v4-pro'])
  })

  it('自定义供应商优先请求配置的模型列表链接', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        object: 'list',
        data: [{ id: 'gw-model', object: 'model' }]
      })
    })

    const models = await queryProviderModels(
      {
        provider: 'custom:gw' as never,
        apiKey: 'sk-gw',
        baseUrl: 'https://gw.example.com/v1',
        customProviders: [
          {
            id: 'custom:gw',
            label: '测试网关',
            apiKeyLabel: 'API Key',
            defaultBaseUrl: 'https://gw.example.com/v1',
            defaultModel: 'gw-model',
            modelsUrl: 'https://gw.example.com/openai/v1/models'
          }
        ]
      },
      fetchMock as unknown as typeof fetch
    )

    expect(fetchMock).toHaveBeenCalledWith(
      'https://gw.example.com/openai/v1/models',
      expect.objectContaining({ method: 'GET' })
    )
    expect(models.map((m) => m.value)).toEqual(['gw-model'])
  })

  it('百炼兼容模式走 GET /compatible-mode/v1/models', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        object: 'list',
        data: [
          { id: 'qwen-plus', object: 'model' },
          { id: 'qwen-max', object: 'model' },
          { id: 'qwen-turbo', object: 'model' }
        ]
      })
    })

    const models = await queryProviderModels(
      {
        provider: 'dashscope',
        apiKey: 'sk-dash',
        baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
      },
      fetchMock as unknown as typeof fetch
    )

    expect(fetchMock).toHaveBeenCalledWith(
      'https://dashscope.aliyuncs.com/compatible-mode/v1/models',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer sk-dash'
        })
      })
    )
    expect(models.map((m) => m.value)).toEqual(['qwen-plus', 'qwen-max', 'qwen-turbo'])
    expect(models[0]?.label).toBe('Qwen Plus')
    expect(models[0]?.category).toBe('文本对话')
    expect(models[2]?.category).toBe('高速对话')
  })

  it('百炼国内端点 401 时自动尝试国际站', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('dashscope.aliyuncs.com/compatible-mode')) {
        return {
          ok: false,
          status: 401,
          text: async () =>
            JSON.stringify({
              error: { message: 'Incorrect API key provided.', code: 'invalid_api_key' }
            })
        }
      }
      return {
        ok: true,
        json: async () => ({
          object: 'list',
          data: [{ id: 'qwen-plus', object: 'model' }]
        })
      }
    })

    const models = await queryProviderModels(
      {
        provider: 'dashscope',
        apiKey: 'sk-intl',
        baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
      },
      fetchMock as unknown as typeof fetch
    )

    expect(fetchMock.mock.calls.length).toBeGreaterThan(1)
    expect(fetchMock.mock.calls.some((call) => String(call[0]).includes('dashscope-intl'))).toBe(
      true
    )
    expect(models.map((m) => m.value)).toEqual(['qwen-plus'])
  })

  it('顶层 Key 为空时从同供应商连接解析凭证', () => {
    const resolved = queryResolveProviderModelsCredentials(
      {
        provider: 'dashscope',
        apiKey: '',
        baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        model: 'qwen-plus',
        connections: [
          {
            id: 'conn-fast',
            label: '快速',
            provider: 'dashscope',
            apiKey: 'sk-from-conn',
            baseUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
            model: 'qwen-turbo',
            capabilities: ['chat']
          }
        ],
        defaultConnectionId: 'conn-fast',
        roleModelMap: {},
        fullAccess: false,
        maxTurns: 40,
        launchAtLogin: false
      },
      { provider: 'dashscope' }
    )

    expect(resolved.apiKey).toBe('sk-from-conn')
    expect(resolved.baseUrl).toBe('https://dashscope.aliyuncs.com/compatible-mode/v1')
  })

  it('多连接迁移时保留遗留顶层 apiKey', () => {
    const settings = normalizeSettings({
      apiKey: 'sk-legacy',
      provider: 'dashscope',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      model: 'qwen-plus',
      defaultConnectionId: DEFAULT_CONNECTION_ID,
      connections: [
        {
          id: DEFAULT_CONNECTION_ID,
          label: '默认',
          provider: 'dashscope',
          apiKey: '',
          baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
          model: 'qwen-plus',
          capabilities: ['chat']
        }
      ]
    })

    expect(settings.apiKey).toBe('sk-legacy')
    expect(settings.connections[0]?.apiKey).toBe('sk-legacy')
  })
})

describe('模型类型推断', () => {
  it('按模型 id 命名约定区分类型', async () => {
    const { queryModelCategory, queryModelOptionDisplayLabel } = await import(
      '../shared/types'
    )
    expect(queryModelCategory('qwen-vl-max')).toBe('视觉理解')
    expect(queryModelCategory('cosyvoice-v3-flash')).toBe('语音')
    expect(queryModelCategory('wanx2.1-t2i-turbo')).toBe('文生图')
    expect(queryModelCategory('text-embedding-v3')).toBe('向量嵌入')
    expect(
      queryModelOptionDisplayLabel({
        provider: 'dashscope',
        value: 'qwen-plus',
        label: 'Qwen Plus',
        description: '均衡，推荐默认',
        category: '文本对话'
      })
    ).toBe('Qwen Plus · 文本对话 — 均衡，推荐默认')
  })
})
