import { useCallback, useEffect, useRef, type RefObject } from 'react'

/** 距底部多少像素内视为「贴底」，新内容到达时自动滚动 */
const STICKY_BOTTOM_THRESHOLD_PX = 96

interface UseElementStickToBottomOptions {
  /** 是否启用贴底跟随 */
  enabled?: boolean
  /** 内容变化时触发滚动的依赖 */
  deps?: unknown[]
}

/**
 * 普通 DOM 滚动容器专用：用户上滑阅读历史时不抢滚动，回到底部附近后再自动跟随新消息。
 * 流式输出时使用 instant 滚动，避免多个 smooth 动画互相抢占导致抖动。
 */
export function useElementStickToBottom<TScrollElement extends HTMLElement>(
  scrollRef: RefObject<TScrollElement | null>,
  { enabled = true, deps = [] }: UseElementStickToBottomOptions = {}
): { onScroll: () => void } {
  const stickToBottomRef = useRef(true)

  const onScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    stickToBottomRef.current = distanceToBottom <= STICKY_BOTTOM_THRESHOLD_PX
  }, [scrollRef])

  useEffect(() => {
    if (!enabled) return
    if (!stickToBottomRef.current) return

    const el = scrollRef.current
    if (!el) return

    // 为什么：流式输出时行高持续变化，smooth 会与上一次动画叠加产生抖动，instant 更稳定。
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps 由调用方按业务传入
  }, [enabled, scrollRef, ...deps])

  return { onScroll }
}
