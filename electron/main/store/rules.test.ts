import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const testState = vi.hoisted(() => ({
  rulesDir: ''
}))

vi.mock('./resources', () => ({
  queryRulesDir: (): string => testState.rulesDir
}))

describe('rules store', () => {
  let root: string

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'react-agent-rules-'))
    testState.rulesDir = join(root, 'resources', 'rules')
    mkdirSync(testState.rulesDir, { recursive: true })
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
    vi.resetModules()
  })

  it('扫描 MDC、保存并删除规则文件', async () => {
    writeFileSync(
      join(testState.rulesDir, 'existing.mdc'),
      '---\nname: "现有规则"\nalwaysApply: true\n---\n\n现有正文\n',
      'utf-8'
    )
    writeFileSync(join(testState.rulesDir, 'ignored.md'), '不应读取', 'utf-8')
    const { postAgentRule, postDeleteAgentRule, queryAgentRules } = await import('./rules')

    expect(queryAgentRules()).toEqual([
      expect.objectContaining({
        id: 'existing',
        name: '现有规则',
        enabled: true,
        content: '现有正文'
      })
    ])

    postAgentRule({
      id: 'new-rule',
      name: '新规则',
      description: '测试规则',
      content: '新正文',
      enabled: false
    })
    expect(readFileSync(join(testState.rulesDir, 'new-rule.mdc'), 'utf-8')).toContain(
      'alwaysApply: false'
    )

    postDeleteAgentRule('new-rule')
    expect(existsSync(join(testState.rulesDir, 'new-rule.mdc'))).toBe(false)
  })

  it('仅将启用规则注入 Agent 提示', async () => {
    writeFileSync(
      join(testState.rulesDir, 'enabled.mdc'),
      '---\nname: "启用规则"\nalwaysApply: true\n---\n\n必须执行\n',
      'utf-8'
    )
    writeFileSync(
      join(testState.rulesDir, 'disabled.mdc'),
      '---\nname: "停用规则"\nalwaysApply: false\n---\n\n不要注入\n',
      'utf-8'
    )
    const { queryEnabledRulePrompt } = await import('./rules')

    expect(queryEnabledRulePrompt()).toContain('必须执行')
    expect(queryEnabledRulePrompt()).not.toContain('不要注入')
  })
})
