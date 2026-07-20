import { useVirtualizer } from '@tanstack/react-virtual'
import { useStickToBottom } from './useStickToBottom'
import styles from './VirtualList.module.css'

export interface VirtualListProps<T> {
  items: T[]
  /** 稳定 key，避免重排时焦点丢失 */
  getItemKey: (item: T, index: number) => string
  renderItem: (item: T, index: number) => React.ReactNode
  /** 预估行高；聊天消息等可变高度场景可配合 measureElement 动态校正 */
  estimateSize?: number | ((index: number, item: T) => number)
  /** 行间距（px） */
  gap?: number
  overscan?: number
  className?: string
  innerClassName?: string
  /** 聊天列表：靠近底部时自动跟随新内容 */
  stickToBottom?: boolean
  /** 触发贴底滚动的依赖（如消息数、流式文本） */
  stickToBottomDeps?: unknown[]
  /**
   * 主动滚动到指定行（如任务清单跳转聊天记录）。
   * token 每次变化都会触发滚动，便于重复点击同一任务。
   */
  scrollToIndex?: number
  scrollToIndexAlign?: 'start' | 'center' | 'end'
  scrollToIndexToken?: number
}

/**
 * 通用虚拟滚动列表：仅渲染可视区 + overscan，适合长消息流与会话历史。
 */
export function VirtualList<T>({
  items,
  getItemKey,
  renderItem,
  estimateSize = 48,
  gap = 0,
  overscan = 6,
  className,
  innerClassName,
  stickToBottom = false,
  stickToBottomDeps = [],
  scrollToIndex,
  scrollToIndexAlign = 'center',
  scrollToIndexToken
}: VirtualListProps<T>): React.ReactElement {
  const scrollRef = useRef<HTMLDivElement>(null)

  const resolveEstimateSize = useCallback(
    (index: number) => {
      const item = items[index]
      if (item === undefined) return typeof estimateSize === 'number' ? estimateSize : 48
      return typeof estimateSize === 'function' ? estimateSize(index, item) : estimateSize
    },
    [estimateSize, items]
  )

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: resolveEstimateSize,
    gap,
    overscan,
    getItemKey: (index) => getItemKey(items[index]!, index)
  })

  const { onScroll, detachFromBottom } = useStickToBottom(scrollRef, virtualizer, {
    enabled: stickToBottom,
    deps: stickToBottomDeps
  })

  /** 任务清单等场景：跳转到指定虚拟行并脱离贴底跟随 */
  useEffect(() => {
    if (scrollToIndexToken === undefined) return
    if (scrollToIndex === undefined || scrollToIndex < 0) return

    detachFromBottom()
    virtualizer.scrollToIndex(scrollToIndex, {
      align: scrollToIndexAlign,
      behavior: 'smooth'
    })
    requestAnimationFrame(() => {
      virtualizer.measure()
    })
  }, [
    detachFromBottom,
    scrollToIndex,
    scrollToIndexAlign,
    scrollToIndexToken,
    virtualizer
  ])

  const virtualItems = virtualizer.getVirtualItems()

  return (
    <div
      ref={scrollRef}
      className={[styles.viewport, className].filter(Boolean).join(' ')}
      onScroll={stickToBottom ? onScroll : undefined}
    >
      <div
        className={[styles.inner, innerClassName].filter(Boolean).join(' ')}
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualItems.map((virtualRow) => {
          const item = items[virtualRow.index]
          if (!item) return null

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className={styles.row}
              style={{ transform: `translateY(${virtualRow.start}px)` }}
            >
              {renderItem(item, virtualRow.index)}
            </div>
          )
        })}
      </div>
    </div>
  )
}
