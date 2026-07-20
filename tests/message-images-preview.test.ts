import { describe, expect, it } from 'vitest'
import {
  extractMessageImages,
  stripImagePathsFromDisplayText
} from '../src/features/chat/utils/message-images'
import {
  extractMessageMedia,
  queryDisplayContent
} from '../src/features/chat/utils/message-media'

const APP_SUPPORT_PNG =
  '/Users/wly/Library/Application Support/lingxi/react-agent-data/videos/scenes/s1/cat_sunlight.png'
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

  it('queryDisplayContent 去掉图/视频路径后保留说明文字', () => {
    const text =
      `已生成\n图片路径：${APP_SUPPORT_PNG}\n视频：${APP_SUPPORT_MP4}\n请查收`
    const images = extractMessageImages(text)
    const display = queryDisplayContent(text, images)
    expect(display).not.toContain('.png')
    expect(display).not.toContain('.mp4')
    expect(display).toContain('请查收')
  })
})
