import { describe, expect, it } from 'vitest'
import {
  extractMessageImages,
  queryEmbedImagesInDisplayText,
  queryFormatMarkdownImage,
  queryInlinedImageSrcs,
  stripImagePathsFromDisplayText
} from '../src/features/chat/utils/message-images'
import {
  extractMessageMedia,
  queryDisplayContent
} from '../src/features/chat/utils/message-media'

const APP_SUPPORT_PNG =
  '/Users/wly/Library/Application Support/lingxi/react-agent-data/videos/scenes/s1/cat_sunlight.png'
const APP_SUPPORT_PNG_2 =
  '/Users/wly/Library/Application Support/lingxi/react-agent-data/videos/scenes/s1/dog.png'
const APP_SUPPORT_MP4 =
  '/Users/wly/Library/Application Support/lingxi/react-agent-data/videos/scenes/s1/shot-1.mp4'

describe('聊天媒体路径提取（含 Application Support 空格与中文冒号）', () => {
  it('识别「图片路径：」后的本地 png（含空格目录）', () => {
    const text = `文生图成功。\n图片路径：${APP_SUPPORT_PNG}\n说明：已保存`
    const images = extractMessageImages(text)
    expect(images).toHaveLength(1)
    expect(images[0].kind).toBe('local')
    expect(images[0].src).toBe(APP_SUPPORT_PNG)
  })

  it('识别 markdown 图片与反引号包裹路径', () => {
    const text =
      `![生成图片](${APP_SUPPORT_PNG})\n` + `本地路径：\`${APP_SUPPORT_PNG}\``
    const images = extractMessageImages(text)
    expect(images).toHaveLength(1)
    expect(images[0].src).toBe(APP_SUPPORT_PNG)
  })

  it('识别尖括号目的地的含空格 markdown 图片', () => {
    const text = `1. ${queryFormatMarkdownImage('image-1.jpg', APP_SUPPORT_PNG)}\n   ← https://cdn.example.com/a.jpg`
    const images = extractMessageImages(text)
    expect(images).toHaveLength(1)
    expect(images[0].src).toBe(APP_SUPPORT_PNG)
    expect(images[0].kind).toBe('local')
  })

  it('含空格路径嵌入时自动加 CommonMark 尖括号', () => {
    expect(queryFormatMarkdownImage('image-1.jpg', APP_SUPPORT_PNG)).toBe(
      `![image-1.jpg](<${APP_SUPPORT_PNG}>)`
    )
    expect(queryFormatMarkdownImage('a.png', '/tmp/a.png')).toBe('![a.png](/tmp/a.png)')
  })

  it('strip 后正文不再残留裸路径与「本地路径：」标签', () => {
    const text = `✅ 图片已生成\n本地路径: ${APP_SUPPORT_PNG}\n一只橘猫`
    const images = extractMessageImages(text)
    const stripped = stripImagePathsFromDisplayText(text, images)
    expect(stripped).not.toContain(APP_SUPPORT_PNG)
    expect(stripped).not.toMatch(/本地路径/)
    expect(stripped).toContain('橘猫')
  })

  it('识别中文冒号后的本地 mp4', () => {
    const text = `成片路径：${APP_SUPPORT_MP4}`
    const { video } = extractMessageMedia(text)
    expect(video).toHaveLength(1)
    expect(video[0].src).toBe(APP_SUPPORT_MP4)
  })

  it('queryDisplayContent 将本地图嵌入 Markdown，并去掉视频裸路径', () => {
    const text =
      `已生成\n图片路径：${APP_SUPPORT_PNG}\n视频：${APP_SUPPORT_MP4}\n请查收`
    const images = extractMessageImages(text)
    const display = queryDisplayContent(text, images)
    expect(display).toContain(queryFormatMarkdownImage('cat_sunlight.png', APP_SUPPORT_PNG))
    expect(display).not.toMatch(/图片路径/)
    expect(display).not.toContain(APP_SUPPORT_MP4)
    expect(display).toContain('请查收')
  })

  it('表格行把路径嵌进预览列，路径列仅保留短文件名', () => {
    const text = [
      '### 热点①',
      '| 预览 | 文件路径 |',
      '| --- | --- |',
      `| 图1 | \`${APP_SUPPORT_PNG}\` ← 搜狐新闻源 |`,
      `| 图2 | \`${APP_SUPPORT_PNG_2}\` ← 新浪新闻源 |`
    ].join('\n')
    const images = extractMessageImages(text)
    expect(images).toHaveLength(2)

    const embedded = queryEmbedImagesInDisplayText(text, images)
    expect(embedded).toContain(
      `| ${queryFormatMarkdownImage('图1', APP_SUPPORT_PNG)} | \`cat_sunlight.png\` ← 搜狐新闻源 |`
    )
    expect(embedded).toContain(
      `| ${queryFormatMarkdownImage('图2', APP_SUPPORT_PNG_2)} | \`dog.png\` ← 新浪新闻源 |`
    )
    expect(embedded).not.toMatch(/\| 图1 \|/)
    expect(queryInlinedImageSrcs(embedded).has(APP_SUPPORT_PNG)).toBe(true)
  })

  it('配图预览仅有「图N」标签时，按序号预判填入上下文本地路径', () => {
    const text = [
      '### 配图预览',
      '| 图片 | 内容 |',
      '| --- | --- |',
      '| 图1 | 新华社来源标识 |',
      '| 图2-3 | 齐达内个人照/发布会场景 |'
    ].join('\n')
    const contextRefs = extractMessageImages(
      `${APP_SUPPORT_PNG}\n${APP_SUPPORT_PNG_2}\n/Users/wly/tmp/third.png`
    )
    expect(contextRefs).toHaveLength(3)

    const embedded = queryEmbedImagesInDisplayText(text, contextRefs)
    expect(embedded).toContain(
      `| ${queryFormatMarkdownImage('图1', APP_SUPPORT_PNG)} | 新华社来源标识 |`
    )
    expect(embedded).toContain(
      `| ${queryFormatMarkdownImage('图2', APP_SUPPORT_PNG_2)} ${queryFormatMarkdownImage('图3', '/Users/wly/tmp/third.png')} | 齐达内个人照/发布会场景 |`
    )
    expect(embedded).not.toMatch(/\| 图1 \|/)
  })

  it('旧消息无尖括号 markdown 会被升级为可解析形式', () => {
    const text = `已从网页保存 1 张配图到本地：\n1. ![image-1.jpg](${APP_SUPPORT_PNG})\n   ← https://cdn.example.com/a.jpg`
    const images = extractMessageImages(text)
    const embedded = queryEmbedImagesInDisplayText(text, images)
    expect(embedded).toContain(queryFormatMarkdownImage('image-1.jpg', APP_SUPPORT_PNG))
    expect(embedded).not.toContain(`![image-1.jpg](${APP_SUPPORT_PNG})`)
  })

  it('解析图号标签索引', async () => {
    const { queryParseFigureLabelIndexes } = await import(
      '../src/features/chat/utils/message-images'
    )
    expect(queryParseFigureLabelIndexes('图1')).toEqual([1])
    expect(queryParseFigureLabelIndexes('图2-3')).toEqual([2, 3])
    expect(queryParseFigureLabelIndexes('图4～6')).toEqual([4, 5, 6])
    expect(queryParseFigureLabelIndexes('内容')).toEqual([])
  })

  it('从会话工具结果与 imagePaths 参数收集本地图路径', async () => {
    const {
      queryCollectSessionImagePaths,
      queryImagePathsFromToolArgs
    } = await import('../src/features/chat/utils/query-session-image-paths')
    expect(
      queryImagePathsFromToolArgs({
        imagePaths: [APP_SUPPORT_PNG, '配图路径', APP_SUPPORT_PNG_2]
      })
    ).toEqual([APP_SUPPORT_PNG, APP_SUPPORT_PNG_2])

    const paths = queryCollectSessionImagePaths([
      {
        id: 't1',
        role: 'tool',
        content: `已保存：\n${APP_SUPPORT_PNG}`,
        createdAt: 1
      },
      {
        id: 'a1',
        role: 'assistant',
        content: '准备发布',
        createdAt: 2,
        toolCalls: [
          {
            id: 'c1',
            name: 'douyin_publish_note',
            args: { imagePaths: [APP_SUPPORT_PNG_2] }
          }
        ]
      },
      {
        id: 'a2',
        role: 'assistant',
        content: '### 配图预览\n| 图1 | x |',
        createdAt: 3
      }
    ] as never, { beforeMessageId: 'a2' })
    expect(paths).toEqual([APP_SUPPORT_PNG, APP_SUPPORT_PNG_2])
  })

  it('不把 https://cdn/a.jpg 误判为本地 //cdn/a.jpg', () => {
    const text = `配图\n1. ${APP_SUPPORT_PNG}\n   ← https://cdn.example.com/a.jpg`
    const images = extractMessageImages(text)
    expect(images.map((i) => i.src)).toEqual([APP_SUPPORT_PNG])
    expect(images.every((i) => i.kind === 'local')).toBe(true)
  })

  it('解码 workflow_ctx 后仍能提取本地图与音频', () => {
    const inner =
      `—— 媒体资源 ——\n1. [image]\n   本地路径：![x](${APP_SUPPORT_PNG})\n` +
      `2. [audio]\n   本地路径：${APP_SUPPORT_MP4.replace('.mp4', '.mp3')}`
    const audioPath = APP_SUPPORT_MP4.replace('.mp4', '.mp3')
    const wrapped = `@@workflow_ctx@@${JSON.stringify({ message: inner, patch: {} })}`
    const images = extractMessageImages(wrapped)
    const { audio } = extractMessageMedia(wrapped)
    expect(images.map((i) => i.src)).toEqual([APP_SUPPORT_PNG])
    expect(audio.map((a) => a.src)).toEqual([audioPath])
  })

  it('含本地落盘文件时 queryToolResultHasLocalFiles 为 true', async () => {
    const { queryToolResultHasLocalFiles } = await import(
      '../src/features/chat/components/MessageRichContent/MessageRichContent'
    )
    expect(
      queryToolResultHasLocalFiles(
        `已从网页保存 1 张配图：\n1. ${queryFormatMarkdownImage('a.jpg', APP_SUPPORT_PNG)}`
      )
    ).toBe(true)
    expect(queryToolResultHasLocalFiles(`成片路径：${APP_SUPPORT_MP4}`)).toBe(true)
    expect(queryToolResultHasLocalFiles('仅文字，无本地文件')).toBe(false)
  })
})
