import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CONNECTION_IDS,
  queryBuildDefaultConnections,
  type AppSettings
} from '../shared/types'
import {
  LONG_CONTEXT_CHAR_THRESHOLD,
  queryHasExplicitPublishIntent,
  queryInferModelCapability,
  queryInferSupervisorNext,
  queryParseSupervisorRoute,
  queryPipelineEntryRole,
  queryResolveModelConnection,
  querySanitizeSupervisorNext
} from '../electron/main/agent/model-router'

function queryTestSettings(overrides?: Partial<AppSettings>): AppSettings {
  const connections = queryBuildDefaultConnections({ apiKey: 'sk-test' })
  return {
    provider: 'dashscope',
    apiKey: 'sk-test',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-plus',
    connections,
    defaultConnectionId: DEFAULT_CONNECTION_IDS.default,
    roleModelMap: {
      general: DEFAULT_CONNECTION_IDS.default,
      researcher: DEFAULT_CONNECTION_IDS.reason,
      writer: DEFAULT_CONNECTION_IDS.creative
    },
    fullAccess: false,
    thinkingEnabled: false,
    maxTurns: 40,
    launchAtLogin: false,
    customProviders: [],
    ...overrides
  }
}

describe('queryInferModelCapability', () => {
  it('图片附件推断 vision', () => {
    expect(queryInferModelCapability('看看这个', ['/tmp/a.png'])).toBe('vision')
  })

  it('看图关键词推断 vision', () => {
    expect(queryInferModelCapability('请识别图片里的文字')).toBe('vision')
  })

  it('超长文本推断 longContext', () => {
    const text = 'a'.repeat(LONG_CONTEXT_CHAR_THRESHOLD)
    expect(queryInferModelCapability(text)).toBe('longContext')
  })

  it('推理关键词推断 reasoning', () => {
    expect(queryInferModelCapability('帮我排查这个报错的根因')).toBe('reasoning')
  })

  it('创作关键词推断 creative', () => {
    expect(queryInferModelCapability('帮我写一篇小红书文案')).toBe('creative')
  })

  it('普通闲聊默认 chat', () => {
    expect(queryInferModelCapability('今天天气怎么样')).toBe('chat')
  })
})

describe('queryParseSupervisorRoute', () => {
  it('解析 next 与 capability', () => {
    expect(
      queryParseSupervisorRoute('前缀 {"next":"publish","capability":"creative"} 后缀')
    ).toEqual({
      nextAgent: 'researcher',
      pipelineKind: 'publish',
      capability: 'creative'
    })
  })

  it('非法 capability 时仅保留 next', () => {
    expect(queryParseSupervisorRoute('{"next":"general","capability":"turbo"}')).toEqual({
      nextAgent: 'general',
      pipelineKind: 'general'
    })
  })

  it('非法 JSON 返回 null', () => {
    expect(queryParseSupervisorRoute('不是 json')).toBeNull()
  })

  it('非法 next 返回 null', () => {
    expect(queryParseSupervisorRoute('{"next":"unknown"}')).toBeNull()
  })

  it('可路由到已注册的自定义角色', () => {
    expect(
      queryParseSupervisorRoute('{"next":"custom_legal","capability":"chat"}', new Set(['custom_legal']))
    ).toEqual({
      nextAgent: 'custom_legal',
      pipelineKind: 'general',
      capability: 'chat'
    })
  })
})

