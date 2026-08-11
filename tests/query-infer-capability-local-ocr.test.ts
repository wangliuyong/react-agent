import { describe, expect, it } from 'vitest'
import { queryInferModelCapability } from '../electron/main/agent/model-router'

describe('queryInferModelCapability + 本机 OCR', () => {
  it('仅有图片附件不再自动选 vision', () => {
    expect(queryInferModelCapability('请理解附件内容', ['/tmp/a.png'])).toBe('chat')
  })

  it('显式看图/OCR 提示仍选 vision', () => {
    expect(queryInferModelCapability('请 OCR 这张图', [])).toBe('vision')
    expect(queryInferModelCapability('看图说说内容', ['/tmp/a.png'])).toBe('vision')
  })
})
