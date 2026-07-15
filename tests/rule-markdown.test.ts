import { describe, expect, it } from 'vitest'
import type { AgentRule } from '../shared/types'
import { buildRuleMarkdown, parseRuleMarkdown } from '../electron/main/store/rule-markdown'

describe('rule markdown', () => {
  it('解析 Cursor MDC 并在名称缺失时使用文件 id', () => {
    const raw = `---
alwaysApply: true
globs: ["src/**/*.tsx"]
---

设计UI都要参考技能市场页面
`

    expect(parseRuleMarkdown('ui-demo', raw, 100)).toEqual({
      id: 'ui-demo',
      name: 'ui-demo',
      description: '',
      content: '设计UI都要参考技能市场页面',
      enabled: true,
      createdAt: 100,
      updatedAt: 100
    })
  })

  it('更新规则时保留未知 frontmatter 字段', () => {
    const previousRaw = `---
alwaysApply: false
globs: ["src/**/*.tsx"]
customKey: custom-value
---

旧正文
`
    const rule: AgentRule = {
      id: 'ui-demo',
      name: 'UI 设计规则',
      description: '保持界面一致',
      content: '新正文',
      enabled: true,
      createdAt: 10,
      updatedAt: 20
    }

    const built = buildRuleMarkdown(rule, previousRaw)

    expect(built).toContain('globs: ["src/**/*.tsx"]')
    expect(built).toContain('customKey: custom-value')
    expect(built).toContain('alwaysApply: true')
    expect(parseRuleMarkdown('ui-demo', built, 30)).toEqual(rule)
  })
})