describe('queryResolveModelConnection', () => {
  it('角色连接不具备 capability 时，优先同供应商升级而非跨供应商', () => {
    const settings = queryTestSettings()
    const conn = queryResolveModelConnection(settings, {
      role: 'researcher',
      capability: 'creative'
    })
    // researcher 映射 reason（无 creative）→ 同供应商 creative
    expect(conn.id).toBe(DEFAULT_CONNECTION_IDS.creative)
    expect(conn.provider).toBe('dashscope')
  })

  it('DeepSeek 角色不会被列表前部的百炼文生图连接抢走', () => {
    const deepseekConns = queryBuildDefaultConnections({
      apiKey: 'sk-ds',
      provider: 'deepseek'
    })
    const settings = queryTestSettings({
      provider: 'deepseek',
      apiKey: 'sk-ds',
      baseUrl: 'https://api.deepseek.com',
      model: 'deepseek-v4-flash',
      connections: [
        {
          id: 'conn-t2i',
          label: '文生图',
          provider: 'dashscope',
          apiKey: 'sk-aliyun',
          baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
          model: 'qwen-plus',
          capabilities: ['chat', 'creative', 'vision']
        },
        ...deepseekConns
      ],
      defaultConnectionId: DEFAULT_CONNECTION_IDS.default,
      roleModelMap: {
        researcher: DEFAULT_CONNECTION_IDS.default
      }
    })
    const conn = queryResolveModelConnection(settings, {
      role: 'researcher',
      capability: 'creative'
    })
    expect(conn.provider).toBe('deepseek')
    expect(conn.id).toBe(DEFAULT_CONNECTION_IDS.creative)
  })

  it('DeepSeek 角色无同供应商 creative 时，坚持角色连接，不跨到图生成视频', () => {
    // 复现：调研员绑定「默认 (DeepSeek)」，Supervisor 给出 creative，
    // 列表里只有 dashscope「图生成视频」带 creative → 不得抢走角色配置
    const settings = queryTestSettings({
      provider: 'deepseek',
      apiKey: 'sk-ds',
      baseUrl: 'https://api.deepseek.com',
      model: 'deepseek-v4-flash',
      connections: [
        {
          id: 'conn-img2video',
          label: '图生成视频',
          provider: 'dashscope',
          apiKey: 'sk-aliyun',
          baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
          model: 'qwen-plus',
          capabilities: ['creative', 'chat', 'vision']
        },
        {
          id: DEFAULT_CONNECTION_IDS.default,
          label: '默认 (DeepSeek) 文本处理',
          provider: 'deepseek',
          apiKey: 'sk-ds',
          baseUrl: 'https://api.deepseek.com',
          model: 'deepseek-v4-flash',
          capabilities: ['chat']
        }
      ],
      defaultConnectionId: DEFAULT_CONNECTION_IDS.default,
      roleModelMap: {
        researcher: DEFAULT_CONNECTION_IDS.default
      }
    })
    const conn = queryResolveModelConnection(settings, {
      role: 'researcher',
      capability: 'creative'
    })
    expect(conn.provider).toBe('deepseek')
    expect(conn.id).toBe(DEFAULT_CONNECTION_IDS.default)
    expect(conn.label).toBe('默认 (DeepSeek) 文本处理')
  })

  it('vision 能力仍允许 DeepSeek 角色跨到百炼媒体连接', () => {
    const settings = queryTestSettings({
      provider: 'deepseek',
      apiKey: 'sk-ds',
      baseUrl: 'https://api.deepseek.com',
      model: 'deepseek-v4-flash',
      connections: [
        {
          id: DEFAULT_CONNECTION_IDS.default,
          label: '默认 (DeepSeek) 文本处理',
          provider: 'deepseek',
          apiKey: 'sk-ds',
          baseUrl: 'https://api.deepseek.com',
          model: 'deepseek-v4-flash',
          capabilities: ['chat']
        },
        {
          id: DEFAULT_CONNECTION_IDS.media,
          label: '媒体生成（百炼 · 万相/TTS）',
          provider: 'dashscope',
          apiKey: 'sk-aliyun',
          baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
          model: 'qwen-plus',
          capabilities: ['vision']
        }
      ],
      defaultConnectionId: DEFAULT_CONNECTION_IDS.default,
      roleModelMap: {
        researcher: DEFAULT_CONNECTION_IDS.default
      }
    })
    const conn = queryResolveModelConnection(settings, {
      role: 'researcher',
      capability: 'vision'
    })
    expect(conn.provider).toBe('dashscope')
    expect(conn.id).toBe(DEFAULT_CONNECTION_IDS.media)
  })

  it('无 capability 时走 roleModelMap', () => {
    const settings = queryTestSettings()
    const conn = queryResolveModelConnection(settings, { role: 'researcher' })
    expect(conn.id).toBe(DEFAULT_CONNECTION_IDS.reason)
  })

  it('无 role 无 capability 时走 default', () => {
    const settings = queryTestSettings()
    const conn = queryResolveModelConnection(settings, {})
    expect(conn.id).toBe(DEFAULT_CONNECTION_IDS.default)
  })
})

describe('supervisor 路由辅助', () => {
  it('关键词兜底 video / publish / content', () => {
    expect(queryInferSupervisorNext('', '生成视频成片')).toBe('video')
    expect(queryInferSupervisorNext('', '帮我发小红书')).toBe('publish')
    expect(queryInferSupervisorNext('', '帮我发一条抖音图文并发布')).toBe('publish')
    expect(queryInferSupervisorNext('', '选 1 个热点深入解析创作内容')).toBe('content')
    expect(queryInferSupervisorNext('', '帮我写一篇小红书文案')).toBe('content')
    expect(queryInferSupervisorNext('', '你好')).toBe('general')
  })

  it('未明确要求发布时，sanitize 将 publish 降级为 content/general', () => {
    expect(
      querySanitizeSupervisorNext('publish', '选 1 个热点深入解析创作内容')
    ).toBe('content')
    expect(querySanitizeSupervisorNext('publish', '帮我发小红书')).toBe('publish')
    expect(querySanitizeSupervisorNext('publish', '今天天气怎么样')).toBe('general')
    expect(querySanitizeSupervisorNext('content', '选热点创作')).toBe('content')
  })

  it('发布意图识别：创作不等于发布', () => {
    expect(queryHasExplicitPublishIntent('选 1 个热点深入解析创作内容')).toBe(false)
    expect(queryHasExplicitPublishIntent('帮我写小红书文案，先不要发布')).toBe(false)
    expect(queryHasExplicitPublishIntent('创作内容并发布到小红书')).toBe(true)
    expect(queryHasExplicitPublishIntent('帮我发一条小红书')).toBe(true)
  })

  it('next 映射管线入口', () => {
    expect(queryPipelineEntryRole('general')).toBe('general')
    expect(queryPipelineEntryRole('content')).toBe('researcher')
    expect(queryPipelineEntryRole('publish')).toBe('researcher')
    expect(queryPipelineEntryRole('video')).toBe('scriptwriter')
  })

  it('解析 content 路由', () => {
    expect(queryParseSupervisorRoute('{"next":"content","capability":"creative"}')).toEqual({
      nextAgent: 'researcher',
      pipelineKind: 'content',
      capability: 'creative'
    })
  })
})
