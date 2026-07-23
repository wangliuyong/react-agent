import type { QuickCard } from './types'

/**
 * Fisher–Yates 洗牌（不可变）：用于「换一批」打乱卡池顺序。
 */
function shuffleCards(cards: QuickCard[]): QuickCard[] {
  const next = [...cards]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = next[i]!
    next[i] = next[j]!
    next[j] = tmp
  }
  return next
}

/**
 * 从卡池取出下一屏卡片。
 * 池足够大时尽量避开当前这一批，避免「换一批」几乎没变化。
 */
export function queryNextQuickTaskBatch(
  pool: QuickCard[],
  current: QuickCard[],
  pageSize: number
): QuickCard[] {
  if (pool.length <= pageSize) {
    return shuffleCards(pool).slice(0, pageSize)
  }

  const currentTitles = new Set(current.map((c) => c.title))
  const others = pool.filter((c) => !currentTitles.has(c.title))
  const shuffledOthers = shuffleCards(others)

  // 优先用未展示卡片填满一屏；不够时再从当前批补齐
  if (shuffledOthers.length >= pageSize) {
    return shuffledOthers.slice(0, pageSize)
  }

  const need = pageSize - shuffledOthers.length
  const fillers = shuffleCards(current).slice(0, need)
  return [...shuffledOthers, ...fillers]
}

/**
 * 欢迎页快捷任务：分页展示 +「换一批」。
 * batchKey 变化时用于重挂载网格，重播入场动画。
 */
export function useQuickTaskBatch(
  pool: QuickCard[],
  pageSize: number
): {
  cards: QuickCard[]
  batchKey: number
  refresh: () => void
  canRefresh: boolean
} {
  const [cards, setCards] = useState<QuickCard[]>(() => pool.slice(0, pageSize))
  const [batchKey, setBatchKey] = useState(0)

  const canRefresh = pool.length > pageSize

  const refresh = (): void => {
    setCards((prev) => queryNextQuickTaskBatch(pool, prev, pageSize))
    setBatchKey((k) => k + 1)
  }

  return { cards, batchKey, refresh, canRefresh }
}
