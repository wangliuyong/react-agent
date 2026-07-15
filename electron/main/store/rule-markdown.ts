import type { AgentRule } from '../../../shared/types'

const KNOWN_FRONTMATTER_KEYS = new Set([
  'name',
  'description',
  'alwaysApply',
  'createdAt',
  'updatedAt'
])

interface RuleMarkdownParts {
  frontmatterLines: string[]
  body: string
}

function splitRuleMarkdown(raw: string): RuleMarkdownParts {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/)
  if (!match) {
    return { frontmatterLines: [], body: raw.trim() }
  }
  return {
    frontmatterLines: match[1].split(/\r?\n/),
    body: match[2].trim()
  }
}

function queryFrontmatterValue(lines: string[], key: string): string | undefined {
  const prefix = `${key}:`
  const line = lines.find((item) => item.startsWith(prefix))
  return line?.slice(prefix.length).trim()
}

function parseString(value: string | undefined): string {
  if (!value) return ''
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    try {
      return value.startsWith('"') ? (JSON.parse(value) as string) : value.slice(1, -1)
    } catch {
      return value.slice(1, -1)
    }
  }
  return value
}

function parseTimestamp(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

/** 将 Cursor `.mdc` 文件转换为规则页面和 Agent 注入共用的数据模型。 */
export function parseRuleMarkdown(id: string, raw: string, fileUpdatedAt: number): AgentRule {
  const { frontmatterLines, body } = splitRuleMarkdown(raw)
  const name = parseString(queryFrontmatterValue(frontmatterLines, 'name')).trim()
  const description = parseString(
    queryFrontmatterValue(frontmatterLines, 'description')
  ).trim()

  return {
    id,
    name: name || id,
    description,
    content: body,
    enabled: queryFrontmatterValue(frontmatterLines, 'alwaysApply') === 'true',
    createdAt: parseTimestamp(
      queryFrontmatterValue(frontmatterLines, 'createdAt'),
      fileUpdatedAt
    ),
    updatedAt: parseTimestamp(
      queryFrontmatterValue(frontmatterLines, 'updatedAt'),
      fileUpdatedAt
    )
  }
}

/**
 * 序列化时仅接管应用认识的字段，其余 Cursor frontmatter 原样保留。
 * 这样编辑规则不会丢失 `globs` 等 Cursor 原生或未来扩展配置。
 */
export function buildRuleMarkdown(rule: AgentRule, previousRaw = ''): string {
  const previous = splitRuleMarkdown(previousRaw)
  const unknownLines = previous.frontmatterLines.filter((line) => {
    const keyMatch = line.match(/^([A-Za-z][\w-]*):/)
    return !keyMatch || !KNOWN_FRONTMATTER_KEYS.has(keyMatch[1])
  })
  const knownLines = [
    `name: ${JSON.stringify(rule.name.trim())}`,
    `description: ${JSON.stringify(rule.description.trim())}`,
    `alwaysApply: ${rule.enabled}`,
    `createdAt: ${rule.createdAt}`,
    `updatedAt: ${rule.updatedAt}`
  ]
  const frontmatter = [...knownLines, ...unknownLines].join('\n')

  return `---\n${frontmatter}\n---\n\n${rule.content.trim()}\n`
}
