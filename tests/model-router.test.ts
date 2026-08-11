import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CONNECTION_IDS,
  queryBuildDefaultConnections,
  type AppSettings
} from '../shared/types'
import {
  LONG_CONTEXT_CHAR_THRESHOLD,
  queryHasExplicitCreativeMediaIntent,
  queryHasExplicitPublishIntent,
  queryInferModelCapability,
  queryInferSupervisorNext,
  queryParseSupervisorRoute,
  queryPipelineEntryRole,
  queryResolveModelConnection,
  queryResolveSupervisorRoute,
  querySanitizeModelCapability,
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
    closeToTray: true,
    customProviders: [],
    ...overrides
  }
}

describe('queryInferModelCapability', () => {
  it('图片附件不再自动推断 vision（改由本机 OCR 注入文本）', () => {
    expect(queryInferModelCapability('看看这个', ['/tmp/a.png'])).toBe('chat')
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

  it('普通撰稿/文案不推断 creative，走 chat', () => {
    expect(queryInferModelCapability('帮我写一篇小红书文案')).toBe('chat')
    expect(queryInferModelCapability('选 1 个热点深入解析创作内容')).toBe('chat')
  })

  it('仅明确文生图/图生成视频才推断 creative', () => {
    expect(queryInferModelCapability('用文生图做一张海报')).toBe('creative')
    expect(queryInferModelCapability('把这张图生成视频')).toBe('creative')
    expect(queryInferModelCapability('图生视频做成片')).toBe('creative')
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
  it('明确 creative 时，优先同供应商带 creative 的连接（媒体）', () => {
    const settings = queryTestSettings()
    const conn = queryResolveModelConnection(settings, {
      role: 'researcher',
      capability: 'creative'
    })
    // researcher 映射 reason（无 creative）→ 同供应商 media（creative）
    expect(conn.id).toBe(DEFAULT_CONNECTION_IDS.media)
    expect(conn.provider).toBe('dashscope')
  })

  it('明确 creative（文生图）时，可跨供应商选用文生图连接', () => {
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
    // DeepSeek 默认套装的 media 也带 creative；同供应商优先于列表前部的文生图
    expect(conn.provider).toBe('dashscope')
    expect(conn.capabilities).toContain('creative')
  })

  it('无明确 creative 意图时 sanitize 为 chat，坚持角色 DeepSeek 连接', () => {
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
    const capability = querySanitizeModelCapability('creative', '选热点写一篇小红书文案')
    expect(capability).toBe('chat')
    const conn = queryResolveModelConnection(settings, {
      role: 'researcher',
      capability
    })
    expect(conn.provider).toBe('deepseek')
    expect(conn.id).toBe(DEFAULT_CONNECTION_IDS.default)
    expect(conn.label).toBe('默认 (DeepSeek) 文本处理')
  })

  it('明确图生成视频时，creative 可跨到对应媒体连接', () => {
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
    const capability = querySanitizeModelCapability('creative', '请用图生成视频做成片')
    expect(capability).toBe('creative')
    const conn = queryResolveModelConnection(settings, {
      role: 'researcher',
      capability
    })
    expect(conn.label).toBe('图生成视频')
    expect(conn.provider).toBe('dashscope')
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
          capabilities: ['vision', 'creative']
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

describe('querySanitizeModelCapability', () => {
  it('creative 仅在明确文生图/图生成视频时保留', () => {
    expect(queryHasExplicitCreativeMediaIntent('帮我文生图')).toBe(true)
    expect(queryHasExplicitCreativeMediaIntent('图生成视频')).toBe(true)
    expect(queryHasExplicitCreativeMediaIntent('写小红书文案')).toBe(false)
    expect(querySanitizeModelCapability('creative', '写一篇文案')).toBe('chat')
    expect(querySanitizeModelCapability('creative', '文生图出海报')).toBe('creative')
    expect(querySanitizeModelCapability('reasoning', '写一篇文案')).toBe('reasoning')
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

  it('Remotion 模版仅产出 props JSON 时，sanitize 将 video 降级为 general', () => {
    const propsOnlyPrompt = [
      '你是 Remotion 热点新闻视频的内容导演兼文案编辑。最终只输出一个符合 schema 的 JSON，不要 Markdown 说明。',
      '模板 compositionId：HotNews',
      '必须调用 fetch_hot_topics 获取今日热点。',
      '成片总时长：约 45 秒。'
    ].join('\n')
    expect(querySanitizeSupervisorNext('video', propsOnlyPrompt)).toBe('general')
    expect(queryInferSupervisorNext('', propsOnlyPrompt)).toBe('video')
    expect(
      queryResolveSupervisorRoute('{"next":"video","capability":"chat"}', propsOnlyPrompt)
    ).toEqual({
      nextAgent: 'general',
      pipelineKind: 'general',
      capability: 'chat'
    })
    // 明确要走成片/渲染管线时保留 video
    expect(
      querySanitizeSupervisorNext(
        'video',
        '请用 remotion_render 导出成片，compositionId=HotNews'
      )
    ).toBe('video')
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

  it('撰稿任务误标 creative 时 resolve 会降为 chat', () => {
    expect(
      queryResolveSupervisorRoute(
        '{"next":"content","capability":"creative"}',
        '选 1 个热点深入解析创作内容'
      )
    ).toEqual({
      nextAgent: 'researcher',
      pipelineKind: 'content',
      capability: 'chat'
    })
  })

  it('明确图生成视频时保留 creative', () => {
    expect(
      queryResolveSupervisorRoute(
        '{"next":"video","capability":"creative"}',
        '请用图生成视频做成片'
      )
    ).toEqual({
      nextAgent: 'scriptwriter',
      pipelineKind: 'video',
      capability: 'creative'
    })
  })
})
