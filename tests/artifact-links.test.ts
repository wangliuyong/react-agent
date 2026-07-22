import { describe, expect, it } from 'vitest'
import {
  queryArtifactPaths,
  queryIsPlausibleArtifactPath
} from '../src/features/chat/utils/artifact-paths'

describe('queryIsPlausibleArtifactPath', () => {
  it('接受真实用户目录路径', () => {
    expect(
      queryIsPlausibleArtifactPath(
        '/Users/wly/Library/Application Support/lingxi/react-agent-data/artifacts/a.html'
      )
    ).toBe(true)
  })

  it('拒绝根级伪路径与三方库路径', () => {
    expect(queryIsPlausibleArtifactPath('/three.module.js')).toBe(false)
    expect(queryIsPlausibleArtifactPath('/examples/jsm/controls/OrbitControls.js')).toBe(false)
    expect(queryIsPlausibleArtifactPath('/node_modules/three/build/three.module.js')).toBe(false)
  })
})

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

  it('忽略消息中的 three.js 库引用伪路径', () => {
    const text =
      '依赖：/examples/jsm/controls/OrbitControls.js\n' +
      '以及 /three.module.js 与 /jsm/renderers/CSS2DRenderer.js\n' +
      '已写入: /Users/wly/Desktop/react-agent-data/artifacts/community.html'
    expect(queryArtifactPaths(text)).toEqual([
      '/Users/wly/Desktop/react-agent-data/artifacts/community.html'
    ])
  })

  it('无路径时返回空数组', () => {
    expect(queryArtifactPaths('没有本地文件')).toEqual([])
  })
})
