import type { AgentRule, AgentRuleUpsertInput } from '@shared/types'

/** 新建规则表单默认值 */
export function createEmptyRule(): AgentRuleUpsertInput {
  return {
    id: '',
    name: '',
    description: '',
    content: '',
    enabled: true
  }
}

/** 将展示名称转为建议的规则 id */
export function slugifyRuleId(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')
    .slice(0, 64)
  return slug || `rule_${Date.now()}`
}

/** 校验规则 id 格式（与主进程 validateRuleId 一致；拒绝非字符串，避免 RegExp 把 undefined 当成 "undefined"） */
export function isValidRuleId(id: string): boolean {
  return typeof id === 'string' && /^[a-z0-9_-]{1,64}$/.test(id)
}

/** 规则实体 → 编辑 DTO */
export function ruleToInput(rule: AgentRule): AgentRuleUpsertInput {
  return {
    id: rule.id,
    name: rule.name,
    description: rule.description,
    content: rule.content,
    enabled: rule.enabled
  }
}
