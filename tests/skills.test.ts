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
    const {
      getSkillsDir,
      postDeleteProjectSkill,
      postProjectSkill,
      queryProjectSkillDetail,
      queryProjectSkills
    } = await import('../electron/main/store/skills')

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

    const detail = queryProjectSkillDetail('demo-skill')
    expect(detail?.dirPath).toBe(join(testState.skillsDir, 'demo-skill'))

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

  it('Remotion 视频模版从内置 remotion-template-* 技能读取', async () => {
    const templateDir = join(testState.bundledRoot, 'skills', 'remotion-template-hot-news')
    mkdirSync(templateDir, { recursive: true })
    writeFileSync(
      join(templateDir, 'SKILL.md'),
      `---
name: 热点新闻
description: 测试模版
remotionVideoTemplate: true
category: news
compositionId: HotNews
accent: "#e63946"
durationSec: 20
status: ready
previewKind: hot-news-wide
---

# 正文
`,
      'utf-8'
    )
    mkdirSync(join(templateDir, 'template'), { recursive: true })
    writeFileSync(join(templateDir, 'template', 'manifest.json'), '{"compositions":[{"id":"HotNews","componentPath":"./x","componentExport":"X","width":1,"height":1,"fps":30,"durationInFrames":30}]}', 'utf-8')

    const { queryRemotionVideoTemplates } = await import('../electron/main/store/skills')
    const list = queryRemotionVideoTemplates()
    expect(list).toHaveLength(1)
    expect(list[0]).toEqual(
      expect.objectContaining({
        id: 'remotion-template-hot-news',
        title: '热点新闻',
        compositionId: 'HotNews',
        previewKind: 'hot-news-wide',
        hasTemplateCode: true
      })
    )
  })

  it('内置始终注入；自定义可全局开关或会话/角色选中', async () => {
    const {
      postProjectSkill,
      postSkillStates,
      queryEnabledSkillContent,
      queryEnabledSkillPrompt,
      queryInjectableSkillContent,
      queryInjectableSkillPrompt,
      queryInjectableSkills
    } = await import('../electron/main/store/skills')

    // 内置技能（react-agent- 前缀）：始终注入，即使写入 enabled=false 也被忽略
    postProjectSkill({
      id: 'react-agent-writing',
      name: '写作指南',
      description: '在撰写营销文案时使用',
      content: '# 私有正文\n\n先提炼卖点，再组织文案。',
      examplesContent: '# 示例\n\n一条示例文案'
    })
    postSkillStates({ 'react-agent-writing': { enabled: false } })

    // 自定义：全局启用则进入无上下文目录
    postProjectSkill({
      id: 'custom-guide',
      name: '自定义指南',
      description: '可全局注入',
      content: '# 自定义正文'
    })
    postSkillStates({ 'custom-guide': { enabled: true } })

    postProjectSkill({
      id: 'disabled-guide',
      name: '停用指南',
      description: '不应全局提供给 Agent',
      content: '# 停用正文'
    })
    postSkillStates({ 'disabled-guide': { enabled: false } })

    const prompt = queryEnabledSkillPrompt()
    expect(prompt).toContain('react-agent-writing')
    expect(prompt).toContain('在撰写营销文案时使用')
    expect(prompt).not.toContain('先提炼卖点')
    expect(prompt).toContain('custom-guide')
    expect(prompt).not.toContain('disabled-guide')
    expect(queryEnabledSkillContent('react-agent-writing')).toContain('先提炼卖点')
    expect(queryEnabledSkillContent('custom-guide')).toContain('自定义正文')
    expect(queryEnabledSkillContent('disabled-guide')).toBeNull()

    // 未全局启用的自定义：会话选中后进入并集
    const withSession = queryInjectableSkillPrompt(12_000, {
      sessionSkillIds: ['disabled-guide']
    })
    expect(withSession).toContain('react-agent-writing')
    expect(withSession).toContain('custom-guide')
    expect(withSession).toContain('disabled-guide')
    expect(
      queryInjectableSkillContent('disabled-guide', { sessionSkillIds: ['disabled-guide'] })
    ).toContain('停用正文')

    // 角色关联与会话并集去重
    const union = queryInjectableSkills({
      sessionSkillIds: ['disabled-guide'],
      roleSkillIds: ['disabled-guide', 'missing-skill']
    })
    expect(union.map((s) => s.id).sort()).toEqual([
      'custom-guide',
      'disabled-guide',
      'react-agent-writing'
    ])
  })

  it('新建自定义技能默认 enabled=false，不进入无上下文目录', async () => {
    const { postProjectSkill, queryEnabledSkillPrompt, queryProjectSkills } = await import(
      '../electron/main/store/skills'
    )
    postProjectSkill({
      id: 'brand-new',
      name: '新技能',
      description: '新建',
      content: 'body'
    })
    expect(queryProjectSkills().find((s) => s.id === 'brand-new')?.enabled).toBe(false)
    expect(queryEnabledSkillPrompt()).not.toContain('brand-new')
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
    // 内置技能禁用全局开关：postSkillStates 忽略内置 enabled 变更
    expect(queryProjectSkills().find((s) => s.id === 'remotion-create')?.enabled).toBe(true)
  })

  it('技能目录达到预算时不会截断单条技能信息', async () => {
    const { postProjectSkill, postSkillStates, queryInjectableSkillPrompt } = await import(
      '../electron/main/store/skills'
    )
    postProjectSkill({
      id: 'react-agent-alpha',
      name: 'A',
      description: 'first',
      content: 'alpha content'
    })
    postProjectSkill({
      id: 'react-agent-beta',
      name: 'B',
      description: 'second',
      content: 'beta content'
    })
    postSkillStates({
      'react-agent-alpha': { enabled: true },
      'react-agent-beta': { enabled: true }
    })

    const firstEntry = '- `react-agent-alpha`：A — first'
    const prompt = queryInjectableSkillPrompt(firstEntry.length + 5, {})

    expect(prompt).toContain(firstEntry)
    expect(prompt).not.toContain('\n- `')
    expect(prompt).toContain('技能目录已截断')
  })
})
