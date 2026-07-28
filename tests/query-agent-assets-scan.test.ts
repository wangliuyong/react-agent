/**
 * 资产扫描应跳过工程噪音（node_modules / remotion 源码），只暴露用户产出文件。
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const testState = vi.hoisted(() => ({
  artifactsDir: '',
  videosDir: ''
}))

vi.mock('../electron/main/store/paths', () => ({
  getArtifactsDir: (): string => testState.artifactsDir,
  getVideosDir: (): string => testState.videosDir
}))

describe('queryAgentAssets 扫描过滤', () => {
  let root = ''

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'agent-assets-scan-'))
    testState.artifactsDir = join(root, 'artifacts')
    testState.videosDir = join(root, 'videos')
    mkdirSync(testState.artifactsDir, { recursive: true })
    mkdirSync(testState.videosDir, { recursive: true })
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  it('收录 artifacts 与 scenes 产出，跳过 node_modules 与缓存', async () => {
    writeFileSync(join(testState.artifactsDir, 'report.html'), '<html></html>')
    const sceneDir = join(testState.videosDir, 'scenes', 's1')
    mkdirSync(sceneDir, { recursive: true })
    writeFileSync(join(sceneDir, 'frame.png'), 'png')

    const junkDir = join(testState.artifactsDir, 'node_modules', 'pkg')
    mkdirSync(junkDir, { recursive: true })
    writeFileSync(join(junkDir, 'index.js'), 'module.exports = {}')

    const cacheDir = join(testState.artifactsDir, '.cache')
    mkdirSync(cacheDir, { recursive: true })
    writeFileSync(join(cacheDir, 'blob.bin'), 'x')

    const { queryAgentAssets } = await import('../electron/main/store/assets')
    const list = queryAgentAssets()
    const names = list.map((item) => item.name).sort()
    expect(names).toEqual(['frame.png', 'report.html'])
  })

  it('remotion 工程只收录 out/ 成片，不扫 src 与 webpack 缓存', async () => {
    const session = join(testState.videosDir, 'remotion', 'session-a')
    const srcDir = join(session, 'src')
    const outDir = join(session, 'out')
    const cacheDir = join(session, 'node_modules', '.cache', 'webpack')
    mkdirSync(srcDir, { recursive: true })
    mkdirSync(outDir, { recursive: true })
    mkdirSync(cacheDir, { recursive: true })
    writeFileSync(join(srcDir, 'Root.tsx'), 'export {}')
    writeFileSync(join(session, 'package.json'), '{}')
    writeFileSync(join(cacheDir, 'index.pack'), 'pack')
    writeFileSync(join(outDir, 'final.mp4'), 'mp4')

    const { queryAgentAssets } = await import('../electron/main/store/assets')
    const list = queryAgentAssets()
    expect(list).toHaveLength(1)
    expect(list[0]?.name).toBe('final.mp4')
    expect(list[0]?.kind).toBe('video')
  })
})
