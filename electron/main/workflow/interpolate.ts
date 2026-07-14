/**
 * 将 argsTemplate 中的 {{key}} 替换为 WorkflowRun.context 的值。
 * 缺失键直接抛错，避免工具带着未替换占位符静默失败。
 */
export function interpolateDeep(
  value: unknown,
  context: Record<string, unknown>
): unknown {
  if (typeof value === 'string') {
    return value.replace(/\{\{(\w+)\}\}/g, (_full, key: string) => {
      if (!(key in context)) {
        throw new Error(`缺少上下文变量: ${key}`)
      }
      const v = context[key]
      if (v == null) return ''
      return typeof v === 'string' ? v : JSON.stringify(v)
    })
  }
  if (Array.isArray(value)) {
    return value.map((item) => interpolateDeep(item, context))
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = interpolateDeep(v, context)
    }
    return out
  }
  return value
}
