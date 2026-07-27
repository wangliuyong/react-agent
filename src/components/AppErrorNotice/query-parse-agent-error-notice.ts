/**
 * 解析 Agent 报错文案中的上下文后缀。
 * 形如：`原始错误（工具：a，角色：b，Agent：c，连接：d）`
 */
export interface AgentErrorNoticeParts {
  /** 去掉上下文括号后的主错误文案 */
  summary: string
  toolName?: string
  roleName?: string
  agentName?: string
  connection?: string
}

const CONTEXT_RE =
  /^([\s\S]*?)（((?:工具|角色|Agent|连接)：[^）]+)）\s*$/

export function queryParseAgentErrorNotice(raw: string): AgentErrorNoticeParts {
  const text = raw.trim()
  const match = text.match(CONTEXT_RE)
  if (!match) {
    return { summary: text || '未知错误' }
  }

  const summary = match[1].trim() || '执行失败'
  const body = match[2]
  const parts: AgentErrorNoticeParts = { summary }

  for (const segment of body.split('，')) {
    const idx = segment.indexOf('：')
    if (idx < 0) continue
    const key = segment.slice(0, idx).trim()
    const value = segment.slice(idx + 1).trim()
    if (!value) continue
    if (key === '工具') parts.toolName = value
    else if (key === '角色') parts.roleName = value
    else if (key === 'Agent') parts.agentName = value
    else if (key === '连接') parts.connection = value
  }

  return parts
}
