import { beforeEach, describe, expect, it, vi } from 'vitest'

const promptMocks = vi.hoisted(() => ({
  queryEnabledRulePrompt: vi.fn(() => '用户规则'),
  queryInjectableSkillPrompt: vi.fn(() => '项目技能')
}))

vi.mock('../electron/main/store/rules', () => ({
  queryEnabledRulePrompt: promptMocks.queryEnabledRulePrompt
}))

vi.mock('../electron/main/store/skills', () => ({
  queryInjectableSkillPrompt: promptMocks.queryInjectableSkillPrompt
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
    expect(promptMocks.queryInjectableSkillPrompt).not.toHaveBeenCalled()
  })

  it('普通角色使用受限的规则和技能字符预算', () => {
    const prompt = buildRoleSystemPrompt('general')

    expect(promptMocks.queryEnabledRulePrompt).toHaveBeenCalledWith(4_000)
    expect(promptMocks.queryInjectableSkillPrompt).toHaveBeenCalledWith(4_000, {
      sessionSkillIds: [],
      roleSkillIds: []
    })
    expect(prompt).toContain('可用技能目录')
    expect(prompt).toContain('use_skill')
    expect(prompt).toContain('思考推理过程')
    expect(prompt).toContain('适用于全部模型输出')
    expect(prompt).toContain('执行模式：需确认')
  })

  it('传入 skillCtx 时合并会话与角色技能', () => {
    buildRoleSystemPrompt('general', undefined, undefined, {
      sessionSkillIds: ['a'],
      roleSkillIds: ['b']
    })
    expect(promptMocks.queryInjectableSkillPrompt).toHaveBeenCalledWith(4_000, {
      sessionSkillIds: ['a'],
      roleSkillIds: ['b']
    })
  })

  it('非 supervisor 角色在 system prompt 末尾强制简体中文（含思考）', () => {
    const prompt = buildRoleSystemPrompt('general')

    expect(prompt).toContain('输出语言（强制，不可违反）')
    expect(prompt).toContain('禁止用英文思考')
    expect(prompt.trimEnd().endsWith('立即改用中文继续')).toBe(true)
  })

  it('完全访问模式注入连续执行约束', () => {
    const prompt = buildRoleSystemPrompt('general', undefined, { fullAccess: true })

    expect(prompt).toContain('执行模式：完全访问')
    expect(prompt).toContain('禁止调用 present_plan_choices')
  })

  it('用户角色设定追加到内置说明之后', () => {
    const prompt = buildRoleSystemPrompt('writer', {
      writer: '回复保持简洁，优先 bullet 列表'
    })

    expect(prompt).toContain('用户角色设定')
    expect(prompt).toContain('回复保持简洁，优先 bullet 列表')
  })
})
