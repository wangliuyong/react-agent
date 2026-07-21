import { useCallback, useEffect, useState, type RefObject } from 'react'
import { appMessage } from '@/lib/app-message'

/**
 * 对任意 DOM 元素封装浏览器 Fullscreen API。
 * 以 `document.fullscreenElement === targetRef.current` 判定是否处于本目标的全屏态。
 */
export function useElementFullscreen(targetRef: RefObject<HTMLElement | null>): {
  isFullscreen: boolean
  toggleFullscreen: () => Promise<void>
  exitFullscreen: () => Promise<void>
} {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const syncFullscreenState = useCallback((): void => {
    setIsFullscreen(document.fullscreenElement === targetRef.current)
  }, [targetRef])

  useEffect(() => {
    document.addEventListener('fullscreenchange', syncFullscreenState)
    syncFullscreenState()
    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreenState)
      if (document.fullscreenElement === targetRef.current) {
        void document.exitFullscreen().catch(() => {
          /* 卸载收尾失败忽略 */
        })
      }
    }
  }, [syncFullscreenState, targetRef])

  const exitFullscreen = useCallback(async (): Promise<void> => {
    if (!document.fullscreenElement) return
    if (typeof document.exitFullscreen !== 'function') {
      appMessage.warning('当前环境不支持退出全屏')
      return
    }
    try {
      await document.exitFullscreen()
    } catch {
      appMessage.warning('退出全屏失败')
    }
  }, [])

  const toggleFullscreen = useCallback(async (): Promise<void> => {
    const el = targetRef.current
    if (!el) {
      appMessage.warning('全屏目标未就绪')
      return
    }
    if (document.fullscreenElement === el) {
      await exitFullscreen()
      return
    }
    if (typeof el.requestFullscreen !== 'function') {
      appMessage.warning('当前环境不支持全屏')
      return
    }
    try {
      await el.requestFullscreen()
    } catch {
      appMessage.warning('无法进入全屏，请检查系统或浏览器权限')
    }
  }, [targetRef, exitFullscreen])

  return { isFullscreen, toggleFullscreen, exitFullscreen }
}
