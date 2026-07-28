import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const testState = vi.hoisted(() => ({
  dataRoot: '',
  skillsDir: '',
  bundledRoot: '',
  videosDir: ''
}))

vi.mock('../electron/main/store/paths', () => ({
  getDataRoot: (): string => testState.dataRoot,
  getVideosDir: (): string => testState.videosDir
}))

vi.mock('../electron/main/store/resources', () => ({
  queryBundledResourcesRoot: (): string => testState.bundledRoot,
  querySkillsDir: (): string => testState.skillsDir
}))

vi.mock('../electron/main/media/remotion-service', async () => {
  const actual = await vi.importActual<typeof import('../electron/main/media/remotion-service')>(
    '../electron/main/media/remotion-service'
  )
  return {
    ...actual,
    postStartRemotionStudio: vi.fn(async () => ({
      ok: true,
      url: 'http://localhost:3000',
      message: 'studio'
    })),
    postInitRemotionProject: vi.fn((sessionId: string, config: { compositionId?: string }) => {
      const projectDir = join(testState.videosDir, 'remotion', sessionId)
      mkdirSync(join(projectDir, 'src'), { recursive: true })
      writeFileSync(
        join(projectDir, 'src', 'Root.tsx'),
        'export const RemotionRoot = () => null\n',
        'utf-8'
      )
      writeFileSync(join(projectDir, 'src', 'index.ts'), 'import { RemotionRoot } from "./Root"\n', 'utf-8')
      writeFileSync(join(projectDir, 'src', 'Composition.tsx'), 'export const MyComposition = () => null\n', 'utf-8')
      writeFileSync(join(projectDir, '.remotion-initialized'), new Date().toISOString(), 'utf-8')
      return {
        projectDir,
        created: true,
        compositionId: config.compositionId ?? 'Main',
        entryPoint: join(projectDir, 'src', 'index.ts')
      }
    })
  }
})

describe('postApplyRemotionTemplateSkill', () => {
  let root: string

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'remotion-apply-'))
    testState.dataRoot = join(root, 'data')
    testState.skillsDir = join(root, 'writable-skills')
    testState.bundledRoot = join(root, 'bundled')
    testState.videosDir = join(root, 'videos')
    mkdirSync(testState.dataRoot, { recursive: true })
    mkdirSync(testState.skillsDir, { recursive: true })
    mkdirSync(testState.videosDir, { recursive: true })

    const skillTemplate = join(
      testState.bundledRoot,
      'skills',
      'remotion-template-hot-news',
      'template'
    )
    mkdirSync(join(skillTemplate, 'compositions', 'hot-news'), { recursive: true })
    writeFileSync(
      join(testState.bundledRoot, 'skills', 'remotion-template-hot-news', 'SKILL.md'),
      '---\nname: 热点\ndescription: t\nremotionVideoTemplate: true\n---\n\n# x\n',
      'utf-8'
    )
    writeFileSync(
      join(skillTemplate, 'manifest.json'),
      JSON.stringify({
        compositions: [
          {
            id: 'HotNews',
            componentPath: './compositions/hot-news',
            componentExport: 'HotNewsComposition',
            defaultPropsPath: './compositions/hot-news/default-props',
            defaultPropsExport: 'HOT_NEWS_WIDE_DEFAULT_PROPS',
            width: 1920,
            height: 1080,
            fps: 30,
            durationInFrames: 600
          },
          {
            id: 'HotNewsVertical',
            componentPath: './compositions/hot-news',
            componentExport: 'HotNewsComposition',
            defaultPropsPath: './compositions/hot-news/default-props',
            defaultPropsExport: 'HOT_NEWS_VERTICAL_DEFAULT_PROPS',
            width: 1080,
            height: 1920,
            fps: 30,
            durationInFrames: 450
          }
        ],
        propsFile: 'compositions/hot-news/default-props.ts',
        propsKind: 'hot-news'
      }),
      'utf-8'
    )
    writeFileSync(
      join(skillTemplate, 'compositions', 'hot-news', 'index.ts'),
      'export const HotNewsComposition = () => null\n',
      'utf-8'
    )
    writeFileSync(
      join(skillTemplate, 'compositions', 'hot-news', 'types.ts'),
      'export type HotNewsProps = Record<string, unknown>\n',
      'utf-8'
    )
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
    vi.resetModules()
  })

  it('拷贝 template、写入 props，并生成含 compositionId 的 Root', async () => {
    const { postApplyRemotionTemplateSkill } = await import(
      '../electron/main/media/remotion-apply-template-skill'
    )

    const result = await postApplyRemotionTemplateSkill({
      sessionId: 'sess-1',
      skillId: 'remotion-template-hot-news',
      compositionId: 'HotNews',
      props: { headline: '测试标题', items: [] },
      openStudio: true
    })

    expect(result.ok).toBe(true)
    expect(result.compositionId).toBe('HotNews')
    expect(result.studioUrl).toBe('http://localhost:3000')
    expect(result.projectDir).toBeTruthy()

    const projectSrc = join(result.projectDir!, 'src')
    expect(existsSync(join(projectSrc, 'compositions', 'hot-news', 'index.ts'))).toBe(true)
    const props = readFileSync(
      join(projectSrc, 'compositions', 'hot-news', 'default-props.ts'),
      'utf-8'
    )
    expect(props).toContain('测试标题')
    const rootSource = readFileSync(join(projectSrc, 'Root.tsx'), 'utf-8')
    expect(rootSource).toContain('id="HotNews"')
    expect(rootSource).toContain('HotNewsComposition')
    // 预览侧栏只应有当前焦点 Composition，不含 starter Main 与其它画幅变体
    expect(rootSource).not.toContain('id="Main"')
    expect(rootSource).not.toContain('id="HotNewsVertical"')
    expect(rootSource).not.toContain('MyComposition')
  })

  it('焦点为竖版时 Root 仅注册 HotNewsVertical', async () => {
    const { postApplyRemotionTemplateSkill } = await import(
      '../electron/main/media/remotion-apply-template-skill'
    )

    const result = await postApplyRemotionTemplateSkill({
      sessionId: 'sess-vertical',
      skillId: 'remotion-template-hot-news',
      compositionId: 'HotNewsVertical',
      width: 1080,
      height: 1920,
      openStudio: false
    })

    expect(result.ok).toBe(true)
    expect(result.compositionId).toBe('HotNewsVertical')
    const rootSource = readFileSync(join(result.projectDir!, 'src', 'Root.tsx'), 'utf-8')
    expect(rootSource).toContain('id="HotNewsVertical"')
    expect(rootSource).not.toContain('id="HotNews"')
    expect(rootSource).not.toContain('id="Main"')
  })
})
