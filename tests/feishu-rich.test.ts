import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  markdownToFeishuPost,
  markdownToFeishuTextRich,
  markdownToFeishuLines,
  parseMarkdownLineToPostElements,
  queryLooksLikeMarkdown
} from '../electron/main/notify/feishu-rich'
import { queryFeishuMsgType } from '../shared/publish-channels'

const queryHttpResponseMock = vi.fn()

vi.mock('../electron/main/net/http-client', () => ({
  queryHttpResponse: (...args: unknown[]) => queryHttpResponseMock(...args)
}))

describe('parseMarkdownLineToPostElements', () => {
  it('将行内链接转为 tag=a', () => {
    expect(parseMarkdownLineToPostElements('详见 [OpenAI 博客](https://openai.com/blog)')).toEqual([
      { tag: 'text', text: '详见 ' },
      { tag: 'a', text: 'OpenAI 博客', href: 'https://openai.com/blog' }
    ])
  })
})

describe('markdownToFeishuPost', () => {
  it('生成 post 富文本结构，含标题、@所有人与多行正文', () => {
    const md = '## 热点一\n- 摘要 [来源](https://example.com)'
    const post = markdownToFeishuPost(md, {
      atUserId: 'all',
      title: '昨日热点简报'
    })

    expect(post.title).toBe('昨日热点简报')
    expect(post.content[0][0]).toEqual({ tag: 'at', user_id: 'all' })
    expect(post.content[0][1]).toEqual({ tag: 'text', text: '热点一' })
    expect(post.content[1]).toEqual([
      { tag: 'text', text: '• 摘要 ' },
      { tag: 'a', text: '来源', href: 'https://example.com' }
    ])
  })

  it('去除粗体标记', () => {
    const post = markdownToFeishuPost('**重要** 更新', { title: '通知' })
    expect(post.content[0]).toEqual([{ tag: 'text', text: '重要 更新' }])
  })

  it('将 Markdown 表格转为可读行（无管道符）', () => {
    const md = [
      '| 指标 | 数值 | 信号 |',
      '|------|------|------|',
      '| RSI | 58.2 | 中性 |',
      '| 现价 | 28.5 | 观望 |'
    ].join('\n')
    const lines = markdownToFeishuLines(md)
    expect(lines[0]).toBe('指标    数值    信号')
    expect(lines[1]).toBe('RSI    58.2    中性')
    expect(lines[2]).toBe('现价    28.5    观望')
    expect(lines.join('\n')).not.toContain('|')
  })

  it('章节标题单独成段', () => {
    const lines = markdownToFeishuLines('## 一、市场分析\n正文段落')
    expect(lines).toContain('一、市场分析')
    expect(lines).toContain('正文段落')
  })
})

describe('queryLooksLikeMarkdown', () => {
  it('识别表格与标题', () => {
    expect(queryLooksLikeMarkdown('| a | b |')).toBe(true)
    expect(queryLooksLikeMarkdown('## 标题')).toBe(true)
    expect(queryLooksLikeMarkdown('纯文本通知')).toBe(false)
  })
})

describe('markdownToFeishuTextRich', () => {
  it('降级为 text 消息的 <at>/<a> 标签字符串', () => {
    const result = markdownToFeishuTextRich('详见 [链接](https://a.com)', {
      atUserId: 'ou_xxx',
      title: '提醒'
    })
    expect(result).toContain('<at user_id="ou_xxx"></at>')
    expect(result).toContain('<a href="https://a.com">链接</a>')
  })
})

describe('queryFeishuMsgType', () => {
  it('显式 msgType 优先', () => {
    expect(queryFeishuMsgType({ msgType: 'image', richText: true, channelId: 'feishu' })).toBe(
      'image'
    )
  })

  it('richText=false 兼容为 text', () => {
    expect(queryFeishuMsgType({ richText: false, channelId: 'feishu' })).toBe('text')
  })

  it('richText=true 兼容为 post', () => {
    expect(queryFeishuMsgType({ richText: true, channelId: 'feishu' })).toBe('post')
  })

  it('飞书渠道缺省为 post', () => {
    expect(queryFeishuMsgType({ channelId: 'feishu' })).toBe('post')
  })

  it('渠道默认类型覆盖飞书缺省', () => {
    expect(queryFeishuMsgType({ channelId: 'feishu', channelDefault: 'text' })).toBe('text')
  })

  it('非飞书渠道缺省为 text', () => {
    expect(queryFeishuMsgType({ channelId: 'webhook' })).toBe('text')
  })
})

describe('postFeishuWebhookPost', () => {
  beforeEach(() => {
    queryHttpResponseMock.mockResolvedValue({
      ok: true,
      json: async () => ({ code: 0, msg: 'success' })
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('富文本请求体结构与飞书官方文档一致', async () => {
    const { postFeishuWebhookPost } = await import('../electron/main/notify/feishu')
    await postFeishuWebhookPost({
      webhookUrl: 'https://open.feishu.cn/open-apis/bot/v2/hook/test',
      post: {
        title: '项目更新通知',
        content: [
          [
            { tag: 'text', text: '项目有更新: ' },
            { tag: 'a', text: '请查看', href: 'http://www.example.com/' },
            { tag: 'at', user_id: 'ou_18eac8xxxxxxxx17ad4f02e8bbbb' }
          ]
        ]
      }
    })

    const call = queryHttpResponseMock.mock.calls[0]
    const body = call[1].body as Record<string, unknown>
    expect(body).toEqual({
      msg_type: 'post',
      content: {
        post: {
          zh_cn: {
            title: '项目更新通知',
            content: [
              [
                { tag: 'text', text: '项目有更新: ' },
                { tag: 'a', text: '请查看', href: 'http://www.example.com/' },
                { tag: 'at', user_id: 'ou_18eac8xxxxxxxx17ad4f02e8bbbb' }
              ]
            ]
          }
        }
      }
    })
  })
})

describe('postFeishuWebhookImage / postFeishuWebhookShareChat', () => {
  beforeEach(() => {
    queryHttpResponseMock.mockResolvedValue({
      ok: true,
      json: async () => ({ code: 0, msg: 'success' })
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('图片消息请求体符合飞书文档', async () => {
    const { postFeishuWebhookImage } = await import('../electron/main/notify/feishu')
    await postFeishuWebhookImage({
      webhookUrl: 'https://open.feishu.cn/open-apis/bot/v2/hook/test',
      imageKey: 'img_abc'
    })

    const call = queryHttpResponseMock.mock.calls[0]
    const body = call[1].body as Record<string, unknown>
    expect(body).toEqual({
      msg_type: 'image',
      content: { image_key: 'img_abc' }
    })
  })

  it('群名片请求体符合飞书文档', async () => {
    const { postFeishuWebhookShareChat } = await import('../electron/main/notify/feishu')
    await postFeishuWebhookShareChat({
      webhookUrl: 'https://open.feishu.cn/open-apis/bot/v2/hook/test',
      shareChatId: 'oc_xyz'
    })

    const call = queryHttpResponseMock.mock.calls[0]
    const body = call[1].body as Record<string, unknown>
    expect(body).toEqual({
      msg_type: 'share_chat',
      content: { share_chat_id: 'oc_xyz' }
    })
  })
})
