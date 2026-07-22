import { describe, expect, it } from 'vitest'
import {
  extractMessageHtml,
  stripEmptyCodeFences,
  stripOrphanedPathLabels
} from '../src/features/chat/utils/message-html'

describe('extractMessageHtml', () => {
  it('提取本地 HTML 绝对路径', () => {
    const htmlPath = '/Users/wly/Desktop/react-agent-data/artifacts/report.html'
    const text = `页面已生成：${htmlPath}`
    expect(extractMessageHtml(text)).toEqual([
      {
        key: htmlPath,
        src: htmlPath,
        label: 'report.html'
      }
    ])
  })

  it('支持含空格的 macOS Application Support 路径', () => {
    const htmlPath =
      '/Users/wly/Library/Application Support/lingxi/react-agent-data/artifacts/index.html'
    const text = `已写入: ${htmlPath}`
    expect(extractMessageHtml(text)).toEqual([
      {
        key: htmlPath,
        src: htmlPath,
        label: 'index.html'
      }
    ])
  })

  it('无 HTML 路径时返回空数组', () => {
    expect(extractMessageHtml('没有本地文件')).toEqual([])
  })
})

describe('stripEmptyCodeFences', () => {
  it('去掉路径剥离后残留的空代码块', () => {
    expect(stripEmptyCodeFences('说明如下。\n\n```html\n\n```\n\n结束')).toBe(
      '说明如下。\n\n结束'
    )
    expect(stripEmptyCodeFences('```\n```')).toBe('')
  })
})

describe('stripOrphanedPathLabels', () => {
  it('去掉路径剥离后残留的文件位置标题', () => {
    expect(stripOrphanedPathLabels('场景说明如下。\n\n文件位置\n\n你可以直接用浏览器打开。')).toBe(
      '场景说明如下。\n\n你可以直接用浏览器打开。'
    )
    expect(stripOrphanedPathLabels('文件位置：')).toBe('')
    expect(stripOrphanedPathLabels('保存至文件位置：\n\n说明')).toBe('保存至\n\n说明')
  })
})
