import { describe, expect, it, vi } from 'vitest'

const skillMocks = vi.hoisted(() => ({
  queryEnabledSkillContent: vi.fn((id: string) =>
    id === 'writing-guide' ? '技能「写作指南」的完整说明' : null
  )
}))

vi.mock('../electron/main/store/skills', () => ({
  queryEnabledSkillContent: skillMocks.queryEnabledSkillContent
}))

import { useSkillTool } from '../electron/main/agent/tools/skill-tools'

describe('use_skill 工具', () => {
  it('只在 Agent 显式选择技能后读取完整说明', async () => {
    const result = await useSkillTool.execute({ skillId: 'writing-guide' }, {} as never)

    expect(skillMocks.queryEnabledSkillContent).toHaveBeenCalledWith('writing-guide')
    expect(result).toBe('技能「写作指南」的完整说明')
  })

  it('拒绝读取未启用或不存在的技能', async () => {
    const result = await useSkillTool.execute({ skillId: 'disabled-guide' }, {} as never)

    expect(result).toContain('未启用或不存在')
  })
})
