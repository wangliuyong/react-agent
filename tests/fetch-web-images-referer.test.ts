import { describe, expect, it } from 'vitest'
import {
  queryImageDownloadReferer,
  queryPreferHttpsImageUrl
} from '../electron/main/browser/fetch-web-images'

describe('queryImageDownloadReferer', () => {
  const douyinPic =
    'http://p3-pc-sign.douyinpic.com/tos-cn-i-0813c001/oMl9nXgIhQzAPDAfawC5AmrfCAZA9AAAEX6kNG~tplv-dy-aweme-images:q75.webp'

  it('抖音图床使用 douyin.com Referer，而非 CDN origin', () => {
    expect(queryImageDownloadReferer(douyinPic)).toBe('https://www.douyin.com/')
  })

  it('有抖音来源页时优先用完整 pageUrl', () => {
    const page = 'https://www.douyin.com/video/7123456789'
    expect(queryImageDownloadReferer(douyinPic, page)).toBe(page)
  })

  it('小红书 CDN 使用 xiaohongshu Referer', () => {
    const url = 'https://sns-img-qc.xhscdn.com/abc.jpg'
    expect(queryImageDownloadReferer(url)).toBe('https://www.xiaohongshu.com/')
  })
})

describe('queryPreferHttpsImageUrl', () => {
  it('http 升级为 https', () => {
    expect(queryPreferHttpsImageUrl('http://p3-pc-sign.douyinpic.com/a.webp')).toMatch(
      /^https:\/\//
    )
  })
})
