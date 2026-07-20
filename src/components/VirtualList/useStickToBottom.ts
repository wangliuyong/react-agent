import { useCallback, useEffect, useRef } from 'react'
import type { Virtualizer } from '@tanstack/react-virtual'

/** 距底部多少像素内视为「贴底」，新内容到达时自动滚动 */
const STICKY_BOTTOM_THRESHOLD_PX = 96

interface UseStickToBottomOptions {
  /** 是否启用贴底跟随 */
  enabled?: boolean
  /** 内容变化时触发滚动的依赖 */
  deps?: unknown[]
}

/**
 * 聊天类列表专用：用户上滑阅读历史时不抢滚动，回到底部附近后再自动跟随新消息。
 */
export function useStickToBottom<TScrollElement extends HTMLElement>(
  scrollRef: React.RefObject<TScrollElement | null>,
  virtualizer: Virtualizer<TScrollElement, Element>,
  { enabled = false, deps = [] }: UseStickToBottomOptions = {}
): {
  onScroll: () => void
  scrollToBottom: (behavior?: ScrollBehavior) => void
} {
  const stickToBottomRef = useRef(true)

  const onScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    stickToBottomRef.current = distanceToBottom <= STICKY_BOTTOM_THRESHOLD_PX
  }, [scrollRef])

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = 'smooth') => {
      const el = scrollRef.current
      if (!el) return
      el.scrollTo({ top: el.scrollHeight, behavior })
      stickToBottomRef.current = true
    },
    [scrollRef]
  )

  useEffect(() => {
    if (!enabled) return
    if (!stickToBottomRef.current) return

    const lastIndex = virtualizer.options.count - 1
    if (lastIndex < 0) return

    // 为什么：流式输出时行高持续变化，先滚到最后一项再 measure，避免底部被输入框遮挡。
    virtualizer.scrollToIndex(lastIndex, { align: 'end', behavior: 'auto' })
    requestAnimationFrame(() => {
      virtualizer.measure()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps 由调用方按业务传入
  }, [enabled, virtualizer, ...deps])

  return { onScroll, scrollToBottom }
}
