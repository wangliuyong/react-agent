import { describe, expect, it } from 'vitest'
import {
  queryAttachmentBasename,
  queryAttachmentExt,
  queryAttachmentKind
} from '../src/features/chat/utils/queryAttachmentKind'

describe('queryAttachmentKind', () => {
  it('按扩展名识别图片 / 视频 / 音频', () => {
    expect(queryAttachmentKind('/tmp/a.png')).toBe('image')
    expect(queryAttachmentKind('/tmp/b.JPEG')).toBe('image')
    expect(queryAttachmentKind('/tmp/c.mp4')).toBe('video')
    expect(queryAttachmentKind('/tmp/d.webm')).toBe('video')
    expect(queryAttachmentKind('/tmp/e.mp3')).toBe('audio')
    expect(queryAttachmentKind('/tmp/f.m4a')).toBe('audio')
  })

  it('无媒体后缀或显式 hint 视为文件夹', () => {
    expect(queryAttachmentKind('/Users/me/Desktop/assets')).toBe('folder')
    expect(queryAttachmentKind('/tmp/cover.png', 'folder')).toBe('folder')
  })

  it('兼容 Windows 路径分隔符', () => {
    expect(queryAttachmentBasename('C:\\Users\\me\\pic.webp')).toBe('pic.webp')
    expect(queryAttachmentExt('C:\\Users\\me\\clip.MOV')).toBe('.mov')
    expect(queryAttachmentKind('C:\\Users\\me\\clip.MOV')).toBe('video')
  })
})
