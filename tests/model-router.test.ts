import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CONNECTION_IDS,
  queryBuildDefaultConnections,
  type AppSettings
} from '../shared/types'
import {
  LONG_CONTEXT_CHAR_THRESHOLD,
  queryInferModelCapability,
  queryInferSupervisorNext,
  queryParseSupervisorRoute,
  queryPipelineEntryRole,
  queryResolveModelConnection
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
    ).toEqual({ next: 'publish', capability: 'creative' })
  })

  it('非法 capability 时仅保留 next', () => {
    expect(queryParseSupervisorRoute('{"next":"general","capability":"turbo"}')).toEqual({
      next: 'general'
    })
  })

  it('非法 JSON 返回 null', () => {
    expect(queryParseSupervisorRoute('不是 json')).toBeNull()
  })

  it('非法 next 返回 null', () => {
    expect(queryParseSupervisorRoute('{"next":"unknown"}')).toBeNull()
  })
})

describe('queryResolveModelConnection', () => {
  it('显式 capability 优先于 roleModelMap', () => {
    const settings = queryTestSettings()
    const conn = queryResolveModelConnection(settings, {
      role: 'researcher',
      capability: 'creative'
    })
    expect(conn.id).toBe(DEFAULT_CONNECTION_IDS.creative)
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
  it('关键词兜底 video / publish', () => {
    expect(queryInferSupervisorNext('', '生成视频成片')).toBe('video')
    expect(queryInferSupervisorNext('', '帮我发小红书')).toBe('publish')
    expect(queryInferSupervisorNext('', '你好')).toBe('general')
  })

  it('next 映射管线入口', () => {
    expect(queryPipelineEntryRole('general')).toBe('general')
    expect(queryPipelineEntryRole('publish')).toBe('researcher')
    expect(queryPipelineEntryRole('video')).toBe('scriptwriter')
  })
})
