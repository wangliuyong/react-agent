import { beforeEach, describe, expect, it, vi } from 'vitest'

const promptMocks = vi.hoisted(() => ({
  queryEnabledRulePrompt: vi.fn(() => '用户规则'),
  queryEnabledSkillPrompt: vi.fn(() => '项目技能')
}))

vi.mock('../electron/main/store/rules', () => ({
  queryEnabledRulePrompt: promptMocks.queryEnabledRulePrompt
}))

vi.mock('../electron/main/store/skills', () => ({
  queryEnabledSkillPrompt: promptMocks.queryEnabledSkillPrompt
}))

import { buildRoleSystemPrompt } from '../electron/main/agent/graph/prompts'

describe('角色提示词 Token 预算', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('Supervisor 不读取用户规则和项目技能', () => {
    const prompt = buildRoleSystemPrompt('supervisor')

    expect(prompt).not.toContain('用户规则')
    expect(prompt).not.toContain('项目技能')
    expect(promptMocks.queryEnabledRulePrompt).not.toHaveBeenCalled()
    expect(promptMocks.queryEnabledSkillPrompt).not.toHaveBeenCalled()
  })

  it('普通角色使用受限的规则和技能字符预算', () => {
    buildRoleSystemPrompt('general')

    expect(promptMocks.queryEnabledRulePrompt).toHaveBeenCalledWith(4_000)
    expect(promptMocks.queryEnabledSkillPrompt).toHaveBeenCalledWith(4_000)
  })
})
