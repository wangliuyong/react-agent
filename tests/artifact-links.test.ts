import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { queryArtifactPaths } from '../src/features/chat/components/ArtifactLinks/ArtifactLinks'

const localMediaSource = readFileSync(
  new URL('../electron/main/store/local-media.ts', import.meta.url),
  'utf8'
)

describe('queryArtifactPaths', () => {
  it('提取成片、剧本与 HTML 绝对路径', () => {
    const text =
      '成片已生成：/Users/wly/Desktop/react-agent-data/videos/projects/s1/final-1.mp4\n' +
      '剧本：/tmp/script.md\n' +
      '页面：/tmp/report.html'
    expect(queryArtifactPaths(text)).toEqual([
      '/Users/wly/Desktop/react-agent-data/videos/projects/s1/final-1.mp4',
      '/tmp/script.md',
      '/tmp/report.html'
    ])
  })

  it('支持含空格的 macOS Application Support 路径', () => {
    const scriptPath =
      '/Users/wly/Library/Application Support/lingxi/react-agent-data/videos/projects/s1/script.md'
    const text = `剧本已保存：${scriptPath}`
    expect(queryArtifactPaths(text)).toEqual([scriptPath])
  })

  it('从 workflow_ctx JSON 中提取含空格路径', () => {
    const scriptPath =
      '/Users/wly/Library/Application Support/lingxi/react-agent-data/videos/projects/s1/script.md'
    const text = `@@workflow_ctx@@{"message":"剧本已保存：${scriptPath}","patch":{"scriptPath":"${scriptPath}"}}`
    expect(queryArtifactPaths(text)).toEqual([scriptPath])
  })

  it('无路径时返回空数组', () => {
    expect(queryArtifactPaths('没有本地文件')).toEqual([])
  })
})

describe('local-media 协议', () => {
  it('生成 media://local/?path= URL', () => {
    expect(localMediaSource).toContain('media://local/?path=')
    expect(localMediaSource).toContain('queryLocalMediaUrl')
    expect(localMediaSource).toContain('searchParams.get(')
  })
})
