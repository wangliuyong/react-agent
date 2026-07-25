import { describe, expect, it } from 'vitest'
import type { AppSettings, ModelProvider } from '../shared/types'
import {
  DEFAULT_CONNECTION,
  DEFAULT_CONNECTION_ID,
  queryThinkingModelKwargs
} from '../shared/types'
import { queryChatModelConfig } from '../electron/main/agent/llm-langchain'

function querySettingsWithConnection(opts: {
  provider?: ModelProvider
  apiKey?: string
  baseUrl?: string
  model?: string
}): AppSettings {
  const provider = opts.provider ?? 'dashscope'
  const apiKey = opts.apiKey ?? 'test-key'
  const baseUrl =
    opts.baseUrl ??
    (provider === 'deepseek'
      ? 'https://api.deepseek.com'
      : provider === 'volcengine_ark'
        ? 'https://ark.cn-beijing.volces.com/api/v3'
        : 'https://dashscope.aliyuncs.com/compatible-mode/v1')
  const model =
    opts.model ??
    (provider === 'deepseek'
      ? 'deepseek-v4-flash'
      : provider === 'volcengine_ark'
        ? 'doubao-seed-2-1-pro-260628'
        : 'qwen-plus')
  return {
    provider,
    apiKey,
    baseUrl,
    model,
    connections: [
      {
        ...DEFAULT_CONNECTION,
        id: DEFAULT_CONNECTION_ID,
        label:
          provider === 'deepseek'
            ? 'DeepSeek'
            : provider === 'volcengine_ark'
              ? '火山方舟'
              : '百炼',
        provider,
        apiKey,
        baseUrl,
        model
      }
    ],
    defaultConnectionId: DEFAULT_CONNECTION_ID,
    roleModelMap: {},
    thinkingEnabled: false,
    fullAccess: false,
    maxTurns: 40,
    launchAtLogin: false
  }
}

const BASE_SETTINGS = querySettingsWithConnection({})

describe('聊天模型配置', () => {
  it('生成 DeepSeek OpenAI 兼容配置', () => {
    expect(
      queryChatModelConfig(
        querySettingsWithConnection({
          provider: 'deepseek',
          apiKey: 'sk-deepseek',
          baseUrl: 'https://api.deepseek.com',
          model: 'deepseek-reasoner'
        })
      )
    ).toEqual(
      expect.objectContaining({
        apiKey: 'sk-deepseek',
        model: 'deepseek-reasoner',
        configuration: { baseURL: 'https://api.deepseek.com' }
      })
    )
  })

  it('缺少密钥时提示当前供应商', () => {
    expect(() =>
      queryChatModelConfig(
        querySettingsWithConnection({
          provider: 'deepseek',
          apiKey: ''
        })
      )
    ).toThrow('未配置 API Key')
  })

  it('DeepSeek 供应商关闭 thinking，避免工具多轮缺少 reasoning_content', () => {
    expect(
      queryChatModelConfig(
        querySettingsWithConnection({
          provider: 'deepseek',
          apiKey: 'sk-deepseek',
          baseUrl: 'https://api.deepseek.com',
          model: 'deepseek-v4-flash'
        })
      )
    ).toEqual(
      expect.objectContaining({
        modelKwargs: { thinking: { type: 'disabled' } }
      })
    )
  })

  it('DeepSeek 供应商开启 thinking 时显式 enabled', () => {
    expect(
      queryChatModelConfig({
        ...querySettingsWithConnection({
          provider: 'deepseek',
          apiKey: 'sk-deepseek',
          baseUrl: 'https://api.deepseek.com',
          model: 'deepseek-v4-flash'
        }),
        thinkingEnabled: true
      })
    ).toEqual(
      expect.objectContaining({
        modelKwargs: { thinking: { type: 'enabled' } }
      })
    )
  })

  it('百炼托管 DeepSeek 模型按 enable_thinking 注入', () => {
    expect(
      queryChatModelConfig({
        ...querySettingsWithConnection({
          provider: 'dashscope',
          model: 'deepseek-v4-flash'
        }),
        thinkingEnabled: true
      })
    ).toEqual(
      expect.objectContaining({
        modelKwargs: { enable_thinking: true }
      })
    )
  })

  it('百炼普通 Qwen 模型不注入 thinking 参数', () => {
    expect(queryChatModelConfig(BASE_SETTINGS).modelKwargs).toBeUndefined()
  })

  it('火山方舟豆包模型使用 thinking.type', () => {
    expect(
      queryChatModelConfig(
        querySettingsWithConnection({
          provider: 'volcengine_ark',
          apiKey: 'ark-test',
          baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
          model: 'doubao-seed-2-1-pro-260628'
        })
      )
    ).toEqual(
      expect.objectContaining({
        apiKey: 'ark-test',
        model: 'doubao-seed-2-1-pro-260628',
        configuration: { baseURL: 'https://ark.cn-beijing.volces.com/api/v3' },
        modelKwargs: { thinking: { type: 'disabled' } }
      })
    )
  })
})

describe('thinking 模型参数', () => {
  it('DeepSeek 官方 API 使用 thinking.type', () => {
    expect(
      queryThinkingModelKwargs(
        { thinkingEnabled: false },
        'deepseek-v4-flash',
        'deepseek'
      )
    ).toEqual({ thinking: { type: 'disabled' } })
  })

  it('火山方舟使用 thinking.type', () => {
    expect(
      queryThinkingModelKwargs(
        { thinkingEnabled: true },
        'doubao-seed-2-1-pro-260628',
        'volcengine_ark'
      )
    ).toEqual({ thinking: { type: 'enabled' } })
  })

  it('百炼兼容模式使用 enable_thinking', () => {
    expect(
      queryThinkingModelKwargs({ thinkingEnabled: true }, 'qwen3-max', 'dashscope')
    ).toEqual({ enable_thinking: true })
  })
})
