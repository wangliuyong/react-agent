import { describe, expect, it, vi } from 'vitest'
import {
  queryModelsEndpoint,
  queryModelOptionsFromListResponse,
  queryProviderModels
} from '../electron/main/store/provider-models'

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
  })

  it('将平台返回的模型 id 转为可选 ModelOption', () => {
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
        label: 'deepseek-v4-flash'
      },
      {
        provider: 'deepseek',
        value: 'deepseek-v4-pro',
        label: 'deepseek-v4-pro'
      }
    ])
  })

  it('按 DeepSeek 文档调用 GET /models 并解析示例响应', async () => {
    // 文档：https://api-docs.deepseek.com/zh-cn/api/list-models
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
})
