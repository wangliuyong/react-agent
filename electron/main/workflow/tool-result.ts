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
