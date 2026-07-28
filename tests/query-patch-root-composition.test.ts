import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { queryPatchRootCompositionSource } from '../electron/main/media/query-patch-root-composition'

const starterRoot = readFileSync(
  new URL('../resources/remotion/starter/src/Root.tsx', import.meta.url),
  'utf8'
)

describe('queryPatchRootCompositionSource', () => {
  it('导出 HotNews 时只更新 HotNews 块，不把 Main 改成 HotNews', () => {
    const next = queryPatchRootCompositionSource(starterRoot, {
      compositionId: 'HotNews',
      width: 1920,
      height: 1080,
      fps: 30,
      durationInFrames: 1200
    })

    const ids = [...next.matchAll(/id="([^"]+)"/g)].map((m) => m[1])
    expect(ids.filter((id) => id === 'HotNews')).toHaveLength(1)
    expect(ids).toContain('Main')
    expect(ids).toContain('HotNewsVertical')

    const hotNewsBlock = next.match(/<Composition\b[\s\S]*?id="HotNews"[\s\S]*?\/>/)?.[0]
    expect(hotNewsBlock).toContain('durationInFrames={1200}')
    expect(hotNewsBlock).toContain('width={1920}')
    expect(hotNewsBlock).toContain('height={1080}')

    const mainBlock = next.match(/<Composition\b[\s\S]*?id="Main"[\s\S]*?\/>/)?.[0]
    expect(mainBlock).toContain('durationInFrames={300}')
  })

  it('目标 id 不存在时，才把第一块 Composition 改名为该 id', () => {
    const single = `
export const RemotionRoot = () => (
  <>
    <Composition
      id="Main"
      component={MyComposition}
      durationInFrames={150}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
)
`
    const next = queryPatchRootCompositionSource(single, {
      compositionId: 'CustomShow',
      width: 1080,
      height: 1920,
      fps: 24,
      durationInFrames: 240
    })
    expect(next).toContain('id="CustomShow"')
    expect(next).not.toContain('id="Main"')
    expect(next).toContain('durationInFrames={240}')
    expect(next).toContain('width={1080}')
    expect(next).toContain('height={1920}')
    expect(next).toContain('fps={24}')
  })

  it('旧 bug 复现样本：全局替换第一个 id 会导致两个 HotNews', () => {
    /** 对照：说明为何不能再用 .replace(/id="[^"]*"/, ...) */
    const buggy = starterRoot.replace(/id="[^"]*"/, 'id="HotNews"')
    const hotNewsCount = [...buggy.matchAll(/id="HotNews"/g)].length
    expect(hotNewsCount).toBe(2)
  })
})
