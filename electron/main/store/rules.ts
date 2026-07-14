import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { AgentRule, AgentRuleUpsertInput } from '../../../shared/types'
import { getDataRoot } from './paths'

function getRulesPath(): string {
  return join(getDataRoot(), 'rules.json')
}

/** 校验规则 id：小写、数字、连字符、下划线，1～64 字符 */
export function validateRuleId(id: string): void {
  if (!/^[a-z0-9_-]{1,64}$/.test(id)) {
    throw new Error('规则 id 仅允许小写字母、数字、连字符和下划线，长度 1～64')
  }
}

function normalizeRule(raw: AgentRule): AgentRule {
  const now = Date.now()
  return {
    id: raw.id.trim(),
    name: raw.name.trim(),
    description: (raw.description ?? '').trim(),
    content: (raw.content ?? '').trim(),
    enabled: Boolean(raw.enabled),
    createdAt: raw.createdAt ?? now,
    updatedAt: raw.updatedAt ?? now
  }
}

/** 列表按更新时间降序，便于用户先看到最近编辑的规则 */
function sortRules(rules: AgentRule[]): AgentRule[] {
  return [...rules].sort((a, b) => b.updatedAt - a.updatedAt)
}

function readRulesFromDisk(): AgentRule[] {
  const path = getRulesPath()
  if (!existsSync(path)) {
    return []
  }

  try {
    const parsed = JSON.parse(readFileSync(path, 'utf-8')) as AgentRule[]
    if (!Array.isArray(parsed)) {
      throw new Error('rules.json 格式无效')
    }
    return sortRules(parsed.map(normalizeRule))
  } catch {
    return []
  }
}

function writeRules(rules: AgentRule[]): AgentRule[] {
  const normalized = sortRules(rules.map(normalizeRule))
  writeFileSync(getRulesPath(), JSON.stringify(normalized, null, 2), 'utf-8')
  return normalized
}

/** 读：全部 Agent 用户规则 */
export function queryAgentRules(): AgentRule[] {
  return readRulesFromDisk()
}

/** 写：新增或更新规则 */
export function postAgentRule(input: AgentRuleUpsertInput): AgentRule {
  validateRuleId(input.id)
  if (!input.name.trim()) throw new Error('规则名称不能为空')
  if (!input.content.trim()) throw new Error('规则正文不能为空')

  const rules = readRulesFromDisk()
  const now = Date.now()
  const existing = rules.find((r) => r.id === input.id)

  const next = normalizeRule({
    id: input.id,
    name: input.name,
    description: input.description,
    content: input.content,
    enabled: input.enabled,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  })

  const idx = rules.findIndex((r) => r.id === input.id)
  const merged = idx >= 0 ? rules.map((r, i) => (i === idx ? next : r)) : [...rules, next]
  writeRules(merged)
  return next
}

/** 写：删除规则 */
export function postDeleteAgentRule(id: string): void {
  const rules = readRulesFromDisk()
  if (!rules.some((r) => r.id === id)) return
  writeRules(rules.filter((r) => r.id !== id))
}

/**
 * 获取已启用规则的 Markdown 正文，供 Agent SYSTEM_PROMPT 注入。
 * 限制总长度，避免撑爆上下文（规则优先于技能，预算略小于技能）。
 */
export function queryEnabledRulePrompt(maxChars = 8000): string {
  const rules = queryAgentRules().filter((r) => r.enabled)
  if (!rules.length) return ''

  const parts: string[] = []
  let total = 0

  for (const rule of rules) {
    const chunk = `### 规则：${rule.name}\n${rule.description ? `> ${rule.description}\n\n` : ''}${rule.content}`
    if (total + chunk.length > maxChars) {
      parts.push(chunk.slice(0, maxChars - total) + '\n\n...(规则内容已截断)')
      break
    }
    parts.push(chunk)
    total += chunk.length
  }

  return parts.join('\n\n---\n\n')
}
