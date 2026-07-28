/**
 * 工具名模糊解析：LLM 常把 fetch_hot_topics 写成 fetch_hot_topic 等近似名。
 * 相似度 ≥ 阈值（默认 0.9）时视为命中已注册工具。
 */

/** 归一化：小写、统一分隔符，便于跨写法比对 */
export function queryNormalizeToolName(name: string): string {
  return name.trim().toLowerCase().replace(/[\s-]+/g, '_')
}

/** Levenshtein 编辑距离（经典 DP，工具名通常很短） */
export function queryLevenshteinDistance(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length

  const prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  const curr = new Array<number>(b.length + 1)

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i
    const ca = a.charCodeAt(i - 1)
    for (let j = 1; j <= b.length; j++) {
      const cost = ca === b.charCodeAt(j - 1) ? 0 : 1
      curr[j] = Math.min(
        prev[j]! + 1,
        curr[j - 1]! + 1,
        prev[j - 1]! + cost
      )
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j]!
  }
  return prev[b.length]!
}

/**
 * 相似度 ∈ [0,1]：1 - 编辑距离 / 较长串长度。
 * 空串对空串视为 1；一侧为空视为 0。
 */
export function queryToolNameSimilarity(a: string, b: string): number {
  const left = queryNormalizeToolName(a)
  const right = queryNormalizeToolName(b)
  if (!left && !right) return 1
  if (!left || !right) return 0
  if (left === right) return 1
  const maxLen = Math.max(left.length, right.length)
  return 1 - queryLevenshteinDistance(left, right) / maxLen
}

export interface QueryResolveToolNameOptions {
  /** 相似度阈值，默认 0.9（即「匹配到了 90%」） */
  threshold?: number
}

export interface QueryResolvedToolName {
  /** 注册表中的规范工具名 */
  name: string
  /** 与请求名的相似度 */
  similarity: number
  /** 是否精确命中（归一化后完全一致） */
  exact: boolean
}

/**
 * 在候选工具名中解析请求名：先精确（归一化），再取相似度最高且 ≥ 阈值者。
 * @returns 命中结果；低于阈值或不存在时返回 undefined
 */
export function queryResolveToolName(
  requested: string,
  candidates: readonly string[],
  options?: QueryResolveToolNameOptions
): QueryResolvedToolName | undefined {
  const threshold = options?.threshold ?? 0.9
  const req = queryNormalizeToolName(requested)
  if (!req || candidates.length === 0) return undefined

  let best: QueryResolvedToolName | undefined

  for (const candidate of candidates) {
    const normalized = queryNormalizeToolName(candidate)
    if (!normalized) continue
    if (normalized === req) {
      return { name: candidate, similarity: 1, exact: true }
    }
    const similarity = queryToolNameSimilarity(req, normalized)
    if (similarity < threshold) continue
    if (!best || similarity > best.similarity) {
      best = { name: candidate, similarity, exact: false }
    }
  }

  return best
}
