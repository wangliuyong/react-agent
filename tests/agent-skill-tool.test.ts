import { describe, expect, it, vi } from 'vitest'

const skillMocks = vi.hoisted(() => ({
  queryInjectableSkillContent: vi.fn((id: string, _ctx?: unknown) =>
    id === 'writing-guide' ? '技能「写作指南」的完整说明' : null
  )
}))

vi.mock('../electron/main/store/skills', () => ({
  queryInjectableSkillContent: skillMocks.queryInjectableSkillContent
}))

import { useSkillTool } from '../electron/main/agent/tools/skill-tools'

describe('use_skill 工具', () => {
  it('只在 Agent 显式选择技能后读取完整说明', async () => {
    const result = await useSkillTool.execute(
      { skillId: 'writing-guide' },
      { skillInjectCtx: { sessionSkillIds: ['writing-guide'] } } as never
    )

    expect(skillMocks.queryInjectableSkillContent).toHaveBeenCalledWith('writing-guide', {
      sessionSkillIds: ['writing-guide']
    })
    expect(result).toBe('技能「写作指南」的完整说明')
  })

  it('拒绝读取未注入或不存在的技能', async () => {
    const result = await useSkillTool.execute({ skillId: 'disabled-guide' }, {} as never)

    expect(result).toContain('未注入或不存在')
  })
})
