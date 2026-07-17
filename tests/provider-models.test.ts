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
    expect(queryModelsEndpoint('https://dashscope.aliyuncs.com/compatible-mode/v1')).toBe(
      'https://dashscope.aliyuncs.com/compatible-mode/v1/models'
    )
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
