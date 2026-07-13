import { useEffect } from 'react'

interface UseNewChatShortcutOptions {
  onCreate: () => void
}

/** 检测是否为 macOS，用于展示与监听平台相关快捷键 */
function queryIsMacPlatform(): boolean {
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform)
}

/** 新对话快捷键文案：macOS 为 ⇧⌘K，其他平台为 Shift+Ctrl+K */
export function queryNewChatShortcutLabel(): string {
  return queryIsMacPlatform() ? '⇧⌘K' : 'Shift+Ctrl+K'
}

/**
 * 全局新对话快捷键：Shift+Cmd+K（mac）/ Shift+Ctrl+K（Win）
 * 与豆包侧边栏「新对话」入口行为一致。
 */
export function useNewChatShortcut({ onCreate }: UseNewChatShortcutOptions): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      const modifier = queryIsMacPlatform() ? event.metaKey : event.ctrlKey
      if (event.shiftKey && modifier && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        onCreate()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCreate])
}
