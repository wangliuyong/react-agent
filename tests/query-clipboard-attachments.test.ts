import { describe, expect, it } from 'vitest'
import {
  queryClipboardAttachments,
  queryIsAllowedChatMedia,
  type ClipboardFileLike
} from '../src/features/chat/utils/queryClipboardAttachments'

function mockFile( partial: {
  name?: string
  type?: string
  size?: number
  path?: string
}): ClipboardFileLike {
  const file = {
    name: partial.name ?? '',
    type: partial.type ?? '',
    size: partial.size ?? 10,
    path: partial.path
  } as ClipboardFileLike
  return file
}

function mockDataTransfer(opts: {
  files?: ClipboardFileLike[]
  items?: Array<{ kind: string; getAsFile: () => ClipboardFileLike | null }>
}): DataTransfer {
  return {
    files: opts.files ?? [],
    items: opts.items ?? []
  } as unknown as DataTransfer
}

describe('queryIsAllowedChatMedia', () => {
  it('按扩展名与 mime 识别允许的媒体', () => {
    expect(queryIsAllowedChatMedia('a.png')).toBe(true)
    expect(queryIsAllowedChatMedia('b.MP4')).toBe(true)
    expect(queryIsAllowedChatMedia('c.mp3')).toBe(true)
    expect(queryIsAllowedChatMedia('note.txt')).toBe(false)
    expect(queryIsAllowedChatMedia('paste', 'image/png')).toBe(true)
    expect(queryIsAllowedChatMedia('x', 'application/pdf')).toBe(false)
  })
})

describe('queryClipboardAttachments', () => {
  it('空 DataTransfer 返回空列表', () => {
    expect(queryClipboardAttachments(null)).toEqual({ items: [], skipped: 0 })
    expect(queryClipboardAttachments(undefined)).toEqual({ items: [], skipped: 0 })
  })

  it('Electron File.path 解析为 localPath', () => {
    const dt = mockDataTransfer({
      files: [mockFile({ name: 'shot.png', path: '/tmp/shot.png', type: 'image/png' })]
    })
    const result = queryClipboardAttachments(dt)
    expect(result.skipped).toBe(0)
    expect(result.items).toEqual([{ kind: 'localPath', path: '/tmp/shot.png' }])
  })

  it('无 path 的截图 blob 标记为需上传', () => {
    const blob = mockFile({ name: 'image.png', type: 'image/png', size: 100 })
    const dt = mockDataTransfer({ files: [blob] })
    const result = queryClipboardAttachments(dt)
    expect(result.items).toHaveLength(1)
    expect(result.items[0]).toMatchObject({
      kind: 'blob',
      name: 'image.png',
      mimeType: 'image/png'
    })
  })

  it('过滤不支持的类型', () => {
    const dt = mockDataTransfer({
      files: [
        mockFile({ name: 'a.pdf', type: 'application/pdf' }),
        mockFile({ name: 'ok.webp', path: '/tmp/ok.webp' })
      ]
    })
    const result = queryClipboardAttachments(dt)
    expect(result.skipped).toBe(1)
    expect(result.items).toEqual([{ kind: 'localPath', path: '/tmp/ok.webp' }])
  })

  it('files 为空时回退 items（系统截图）', () => {
    const blob = mockFile({ name: '', type: 'image/png', size: 50 })
    const dt = mockDataTransfer({
      files: [],
      items: [{ kind: 'file', getAsFile: () => blob }]
    })
    const result = queryClipboardAttachments(dt)
    expect(result.items).toHaveLength(1)
    expect(result.items[0].kind).toBe('blob')
    if (result.items[0].kind === 'blob') {
      expect(result.items[0].name).toMatch(/paste-1\.png/)
    }
  })
})
