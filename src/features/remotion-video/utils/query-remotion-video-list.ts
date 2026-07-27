import type { RemotionVideoCategory, RemotionVideoProject } from '../types'

export type RemotionVideoSort = 'updated_desc' | 'title_asc' | 'duration_asc'

/** 按分类 Tab 过滤；`all` 表示不过滤 */
export function queryRemotionVideosByCategory(
  list: RemotionVideoProject[],
  category: RemotionVideoCategory | 'all'
): RemotionVideoProject[] {
  if (category === 'all') return list
  return list.filter((p) => p.category === category)
}

/** 标题 / 描述 / compositionId 模糊搜索 */
export function queryRemotionVideoSearch(
  list: RemotionVideoProject[],
  query: string
): RemotionVideoProject[] {
  const q = query.trim().toLowerCase()
  if (!q) return list
  return list.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.compositionId.toLowerCase().includes(q)
  )
}

/** 列表排序 */
export function queryRemotionVideoSorted(
  list: RemotionVideoProject[],
  sort: RemotionVideoSort
): RemotionVideoProject[] {
  const next = [...list]
  switch (sort) {
    case 'title_asc':
      return next.sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'))
    case 'duration_asc':
      return next.sort((a, b) => a.durationSec - b.durationSec)
    default:
      return next.sort((a, b) => b.updatedAt - a.updatedAt)
  }
}

/** 格式化为 mm:ss，供卡片时长展示 */
export function formatRemotionDuration(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
