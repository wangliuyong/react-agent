import { useVirtualizer } from '@tanstack/react-virtual'
import styles from './VirtualList.module.css'

export interface VirtualGridProps<T> {
  items: T[]
  /** 稳定 key，避免重排时焦点丢失 */
  getItemKey: (item: T, index: number) => string
  renderItem: (item: T, index: number) => React.ReactNode
  /**
   * 单行预估高度（含卡片本身）。
   * 实际高度由 measureElement 动态校正，便于响应式列数变化后重测。
   */
  estimateSize?: number
  /** 行间距，需与 entity-card.grid 的 gap 一致 */
  gap?: number
  overscan?: number
  className?: string
  /** 覆盖自动断点列数（一般无需传入） */
  columns?: number
}

/**
 * 与 entity-card.grid 媒体查询保持一致：
 * >1400 → 4 列；≤1400 → 3；≤1100 → 2；≤760 → 1
 */
function queryGridColumnCount(viewportWidth: number): number {
  if (viewportWidth <= 760) return 1
  if (viewportWidth <= 1100) return 2
  if (viewportWidth <= 1400) return 3
  return 4
}

/** 监听 viewport 断点，使虚拟行分列与 CSS grid 一致 */
function useGridColumnCount(override?: number): number {
  const [columnCount, setColumnCount] = useState(() =>
    typeof window === 'undefined' ? 4 : queryGridColumnCount(window.innerWidth)
  )

  useEffect(() => {
    if (override != null) return

    const mediaQueries = [
      window.matchMedia('(max-width: 760px)'),
      window.matchMedia('(max-width: 1100px)'),
      window.matchMedia('(max-width: 1400px)')
    ]

    const sync = (): void => {
      setColumnCount(queryGridColumnCount(window.innerWidth))
    }

    sync()
    for (const mq of mediaQueries) {
      mq.addEventListener('change', sync)
    }
    return () => {
      for (const mq of mediaQueries) {
        mq.removeEventListener('change', sync)
      }
    }
  }, [override])

  return override ?? columnCount
}

/**
 * 卡片网格虚拟滚动：按「行」虚拟化，每行渲染与 entity-card 相同的多列 grid。
 * 适合设置页渠道 / 工具 / 资产等长列表卡片墙。
 */
export function VirtualGrid<T>({
  items,
  getItemKey,
  renderItem,
  estimateSize = 188,
  gap = 16,
  overscan = 4,
  className,
  columns
}: VirtualGridProps<T>): React.ReactElement {
  const scrollRef = useRef<HTMLDivElement>(null)
  const columnCount = useGridColumnCount(columns)

  const rowCount = Math.ceil(items.length / columnCount) || 0

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => estimateSize,
    gap,
    overscan,
    getItemKey: (rowIndex) => {
      const start = rowIndex * columnCount
      const keys: string[] = []
      for (let i = 0; i < columnCount; i++) {
        const item = items[start + i]
        if (!item) break
        keys.push(getItemKey(item, start + i))
      }
      return keys.join('|') || `row-${rowIndex}`
    }
  })

  // 列数变化后重测，避免行高/占位错位
  useEffect(() => {
    virtualizer.measure()
  }, [columnCount, virtualizer])

  const virtualRows = virtualizer.getVirtualItems()

  return (
    <div
      ref={scrollRef}
      className={[styles.viewport, className].filter(Boolean).join(' ')}
    >
      <div
        className={styles.inner}
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualRows.map((virtualRow) => {
          const startIndex = virtualRow.index * columnCount
          const rowItems: { item: T; index: number }[] = []
          for (let i = 0; i < columnCount; i++) {
            const index = startIndex + i
            const item = items[index]
            if (!item) break
            rowItems.push({ item, index })
          }

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className={styles.row}
              style={{ transform: `translateY(${virtualRow.start}px)` }}
            >
              <div
                className={styles.gridRow}
                style={{
                  gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
                  gap
                }}
              >
                {rowItems.map(({ item, index }) => (
                  <div key={getItemKey(item, index)} className={styles.gridCell}>
                    {renderItem(item, index)}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
