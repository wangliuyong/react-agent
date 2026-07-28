/**
 * query-page-media：静态 HTML 媒体提取与参数规范化单测。
 */
import { describe, expect, it } from 'vitest'
import {
  queryAbsoluteMediaUrl,
  queryExtractMediaFromHtml,
  queryKindFromNetworkResponse,
  queryKindFromUrlOrMime,
  queryNormalizeMaxMediaCount,
  queryNormalizeMediaTypes
} from '../electron/main/browser/query-page-media'

const PAGE = 'https://example.com/posts/demo'

const FIXTURE_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta property="og:title" content="演示页" />
  <meta property="og:image" content="https://cdn.example.com/cover.jpg" />
  <meta property="og:video" content="https://cdn.example.com/hero.mp4" />
  <meta property="og:audio" content="https://cdn.example.com/theme.mp3" />
  <title>演示页</title>
</head>
<body>
  <article>
    <p>这是一段足够长的正文，用于模拟文章内容提取场景，保证长度超过常见阈值。</p>
    <img src="/images/photo.png" alt="现场照片" />
    <img src="https://cdn.example.com/icon-logo.png" alt="logo" />
    <video title="宣传片" src="/media/promo.mp4"></video>
    <audio>
      <source src="/media/bgm.mp3" type="audio/mpeg" />
    </audio>
    <a href="https://cdn.example.com/extra.webm">下载</a>
  </article>
