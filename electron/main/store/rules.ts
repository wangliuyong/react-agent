import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  unlinkSync,
  writeFileSync
} from 'fs'
import { join } from 'path'
import type { AgentRule, AgentRuleUpsertInput } from '../../../shared/types'
import { buildRuleMarkdown, parseRuleMarkdown } from './rule-markdown'
import { queryRulesDir } from './resources'

/** 校验规则 id：小写、数字、连字符、下划线，1～64 字符 */
export function validateRuleId(id: string): void {
  if (!/^[a-z0-9_-]{1,64}$/.test(id)) {
    throw new Error('规则 id 仅允许小写字母、数字、连字符和下划线，长度 1～64')
  }
}

/** 列表按更新时间降序，便于用户先看到最近编辑的规则 */
function sortRules(rules: AgentRule[]): AgentRule[] {
  return [...rules].sort((a, b) => b.updatedAt - a.updatedAt)
}

function readRulesFromDisk(): AgentRule[] {
  const dir = queryRulesDir()
  if (!existsSync(dir)) return []

  const rules: AgentRule[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.mdc')) continue
    const path = join(dir, entry.name)
    const id = entry.name.slice(0, -'.mdc'.length)
    try {
      validateRuleId(id)
      const stat = statSync(path)
      rules.push(parseRuleMarkdown(id, readFileSync(path, 'utf-8'), stat.mtimeMs))
    } catch (error) {
      // 单个损坏文件不应阻断其他规则加载，路径与原因用于开发排查。
      console.warn(`[rules] 跳过无法解析的规则文件：${path}`, error)
    }
  }

  return sortRules(rules)
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

  const dir = queryRulesDir()
  mkdirSync(dir, { recursive: true })
  const path = join(dir, `${input.id}.mdc`)
  const now = Date.now()
  const previousRaw = existsSync(path) ? readFileSync(path, 'utf-8') : ''
  const existing = previousRaw
    ? parseRuleMarkdown(input.id, previousRaw, statSync(path).mtimeMs)
    : null

  const next: AgentRule = {
    id: input.id,
    name: input.name.trim(),
    description: input.description.trim(),
    content: input.content.trim(),
    enabled: Boolean(input.enabled),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  }
  writeFileSync(path, buildRuleMarkdown(next, previousRaw), 'utf-8')
  return next
}

/** 写：删除规则 */
export function postDeleteAgentRule(id: string): void {
  validateRuleId(id)
  const path = join(queryRulesDir(), `${id}.mdc`)
  if (existsSync(path)) unlinkSync(path)
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
