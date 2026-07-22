import { describe, expect, it } from 'vitest'
import { extractMessageHtml } from '../src/features/chat/utils/message-html'

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