</body>
</html>
`

describe('queryNormalizeMediaTypes', () => {
  it('未传或空 → 空数组', () => {
    expect(queryNormalizeMediaTypes(undefined)).toEqual([])
    expect(queryNormalizeMediaTypes([])).toEqual([])
    expect(queryNormalizeMediaTypes(null)).toEqual([])
  })

  it('过滤非法值并保持 image/video/audio 顺序', () => {
    expect(queryNormalizeMediaTypes(['audio', 'foo', 'image', 'video', 'image'])).toEqual([
      'image',
      'video',
      'audio'
    ])
  })
})

describe('queryNormalizeMaxMediaCount', () => {
  it('默认 8，钳制到 1～20', () => {
    expect(queryNormalizeMaxMediaCount(undefined)).toBe(8)
    expect(queryNormalizeMaxMediaCount(0)).toBe(1)
    expect(queryNormalizeMaxMediaCount(99)).toBe(20)
    expect(queryNormalizeMaxMediaCount(5.7)).toBe(5)
  })
})

describe('queryAbsoluteMediaUrl', () => {
  it('解析相对路径为绝对 URL', () => {
    expect(queryAbsoluteMediaUrl('/a.mp4', PAGE)).toBe('https://example.com/a.mp4')
    expect(queryAbsoluteMediaUrl('media/b.mp3', PAGE)).toBe(
      'https://example.com/posts/media/b.mp3'
    )
  })

  it('拒绝 data/blob 与非法协议', () => {
    expect(queryAbsoluteMediaUrl('data:image/png;base64,aaa', PAGE)).toBe('')
    expect(queryAbsoluteMediaUrl('blob:https://x', PAGE)).toBe('')
  })

  it('解码 HTML 实体后的 URL', () => {
    expect(
      queryAbsoluteMediaUrl('https://cdn.example.com/a.mp3?x=1&amp;y=2', PAGE)
    ).toBe('https://cdn.example.com/a.mp3?x=1&y=2')
  })
})

describe('queryKindFromUrlOrMime', () => {
  it('.ogg 归 audio，.ogv 归 video', () => {
    expect(queryKindFromUrlOrMime('https://x.com/a.ogg')).toBe('audio')
    expect(queryKindFromUrlOrMime('https://x.com/a.ogv')).toBe('video')
  })
})

describe('queryKindFromNetworkResponse', () => {
  it('按 Content-Type 识别', () => {
    expect(
      queryKindFromNetworkResponse('https://cdn.example.com/x', 'audio/mpeg', ['audio'])
    ).toBe('audio')
    expect(
      queryKindFromNetworkResponse('https://cdn.example.com/x', 'video/mp4', ['video'])
    ).toBe('video')
  })

  it('无 Content-Type 时回退扩展名，并尊重 kinds 过滤', () => {
    expect(
      queryKindFromNetworkResponse('https://cdn.example.com/song.mp3', '', ['audio'])
    ).toBe('audio')
    expect(
      queryKindFromNetworkResponse('https://cdn.example.com/song.mp3', '', ['video'])
    ).toBeNull()
  })
})

describe('queryExtractMediaFromHtml', () => {
  it('按 mediaTypes 过滤 image/video/audio', () => {
    const all = queryExtractMediaFromHtml(FIXTURE_HTML, PAGE, ['image', 'video', 'audio'], 20)
    const kinds = new Set(all.map((m) => m.kind))
    expect(kinds.has('image')).toBe(true)
    expect(kinds.has('video')).toBe(true)
    expect(kinds.has('audio')).toBe(true)

    const onlyVideo = queryExtractMediaFromHtml(FIXTURE_HTML, PAGE, ['video'], 20)
    expect(onlyVideo.length).toBeGreaterThan(0)
    expect(onlyVideo.every((m) => m.kind === 'video')).toBe(true)

    const onlyAudio = queryExtractMediaFromHtml(FIXTURE_HTML, PAGE, ['audio'], 20)
    expect(onlyAudio.every((m) => m.kind === 'audio')).toBe(true)
  })

  it('相对路径解析为绝对 URL', () => {
    const items = queryExtractMediaFromHtml(FIXTURE_HTML, PAGE, ['video', 'audio', 'image'], 20)
    const urls = items.map((m) => m.url)
    expect(urls).toContain('https://example.com/media/promo.mp4')
    expect(urls).toContain('https://example.com/media/bgm.mp3')
    expect(urls).toContain('https://example.com/images/photo.png')
    expect(urls).toContain('https://cdn.example.com/cover.jpg')
    expect(urls).toContain('https://cdn.example.com/hero.mp4')
    expect(urls).toContain('https://cdn.example.com/theme.mp3')
  })

  it('maxMediaCount 截断', () => {
    const items = queryExtractMediaFromHtml(FIXTURE_HTML, PAGE, ['image', 'video', 'audio'], 2)
    expect(items).toHaveLength(2)
  })

  it('空 kinds 不提取', () => {
    expect(queryExtractMediaFromHtml(FIXTURE_HTML, PAGE, [], 8)).toEqual([])
  })

  it('过滤含 icon/logo 的图片 URL', () => {
    const images = queryExtractMediaFromHtml(FIXTURE_HTML, PAGE, ['image'], 20)
    expect(images.every((m) => !/icon|logo/i.test(m.url))).toBe(true)
  })

  it('解析转义 HTML 教程示例中的 audio 直链', () => {
    const escaped = `
      <p>示例：</p>
      &lt;audio controls&gt;<br>
      &nbsp; &lt;source src=&quot;https://cdn.example.com/horse.mp3&quot; type=&quot;audio/mpeg&quot;&gt;<br>
      &lt;/audio&gt;
    `
    const items = queryExtractMediaFromHtml(escaped, PAGE, ['audio'], 8)
    expect(items.some((m) => m.url.includes('horse.mp3'))).toBe(true)
  })

  it('解析 JSON-LD AudioObject', () => {
    const html = `
      <script type="application/ld+json">
      {
        "@type": "AudioObject",
        "name": "春日小调",
        "contentUrl": "https://cdn.example.com/spring.mp3",
        "encodingFormat": "audio/mpeg"
      }
      </script>
    `
    const items = queryExtractMediaFromHtml(html, PAGE, ['audio'], 8)
    expect(items).toHaveLength(1)
    expect(items[0].url).toBe('https://cdn.example.com/spring.mp3')
    expect(items[0].title).toBe('春日小调')
  })

  it('从脚本字符串中捞裸 mp3 URL', () => {
    const html = `
      <script>
        window.__PLAYER__ = { url: "https://music.cdn.example.com/track/abc123.mp3?token=1" };
      </script>
    `
    const items = queryExtractMediaFromHtml(html, PAGE, ['audio'], 8)
    expect(items.some((m) => /abc123\.mp3/.test(m.url))).toBe(true)
  })
})
