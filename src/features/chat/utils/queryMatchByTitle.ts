/** 带标题的实体，用于按名称模糊匹配 */
export interface TitledEntity {
  title: string
}

/**
 * 按标题匹配实体列表：优先精确匹配，其次包含匹配。
 * 返回 0 个表示未找到；多个表示需要用户消歧。
 */
export function queryMatchByTitle<T extends TitledEntity>(
  items: T[],
  query: string
): T[] {
  const q = query.trim()
  if (!q) return []

  const normalizedItems = items.map((item) => ({
    item,
    title: item.title.trim()
  }))

  const exact = normalizedItems.filter(({ title }) => title === q).map(({ item }) => item)
  if (exact.length > 0) return exact

  const partial = normalizedItems
    .filter(({ title }) => title.includes(q) || q.includes(title))
    .map(({ item }) => item)

  return partial
}
