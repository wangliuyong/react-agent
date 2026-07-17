import { describe, expect, it } from 'vitest'
import { queryArtifactPaths } from '../src/features/chat/components/ArtifactLinks/ArtifactLinks'

describe('queryArtifactPaths', () => {
  it('提取成片与剧本绝对路径', () => {
    const text =
      '成片已生成：/Users/wly/Desktop/react-agent-data/videos/projects/s1/final-1.mp4\n' +
      '剧本：/tmp/script.md'
    expect(queryArtifactPaths(text)).toEqual([
      '/Users/wly/Desktop/react-agent-data/videos/projects/s1/final-1.mp4',
      '/tmp/script.md'
    ])
  })

  it('无路径时返回空数组', () => {
    expect(queryArtifactPaths('没有本地文件')).toEqual([])
  })
})
