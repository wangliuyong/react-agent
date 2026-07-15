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
})
