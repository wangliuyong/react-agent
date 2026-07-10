import type { ProjectSkillDetail, SkillTemplate, SkillUpsertInput } from '@shared/types'

/** 新建技能表单默认值 */
export function createEmptySkill(): SkillUpsertInput {
  return {
    id: '',
    name: 'my-skill',
    description: '描述该技能的用途与触发场景，供 Agent 自动发现。',
    content: `# 我的技能

## 适用场景

（在此描述何时使用该技能）

## 执行步骤

1. ...
2. ...
`,
    examplesContent: ''
  }
}

/** 从详情转为可编辑 DTO */
export function skillDetailToInput(detail: ProjectSkillDetail): SkillUpsertInput {
  return {
    id: detail.id,
    name: detail.name,
    description: detail.description,
    content: detail.content,
    examplesContent: detail.examplesContent ?? ''
  }
}

/** 将展示名称转为建议的技能 id（仅小写 ASCII + 连字符） */
export function slugifySkillId(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
    .slice(0, 64)
  return slug || `skill-${Date.now()}`
}

/** 校验技能 id 格式（与主进程 validateSkillId 一致） */
export function isValidSkillId(id: string): boolean {
  return /^[a-z0-9-]{1,64}$/.test(id) && !id.startsWith('.') && id !== '_templates'
}
