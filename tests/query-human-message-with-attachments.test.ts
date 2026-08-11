import { describe, expect, it, vi } from 'vitest'
import {
  queryAttachmentPathsText,
  queryEnrichContentWithLocalOcr,
  queryStripAttachmentFooter
} from '../electron/main/agent/query-human-message-with-attachments'

vi.mock('../electron/main/ocr/local-ocr', () => ({
  queryLocalOcrBlocksForAttachments: vi.fn(async (paths: string[]) =>
    paths.map((p) => `[本机识字 · ${p.split('/').pop()}]\nmocked-ocr-text`)
  )
}))

describe('queryAttachmentPathsText / queryStripAttachmentFooter', () => {
  it('拼接与剥离附件落盘文案', () => {
    const withFooter = queryAttachmentPathsText('你好', ['/a.png', '/b.mp4'])
    expect(withFooter).toContain('你好')
    expect(withFooter).toContain('[附件]')
    expect(withFooter).toContain('/a.png')
    expect(queryStripAttachmentFooter(withFooter)).toBe('你好')
    expect(queryStripAttachmentFooter('[附件]\n/x.png')).toBe('')
  })
})

describe('queryEnrichContentWithLocalOcr', () => {
  it('无附件返回原文', async () => {
    expect(await queryEnrichContentWithLocalOcr('hello')).toBe('hello')
  })

  it('图片附件注入本机识字文本，不含 image_url', async () => {
    const content = await queryEnrichContentWithLocalOcr('请识别', ['/tmp/a.png'])
    expect(typeof content).toBe('string')
    expect(content).toContain('请识别')
    expect(content).toContain('[本机识字 · a.png]')
    expect(content).toContain('mocked-ocr-text')
    expect(content).toContain('[附件]')
    expect(content).toContain('/tmp/a.png')
    expect(content).not.toContain('image_url')
    expect(content).toContain('本机系统识别')
  })

  it('非图片附件不跑 OCR，仅列路径', async () => {
    const content = await queryEnrichContentWithLocalOcr('看这个', ['/tmp/clip.mp4'])
    expect(content).toContain('[附件]')
    expect(content).toContain('/tmp/clip.mp4')
    expect(content).not.toContain('[本机识字')
  })
})
