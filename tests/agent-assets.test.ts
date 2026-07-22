import { describe, expect, it } from 'vitest'
import {
  AGENT_ASSET_KIND_LABELS,
  queryAgentAssetKind,
  queryFormatAssetSize
} from '../shared/agent-assets'

describe('queryAgentAssetKind', () => {
  it('识别图片扩展名', () => {
    expect(queryAgentAssetKind('cover.png')).toBe('image')
    expect(queryAgentAssetKind('photo.JPEG')).toBe('image')
  })

  it('识别视频与音频', () => {
    expect(queryAgentAssetKind('final.mp4')).toBe('video')
    expect(queryAgentAssetKind('narration.wav')).toBe('audio')
  })

  it('识别 HTML 与文档', () => {
    expect(queryAgentAssetKind('report.html')).toBe('html')
    expect(queryAgentAssetKind('script.md')).toBe('document')
    expect(queryAgentAssetKind('storyboard.json')).toBe('document')
  })

  it('未知扩展名归为 other', () => {
    expect(queryAgentAssetKind('archive.zip')).toBe('other')
    expect(queryAgentAssetKind('noext')).toBe('other')
  })
})

describe('queryFormatAssetSize', () => {
  it('格式化常见单位', () => {
    expect(queryFormatAssetSize(512)).toBe('512 B')
    expect(queryFormatAssetSize(2048)).toBe('2.0 KB')
    expect(queryFormatAssetSize(5 * 1024 * 1024)).toBe('5.0 MB')
  })
})

describe('AGENT_ASSET_KIND_LABELS', () => {
  it('包含全部类别文案', () => {
    expect(AGENT_ASSET_KIND_LABELS.image).toBe('图片')
    expect(AGENT_ASSET_KIND_LABELS.document).toBe('文档')
  })
})
