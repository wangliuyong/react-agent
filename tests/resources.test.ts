import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const testState = vi.hoisted(() => ({
  appPath: '',
  dataRoot: '',
  isPackaged: false
}))

vi.mock('electron', () => ({
  app: {
    get isPackaged(): boolean {
      return testState.isPackaged
    },
    getAppPath: (): string => testState.appPath
  }
}))

vi.mock('../electron/main/store/paths', () => ({
  getDataRoot: (): string => testState.dataRoot
}))

describe('resources store', () => {
  let root: string

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'react-agent-resources-'))
    testState.appPath = join(root, 'app')
    testState.dataRoot = join(root, 'user-data')
    testState.isPackaged = false
    mkdirSync(testState.appPath, { recursive: true })
    mkdirSync(testState.dataRoot, { recursive: true })
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
    vi.resetModules()
  })

  it('开发环境直接读写项目 resources 目录', async () => {
    const { queryRulesDir, querySkillsDir, queryWritableResourcesRoot } = await import(
      '../electron/main/store/resources'
    )

    expect(queryWritableResourcesRoot()).toBe(join(testState.appPath, 'resources'))
    expect(querySkillsDir()).toBe(join(testState.appPath, 'resources', 'skills'))
    expect(queryRulesDir()).toBe(join(testState.appPath, 'resources', 'rules'))
  })

  it('打包环境使用 userData 副本且初始化不覆盖用户文件', async () => {
    testState.isPackaged = true
    const bundledRoot = join(root, 'resources')
    Object.defineProperty(process, 'resourcesPath', {
      configurable: true,
      value: root
    })
    mkdirSync(join(bundledRoot, 'skills', 'demo'), { recursive: true })
    mkdirSync(join(bundledRoot, 'rules'), { recursive: true })
    writeFileSync(join(bundledRoot, 'skills', 'demo', 'SKILL.md'), 'bundled', 'utf-8')
    writeFileSync(join(bundledRoot, 'rules', 'demo.mdc'), 'bundled', 'utf-8')

    const { initializeResources, queryRulesDir, querySkillsDir } = await import(
      '../electron/main/store/resources'
    )
    initializeResources()

    const writableSkill = join(querySkillsDir(), 'demo', 'SKILL.md')
    const writableRule = join(queryRulesDir(), 'demo.mdc')
    expect(readFileSync(writableSkill, 'utf-8')).toBe('bundled')
    expect(readFileSync(writableRule, 'utf-8')).toBe('bundled')

    writeFileSync(writableSkill, 'user edited', 'utf-8')
    initializeResources()

    expect(readFileSync(writableSkill, 'utf-8')).toBe('user edited')
  })

  it('将旧 rules.json 迁移为 MDC 且不覆盖已有规则', async () => {
    const rulesDir = join(testState.appPath, 'resources', 'rules')
    mkdirSync(rulesDir, { recursive: true })
    writeFileSync(
      join(rulesDir, 'existing.mdc'),
      '---\nalwaysApply: true\n---\n\n用户已有内容\n',
      'utf-8'
    )
    writeFileSync(
      join(testState.dataRoot, 'rules.json'),
      JSON.stringify([
        {
          id: 'legacy-rule',
          name: '旧规则',
          description: '来自 JSON',
          content: '旧规则正文',
          enabled: true,
          createdAt: 10,
          updatedAt: 20
        },
        {
          id: 'existing',
          name: '不应覆盖',
          description: '',
          content: '覆盖内容',
          enabled: false,
          createdAt: 10,
          updatedAt: 20
        }
      ]),
      'utf-8'
    )

    const { initializeResources } = await import('../electron/main/store/resources')
    initializeResources()

    expect(readFileSync(join(rulesDir, 'legacy-rule.mdc'), 'utf-8')).toContain('旧规则正文')
    expect(readFileSync(join(rulesDir, 'existing.mdc'), 'utf-8')).toContain('用户已有内容')
    expect(readFileSync(join(testState.dataRoot, 'rules.json'), 'utf-8')).toContain('legacy-rule')
  })
})
