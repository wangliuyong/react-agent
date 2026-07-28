import { describe, expect, it } from 'vitest'
import {
  extractMessageImages,
  queryEmbedImagesInDisplayText,
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
    expect(display).toContain(`![cat_sunlight.png](${APP_SUPPORT_PNG})`)
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
    expect(embedded).toContain(`| ![图1](${APP_SUPPORT_PNG}) | \`cat_sunlight.png\` ← 搜狐新闻源 |`)
    expect(embedded).toContain(`| ![图2](${APP_SUPPORT_PNG_2}) | \`dog.png\` ← 新浪新闻源 |`)
    expect(embedded).not.toMatch(/\| 图1 \|/)
    expect(queryInlinedImageSrcs(embedded).has(APP_SUPPORT_PNG)).toBe(true)
  })
})
