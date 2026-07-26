/**
 * 小红书发布类型 / 官方入口 URL / 图文 TAB 判定（纯函数，不依赖 Playwright）。
 */
import { describe, expect, it } from 'vitest'
import {
  XHS_PUBLISH_IMAGE_URL,
  XHS_PUBLISH_URLS,
  queryBuildXhsPublishImageUrl,
  queryBuildXhsPublishUrl,
  queryInferXhsPublishType,
  queryIsXhsImagePublishModeFromSignals,
  queryMatchXhsImageTabLabel,
  queryNormalizeXhsPublishType
} from '../electron/main/browser/xhs-dom'

describe('queryMatchXhsImageTabLabel', () => {
  it('匹配「上传图文」与「图文」', () => {
    expect(queryMatchXhsImageTabLabel('上传图文')).toBe(true)
    expect(queryMatchXhsImageTabLabel('图文')).toBe(true)
    expect(queryMatchXhsImageTabLabel(' 上传图文 ')).toBe(true)
  })

  it('不匹配视频/长文/播客', () => {
    expect(queryMatchXhsImageTabLabel('上传视频')).toBe(false)
    expect(queryMatchXhsImageTabLabel('写长文')).toBe(false)
    expect(queryMatchXhsImageTabLabel('发播客')).toBe(false)
  })
})

describe('官方发布入口 URL', () => {
  it('四种类型使用 from=menu&target=*', () => {
    expect(XHS_PUBLISH_URLS.video).toBe(
      'https://creator.xiaohongshu.com/publish/publish?from=menu&target=video'
    )
    expect(XHS_PUBLISH_URLS.image).toBe(
      'https://creator.xiaohongshu.com/publish/publish?from=menu&target=image'
    )
    expect(XHS_PUBLISH_URLS.article).toBe(
      'https://creator.xiaohongshu.com/publish/publish?from=menu&target=article'
    )
    expect(XHS_PUBLISH_URLS.audio).toBe(
      'https://creator.xiaohongshu.com/publish/publish?from=menu&target=audio'
    )
  })

  it('queryBuildXhsPublishUrl 按类型返回', () => {
    expect(queryBuildXhsPublishUrl('image')).toContain('target=image')
    expect(queryBuildXhsPublishUrl('video')).toContain('target=video')
    expect(queryBuildXhsPublishUrl('article')).toContain('from=menu')
  })

  it('图文兼容函数始终返回官方图文入口', () => {
    expect(XHS_PUBLISH_IMAGE_URL).toContain('target=image')
    expect(queryBuildXhsPublishImageUrl()).toBe(XHS_PUBLISH_URLS.image)
    expect(
      queryBuildXhsPublishImageUrl(
        'https://creator.xiaohongshu.com/publish/publish?source=image'
      )
    ).toBe(XHS_PUBLISH_URLS.image)
  })
})

describe('queryNormalizeXhsPublishType / queryInferXhsPublishType', () => {
  it('规范化中英文别名', () => {
    expect(queryNormalizeXhsPublishType('图文')).toBe('image')
    expect(queryNormalizeXhsPublishType('video')).toBe('video')
    expect(queryNormalizeXhsPublishType('写长文')).toBe('article')
    expect(queryNormalizeXhsPublishType('播客')).toBe('audio')
    expect(queryNormalizeXhsPublishType('unknown')).toBe(null)
  })

  it('显式 publishType 优先', () => {
    expect(
      queryInferXhsPublishType({
        publishType: 'video',
        imagePaths: ['/a.jpg']
      })
    ).toBe('video')
  })

  it('有 videoPaths 推断为视频', () => {
    expect(queryInferXhsPublishType({ videoPaths: ['/a.mp4'] })).toBe('video')
  })

  it('有 audioPaths 推断为播客', () => {
    expect(queryInferXhsPublishType({ audioPaths: ['/a.mp3'] })).toBe('audio')
  })

  it('长文无图推断为 article', () => {
    expect(
      queryInferXhsPublishType({
        content: '啊'.repeat(140)
      })
    ).toBe('article')
  })

  it('默认图文', () => {
    expect(
      queryInferXhsPublishType({
        imagePaths: ['/a.jpg'],
        content: '短文案'
      })
    ).toBe('image')
  })
})

describe('queryIsXhsImagePublishModeFromSignals', () => {
  it('激活 TAB 为上传图文时判定为图文模式', () => {
    expect(
      queryIsXhsImagePublishModeFromSignals({
        activeTabText: '上传图文',
        bodyText: '拖拽视频到此或点击上传',
        fileAccept: 'video/*'
      })
    ).toBe(true)
  })

  it('激活 TAB 为上传视频时判定非图文', () => {
    expect(
      queryIsXhsImagePublishModeFromSignals({
        activeTabText: '上传视频',
        bodyText: '拖拽视频到此或点击上传',
        fileAccept: 'video/mp4,video/quicktime'
      })
    ).toBe(false)
  })

  it('无激活 TAB 时用正文/accept 启发式', () => {
    expect(
      queryIsXhsImagePublishModeFromSignals({
        activeTabText: '',
        bodyText: '拖拽图片到此或点击上传\n上传图片',
        fileAccept: 'image/jpeg,image/png'
      })
    ).toBe(true)
    expect(
      queryIsXhsImagePublishModeFromSignals({
        activeTabText: '',
        bodyText: '拖拽视频到此或点击上传',
        fileAccept: 'video/*'
      })
    ).toBe(false)
  })
})
