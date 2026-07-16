/** 工具返回此前缀时，引擎把 JSON.patch 合并进 WorkflowRun.context */
export const WORKFLOW_CTX_PREFIX = '@@workflow_ctx@@'

/**
 * 解析工具返回值：支持 @@workflow_ctx@@{"message","patch"} 将字段写入流程 context。
 * 普通字符串则原样作为 message，无 patch。
 */
export function queryDecodeWorkflowToolResult(result: string): {
  message: string
  patch: Record<string, unknown>
} {
  if (!result.startsWith(WORKFLOW_CTX_PREFIX)) {
    return { message: result, patch: {} }
  }
  try {
    const parsed = JSON.parse(result.slice(WORKFLOW_CTX_PREFIX.length)) as {
      message?: unknown
      patch?: unknown
    }
    const patch =
      parsed.patch && typeof parsed.patch === 'object' && !Array.isArray(parsed.patch)
        ? (parsed.patch as Record<string, unknown>)
        : {}
    return {
      message: parsed.message != null ? String(parsed.message) : result,
      patch
    }
  } catch {
    return { message: result, patch: {} }
  }
}

/** Agent 提示词插值：缺省 key 用空串，避免打断流程 */
export function interpolatePromptSoft(
  template: string,
  context: Record<string, unknown>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_full, key: string) => {
    if (!(key in context)) return ''
    const v = context[key]
    if (v == null) return ''
    return typeof v === 'string' ? v : JSON.stringify(v)
  })
}

/** 从 Agent 回复中提取可推送的 Markdown 正文（去掉过程说明与代码围栏） */
export function queryExtractNotifyMarkdown(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return ''

  const fenceRe = /```(?:markdown|md)?\s*\n([\s\S]*?)```/gi
  const fenced: string[] = []
  let match: RegExpExecArray | null
  while ((match = fenceRe.exec(trimmed)) !== null) {
    const body = match[1]?.trim()
    if (body) fenced.push(body)
  }
  if (fenced.length > 0) {
    return fenced.sort((a, b) => b.length - a.length)[0]
  }

  const headingIdx = trimmed.search(/^#{1,6}\s+/m)
  if (headingIdx >= 0) return trimmed.slice(headingIdx).trim()

  return trimmed
}

/** 从 Markdown 首行标题提取推送标题（## 热点富文本简报 → 热点富文本简报） */
export function queryMarkdownHeadingTitle(markdown: string): string | undefined {
  const m = markdown.match(/^#{1,6}\s+(.+)$/m)
  return m?.[1]?.trim() || undefined
}

/** 从本步新增消息中取最后一条有正文的 assistant 回复，作为 Agent 步骤产出 */
export function queryAgentStepOutput(
  messages: Array<{ role: string; content?: string | null }>,
  fromIndex: number
): string {
  const newMessages = messages.slice(fromIndex)
  const lastAssistant = [...newMessages]
    .reverse()
    .find((m) => m.role === 'assistant' && m.content?.trim())
  const raw = lastAssistant?.content?.trim() ?? ''
  return queryExtractNotifyMarkdown(raw)
}

/**
 * 将 Agent 步骤产出写入 context，供下游 notify/toast 的 {{key}} 引用。
 * 未配置 outputKeys 时默认写入 summary，与渠道通知节点默认模板对齐。
 */
export function patchAgentOutputToContext(
  context: Record<string, unknown>,
  output: string,
  outputKeys?: string[]
): Record<string, unknown> {
  if (!output) return context
  const nextContext = { ...context }
  const keys = outputKeys?.length ? outputKeys : ['summary']
  for (const key of keys) {
    nextContext[key] = output
  }
  return nextContext
}
