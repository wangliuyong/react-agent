import { describe, expect, it } from 'vitest'
import {
  markdownToFeishuPost,
  markdownToFeishuTextRich,
  parseMarkdownLineToPostElements
} from '../electron/main/notify/feishu-rich'

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
      { tag: 'text', text: '摘要 ' },
      { tag: 'a', text: '来源', href: 'https://example.com' }
    ])
  })

  it('去除粗体标记', () => {
    const post = markdownToFeishuPost('**重要** 更新', { title: '通知' })
    expect(post.content[0]).toEqual([{ tag: 'text', text: '重要 更新' }])
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
