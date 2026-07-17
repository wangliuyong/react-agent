import { describe, expect, it } from 'vitest'
import {
  extractMessageMedia,
  queryDecodeWorkflowCtxMessage,
  stripMediaPathsFromDisplayText
} from '../src/features/chat/utils/message-media'

describe('message-media', () => {
  it('从正文提取本地音频与视频路径', () => {
    const text =
      '旁白已生成：/tmp/scenes/shot-1.wav\n' +
      '成片：/Users/wly/Desktop/react-agent-data/videos/projects/s1/final-1.mp4'
    const { audio, video } = extractMessageMedia(text)
    expect(audio).toHaveLength(1)
    expect(audio[0].src).toBe('/tmp/scenes/shot-1.wav')
    expect(video).toHaveLength(1)
    expect(video[0].src).toContain('final-1.mp4')
  })

  it('解码 workflow_ctx 前缀后再提取路径', () => {
    const inner =
      '素材：/tmp/scenes/shot-2.mp4\n旁白：/tmp/scenes/shot-2.wav'
    const wrapped = `@@workflow_ctx@@${JSON.stringify({ message: inner, patch: {} })}`
    expect(queryDecodeWorkflowCtxMessage(wrapped)).toBe(inner)
    const { video, audio } = extractMessageMedia(wrapped)
    expect(video[0].src).toBe('/tmp/scenes/shot-2.mp4')
    expect(audio[0].src).toBe('/tmp/scenes/shot-2.wav')
  })

  it('strip 后隐藏裸路径', () => {
    const text = '处理完成\n/tmp/a.wav'
    const { audio } = extractMessageMedia(text)
    expect(stripMediaPathsFromDisplayText(text, audio, [])).toBe('处理完成')
  })
})
