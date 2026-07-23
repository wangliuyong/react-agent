import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const testState = vi.hoisted(() => ({
  dataRoot: '',
  skillsDir: '',
  bundledRoot: ''
}))

vi.mock('../electron/main/store/paths', () => ({
  getDataRoot: (): string => testState.dataRoot
}))

vi.mock('../electron/main/store/resources', () => ({
  queryBundledResourcesRoot: (): string => testState.bundledRoot,
  querySkillsDir: (): string => testState.skillsDir
}))

describe('skills store', () => {
  let root: string

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'react-agent-skills-'))
    testState.dataRoot = join(root, 'data')
    testState.skillsDir = join(root, 'resources', 'skills')
    testState.bundledRoot = join(root, 'bundled')
    mkdirSync(testState.dataRoot, { recursive: true })
    mkdirSync(testState.skillsDir, { recursive: true })
    mkdirSync(join(testState.bundledRoot, 'skills'), { recursive: true })
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
    vi.resetModules()
  })

  it('从 resources/skills 创建、查询并删除技能', async () => {
    const { getSkillsDir, postDeleteProjectSkill, postProjectSkill, queryProjectSkills } =
      await import('../electron/main/store/skills')

    expect(getSkillsDir()).toBe(testState.skillsDir)

    postProjectSkill({
      id: 'demo-skill',
      name: '演示技能',
      description: '用于验证统一资源目录',
      content: '# 使用方式\n\n执行演示'
    })

    expect(queryProjectSkills()).toEqual([
      expect.objectContaining({
        id: 'demo-skill',
        name: '演示技能'
      })
    ])
    expect(readFileSync(join(testState.skillsDir, 'demo-skill', 'SKILL.md'), 'utf-8')).toContain(
      'name: 演示技能'
    )

    postDeleteProjectSkill('demo-skill')
    expect(existsSync(join(testState.skillsDir, 'demo-skill'))).toBe(false)
  })

  it('技能市场从内置 resources/skills 读取模板', async () => {
    const templateDir = join(testState.bundledRoot, 'skills', 'builtin-demo')
    mkdirSync(templateDir, { recursive: true })
    writeFileSync(
      join(templateDir, 'SKILL.md'),
      '---\nname: 内置演示\ndescription: 内置资源\n---\n\n# 正文\n',
      'utf-8'
    )

    const { querySkillTemplates } = await import('../electron/main/store/skills')

    expect(querySkillTemplates()).toEqual([
      {
        id: 'builtin-demo',
        name: '内置演示',
        description: '内置资源'
      }
    ])
  })

  it('提示词只暴露已启用技能目录，正文仅在显式使用技能时读取', async () => {
    const {
      postProjectSkill,
      postSkillStates,
      queryEnabledSkillContent,
      queryEnabledSkillPrompt
    } = await import('../electron/main/store/skills')

    postProjectSkill({
      id: 'writing-guide',
      name: '写作指南',
      description: '在撰写营销文案时使用',
      content: '# 私有正文\n\n先提炼卖点，再组织文案。',
      examplesContent: '# 示例\n\n一条示例文案'
    })
    postProjectSkill({
      id: 'disabled-guide',
      name: '停用指南',
      description: '不应提供给 Agent',
      content: '# 停用正文'
    })
    postSkillStates({ 'disabled-guide': { enabled: false } })

    const prompt = queryEnabledSkillPrompt()

    expect(prompt).toContain('writing-guide')
    expect(prompt).toContain('在撰写营销文案时使用')
    expect(prompt).not.toContain('先提炼卖点')
    expect(prompt).not.toContain('disabled-guide')
    expect(queryEnabledSkillContent('writing-guide')).toContain('先提炼卖点')
    expect(queryEnabledSkillContent('writing-guide')).toContain('一条示例文案')
    expect(queryEnabledSkillContent('disabled-guide')).toBeNull()
  })

  it('启动时安装缺失的 Remotion 技能并默认启用（不覆盖手动禁用）', async () => {
    const remotionIds = [
      'react-agent-remotion',
      'remotion-best-practices',
      'remotion-create',
      'remotion-markup',
      'remotion-render',
      'remotion-captions'
    ]
    for (const id of remotionIds) {
      mkdirSync(join(testState.bundledRoot, 'skills', id), { recursive: true })
      writeFileSync(
        join(testState.bundledRoot, 'skills', id, 'SKILL.md'),
        `---\nname: ${id}\ndescription: remotion skill\n---\n\n# ${id}\n`,
        'utf-8'
      )
    }

    const {
      postEnsureRemotionSkillsEnabled,
      postSkillStates,
      queryProjectSkills
    } = await import('../electron/main/store/skills')

    postEnsureRemotionSkillsEnabled()
    const afterInstall = queryProjectSkills()
    for (const id of remotionIds) {
      expect(afterInstall.find((s) => s.id === id)?.enabled).toBe(true)
      expect(afterInstall.find((s) => s.id === id)?.isBuiltin).toBe(true)
    }

    postSkillStates({ 'remotion-create': { enabled: false } })
    postEnsureRemotionSkillsEnabled()
    expect(queryProjectSkills().find((s) => s.id === 'remotion-create')?.enabled).toBe(false)
  })

  it('技能目录达到预算时不会截断单条技能信息', async () => {
    const { postProjectSkill, queryEnabledSkillPrompt } = await import(
      '../electron/main/store/skills'
    )
    postProjectSkill({
      id: 'alpha',
      name: 'A',
      description: 'first',
      content: 'alpha content'
    })
    postProjectSkill({
      id: 'beta',
      name: 'B',
      description: 'second',
      content: 'beta content'
    })

    const firstEntry = '- `alpha`：A — first'
    const prompt = queryEnabledSkillPrompt(firstEntry.length + 5)

    expect(prompt).toContain(firstEntry)
    expect(prompt).not.toContain('\n- `')
    expect(prompt).toContain('技能目录已截断')
  })
})
