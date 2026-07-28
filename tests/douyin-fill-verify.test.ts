/**
 * 抖音发布：填写内容回读校验（纯函数，不依赖 Playwright）。
 */
import { describe, expect, it } from 'vitest'
import {
  DOUYIN_PUBLISH_MIN_ZOOM,
  DOUYIN_TITLE_MAX_LENGTH,
  queryDouyinPublishZoomSteps,
  queryDouyinTextLooksFilled,
  queryIsDouyinPublishUrl,
  queryNormalizeDouyinDraftText,
  queryVerifyDouyinFilledDraft
} from '../electron/main/browser/douyin-dom'

describe('queryNormalizeDouyinDraftText', () => {
  it('折叠空白并去掉零宽字符', () => {
    expect(queryNormalizeDouyinDraftText('  你好\u200B  世界  ')).toBe('你好 世界')
    expect(queryNormalizeDouyinDraftText('a\r\nb\n\n\nc')).toBe('a\nb\n\nc')
  })
})

describe('queryDouyinTextLooksFilled', () => {
  it('完整包含或被包含时通过', () => {
    expect(queryDouyinTextLooksFilled('今日热点速览', '今日热点速览 #科技')).toBe(true)
    expect(queryDouyinTextLooksFilled('今日热点速览更多内容', '今日热点速览')).toBe(true)
  })

  it('长文按句子命中率判断', () => {
    const expected =
      '第一段内容足够长。第二段内容也足够长。第三段内容继续展开。第四段内容收尾说明。'
    const actual = '导语。第一段内容足够长。第三段内容继续展开。结尾标签'
    expect(queryDouyinTextLooksFilled(expected, actual)).toBe(true)
  })

  it('空期望视为通过；空回读且期望非空则失败', () => {
    expect(queryDouyinTextLooksFilled('', '任意')).toBe(true)
    expect(queryDouyinTextLooksFilled('有内容', '')).toBe(false)
  })
})

describe('queryVerifyDouyinFilledDraft', () => {
  it('独立标题框 + 描述均匹配时通过', () => {
    const result = queryVerifyDouyinFilledDraft({
      expectedTitle: 'AI 早报',
      expectedContent: '今天有三条科技要闻值得关注。',
      actual: {
        title: 'AI 早报',
        content: '今天有三条科技要闻值得关注。#科技'
      },
      titleFilledSeparately: true
    })
    expect(result.ok).toBe(true)
    expect(result.issues).toEqual([])
  })

  it('标题进了描述区时仍可通过', () => {
    const result = queryVerifyDouyinFilledDraft({
      expectedTitle: 'AI 早报',
      expectedContent: '今天有三条科技要闻值得关注。',
      actual: {
        title: '',
        content: 'AI 早报\n今天有三条科技要闻值得关注。'
      },
      titleFilledSeparately: true
    })
    expect(result.ok).toBe(true)
  })

  it('标题与正文都未写入时失败', () => {
    const result = queryVerifyDouyinFilledDraft({
      expectedTitle: 'AI 早报',
      expectedContent: '今天有三条科技要闻值得关注。',
      actual: { title: '', content: '' },
      titleFilledSeparately: true
    })
    expect(result.ok).toBe(false)
    expect(result.issues.length).toBeGreaterThan(0)
  })

  it('合并写入：描述含标题+正文即通过', () => {
    const result = queryVerifyDouyinFilledDraft({
      expectedTitle: '周末出行',
      expectedContent: '记得带伞。',
      actual: {
        title: '',
        content: '周末出行\n记得带伞。'
      },
      titleFilledSeparately: false
    })
    expect(result.ok).toBe(true)
  })
})

describe('queryDouyinPublishZoomSteps', () => {
  it('默认从 90% 降到 50%', () => {
    expect(queryDouyinPublishZoomSteps()).toEqual([0.9, 0.8, 0.7, 0.6, 0.5])
    expect(DOUYIN_PUBLISH_MIN_ZOOM).toBe(0.5)
  })

  it('自定义下限时截断阶梯', () => {
    expect(queryDouyinPublishZoomSteps(0.7)).toEqual([0.9, 0.8, 0.7])
  })
})

describe('DOUYIN_TITLE_MAX_LENGTH', () => {
  it('标题硬上限为 20 字', () => {
    expect(DOUYIN_TITLE_MAX_LENGTH).toBe(20)
  })
})

describe('queryIsDouyinPublishUrl', () => {
  it('识别上传/发布页，排除首页', () => {
    expect(
      queryIsDouyinPublishUrl('https://creator.douyin.com/creator-micro/content/upload')
    ).toBe(true)
    expect(
      queryIsDouyinPublishUrl('https://creator.douyin.com/creator-micro/content/post/image')
    ).toBe(true)
    expect(queryIsDouyinPublishUrl('https://creator.douyin.com/creator-micro/home')).toBe(false)
    expect(queryIsDouyinPublishUrl('https://creator.douyin.com/')).toBe(false)
  })
})
