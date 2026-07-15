import { queryEnabledSkillContent } from '../../store/skills'
import type { AgentTool } from './types'

/**
 * 按需加载技能完整说明。
 * system prompt 只保留技能 id、名称和描述，Agent 判断相关后再调用本工具。
 */
export const useSkillTool: AgentTool = {
  name: 'use_skill',
  description:
    '读取一个已启用技能的完整操作说明。仅当用户任务与可用技能目录中的描述明确匹配时调用。',
  permission: 'safe',
  parameters: {
    type: 'object',
    properties: {
      skillId: {
        type: 'string',
        description: '可用技能目录中的技能 id'
      }
    },
    required: ['skillId']
  },
  async execute(args) {
    const skillId = String(args.skillId ?? '').trim()
    if (!skillId) return '请提供要使用的技能 id'

    const content = queryEnabledSkillContent(skillId)
    return content ?? `技能「${skillId}」未启用或不存在`
  }
}
