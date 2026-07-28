/**
 * 抖音发布：填写内容回读校验（纯函数，不依赖 Playwright）。
 */
import { describe, expect, it } from 'vitest'
import {
  DOUYIN_TITLE_MAX_LENGTH,
  queryDouyinTextLooksFilled,
  queryIsDouyinCreatorHomeUrl,
  queryIsDouyinPublishUrl,
  queryNormalizeDouyinDraftText,
  queryParseDouyinAddedImageCount,
  queryVerifyDouyinFilledDraft
} from '../electron/main/browser/douyin-dom'
import {
  queryIsDouyinSafeImagePath,
  queryNeedsDouyinImageConvert
} from '../electron/main/browser/douyin-image-prepare'
import { queryMimeTypeFromFilePath } from '../electron/main/browser/human-input'

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

describe('queryIsDouyinCreatorHomeUrl', () => {
  it('识别创作者首页落点', () => {
    expect(queryIsDouyinCreatorHomeUrl('https://creator.douyin.com/creator-micro/home')).toBe(true)
    expect(queryIsDouyinCreatorHomeUrl('https://creator.douyin.com/creator-micro')).toBe(true)
    expect(
      queryIsDouyinCreatorHomeUrl('https://creator.douyin.com/creator-micro/content/upload')
    ).toBe(false)
  })
})

describe('douyin image prepare', () => {
  it('仅 jpg/jpeg 可直传；png/webp/gif 等需转 JPEG（避免创作者中心拒收）', () => {
    expect(queryIsDouyinSafeImagePath('/tmp/a.jpg')).toBe(true)
    expect(queryIsDouyinSafeImagePath('/tmp/a.JPEG')).toBe(true)
    expect(queryIsDouyinSafeImagePath('/tmp/a.PNG')).toBe(false)
    expect(queryIsDouyinSafeImagePath('/tmp/a.webp')).toBe(false)
    expect(queryIsDouyinSafeImagePath('/tmp/a.gif')).toBe(false)
    expect(queryNeedsDouyinImageConvert('/tmp/a.gif')).toBe(true)
    expect(queryNeedsDouyinImageConvert('/tmp/a.webp')).toBe(true)
    expect(queryNeedsDouyinImageConvert('/tmp/a.png')).toBe(true)
    expect(queryNeedsDouyinImageConvert('/tmp/a.jpeg')).toBe(false)
  })
})

describe('queryMimeTypeFromFilePath', () => {
  it('按扩展名推断拖放 MIME', () => {
    expect(queryMimeTypeFromFilePath('/tmp/a.jpg')).toBe('image/jpeg')
    expect(queryMimeTypeFromFilePath('/tmp/a.PNG')).toBe('image/png')
    expect(queryMimeTypeFromFilePath('/tmp/a.webp')).toBe('image/webp')
    expect(queryMimeTypeFromFilePath('/tmp/a.bin')).toBe('application/octet-stream')
  })
})

describe('queryParseDouyinAddedImageCount', () => {
  it('从「已添加N张图片」文案解析数量', () => {
    expect(queryParseDouyinAddedImageCount('已添加1张图片')).toBe(1)
    expect(queryParseDouyinAddedImageCount('已添加 3 张图片')).toBe(3)
    expect(queryParseDouyinAddedImageCount('其它文案 已添加12张 结尾')).toBe(12)
    expect(queryParseDouyinAddedImageCount('没有配图')).toBe(0)
  })
})

describe('headed window placement', () => {
  it('识别异常小窗口并生成贴合工作区的 placement', async () => {
    const { queryIsHeadedWindowPlacementTooSmall, queryNormalHeadedWindowPlacement } =
      await import('../electron/main/browser/browser-stealth')
    const workArea = { x: 0, y: 25, width: 1440, height: 875 }
    expect(
      queryIsHeadedWindowPlacementTooSmall(
        { left: 475, top: 53, right: 975, bottom: 428 },
        workArea
      )
    ).toBe(true)
    const normal = queryNormalHeadedWindowPlacement(workArea)
    expect(normal.right - normal.left).toBe(1440)
    expect(queryIsHeadedWindowPlacementTooSmall(normal, workArea)).toBe(false)
  })
})
