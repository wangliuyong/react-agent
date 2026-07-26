/**
 * 小红书标题/正文字数上限（纯函数，不依赖 Playwright）。
 */
import { describe, expect, it } from 'vitest'
import {
  XHS_CONTENT_MAX_LENGTH,
  XHS_TITLE_MAX_LENGTH,
  queryClampXhsPublishText
} from '../electron/main/browser/xhs-content-limits'

describe('XHS 字数常量', () => {
  it('图文/视频/播客：标题 20、正文 1000', () => {
    expect(XHS_TITLE_MAX_LENGTH.image).toBe(20)
    expect(XHS_TITLE_MAX_LENGTH.video).toBe(20)
    expect(XHS_TITLE_MAX_LENGTH.audio).toBe(20)
    expect(XHS_CONTENT_MAX_LENGTH.image).toBe(1000)
    expect(XHS_CONTENT_MAX_LENGTH.video).toBe(1000)
    expect(XHS_CONTENT_MAX_LENGTH.audio).toBe(1000)
  })

  it('长文：标题 40、正文上限更高', () => {
    expect(XHS_TITLE_MAX_LENGTH.article).toBe(40)
    expect(XHS_CONTENT_MAX_LENGTH.article).toBeGreaterThan(1000)
  })
})

describe('queryClampXhsPublishText', () => {
  it('未超限时原样返回', () => {
    const result = queryClampXhsPublishText({
      title: '春季露营清单',
      content: '周末去露营，这几样真的有用。',
      publishType: 'image'
    })
    expect(result.title).toBe('春季露营清单')
    expect(result.content).toBe('周末去露营，这几样真的有用。')
    expect(result.titleTruncated).toBe(false)
    expect(result.contentTruncated).toBe(false)
  })

  it('图文标题超过 20 字时截断', () => {
    const longTitle = '这是一个明显超过二十个汉字限制的超长标题内容'
    expect(longTitle.length).toBeGreaterThan(20)
    const result = queryClampXhsPublishText({
      title: longTitle,
      content: '正文',
      publishType: 'image'
    })
    expect(result.title).toBe(longTitle.slice(0, 20))
    expect(result.title.length).toBe(20)
    expect(result.titleTruncated).toBe(true)
  })

  it('图文正文超过 1000 字时截断', () => {
    const longContent = '啊'.repeat(1200)
    const result = queryClampXhsPublishText({
      title: '标题',
      content: longContent,
      publishType: 'image'
    })
    expect(result.content.length).toBe(1000)
    expect(result.contentTruncated).toBe(true)
  })

  it('长文标题上限 40、正文按长文上限截断', () => {
    const longTitle = '字'.repeat(50)
    const longContent = '文'.repeat(XHS_CONTENT_MAX_LENGTH.article + 100)
    const result = queryClampXhsPublishText({
      title: longTitle,
      content: longContent,
      publishType: 'article'
    })
    expect(result.title.length).toBe(40)
    expect(result.content.length).toBe(XHS_CONTENT_MAX_LENGTH.article)
    expect(result.titleTruncated).toBe(true)
    expect(result.contentTruncated).toBe(true)
  })

  it('视频/播客与图文共用正文 1000 上限', () => {
    const longContent = '描'.repeat(1001)
    for (const publishType of ['video', 'audio'] as const) {
      const result = queryClampXhsPublishText({
        title: '短标题',
        content: longContent,
        publishType
      })
      expect(result.content.length).toBe(1000)
      expect(result.contentTruncated).toBe(true)
    }
  })
})
