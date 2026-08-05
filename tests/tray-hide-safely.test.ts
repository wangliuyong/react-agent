import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { BrowserWindow } from 'electron'

vi.mock('electron', () => ({
  Tray: class {},
  Menu: { buildFromTemplate: () => ({}) },
  nativeImage: {
    createEmpty: () => ({ isEmpty: () => true }),
    createFromPath: () => ({ isEmpty: () => true, resize: () => ({ isEmpty: () => true }) })
  },
  app: { dock: { show: vi.fn() }, quit: vi.fn() }
}))

vi.mock('../electron/main/window', () => ({
  getMainWindow: () => null
}))

vi.mock('../electron/main/store/settings', () => ({
  querySettings: () => ({ closeToTray: true })
}))

import { postHideWindowSafely } from '../electron/main/tray'

/** 构造可监听 leave-full-screen 的假窗口 */
function createFakeWindow(overrides: Partial<{
  destroyed: boolean
  fullScreen: boolean
}> = {}): BrowserWindow & {
  emitLeaveFullScreen: () => void
  hide: ReturnType<typeof vi.fn>
  setFullScreen: ReturnType<typeof vi.fn>
} {
  const listeners = new Map<string, Array<() => void>>()
  const win = {
    destroyed: overrides.destroyed ?? false,
    fullScreen: overrides.fullScreen ?? false,
    isDestroyed: () => win.destroyed,
    isFullScreen: () => win.fullScreen,
    hide: vi.fn(),
    setFullScreen: vi.fn((value: boolean) => {
      win.fullScreen = value
    }),
    once: (event: string, cb: () => void) => {
      const list = listeners.get(event) ?? []
      list.push(cb)
      listeners.set(event, list)
    },
    emitLeaveFullScreen: () => {
      for (const cb of listeners.get('leave-full-screen') ?? []) cb()
    }
  }
  return win as unknown as BrowserWindow & {
    emitLeaveFullScreen: () => void
    hide: ReturnType<typeof vi.fn>
    setFullScreen: ReturnType<typeof vi.fn>
  }
}

describe('postHideWindowSafely', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('非全屏时直接 hide', () => {
    const win = createFakeWindow({ fullScreen: false })
    postHideWindowSafely(win)
    expect(win.hide).toHaveBeenCalledTimes(1)
    expect(win.setFullScreen).not.toHaveBeenCalled()
  })

  it('全屏时先退出全屏，leave-full-screen 后再 hide，避免 macOS 黑屏', () => {
    const win = createFakeWindow({ fullScreen: true })
    postHideWindowSafely(win)

    expect(win.setFullScreen).toHaveBeenCalledWith(false)
    expect(win.hide).not.toHaveBeenCalled()

    win.emitLeaveFullScreen()
    expect(win.hide).toHaveBeenCalledTimes(1)
  })

  it('已销毁窗口不操作', () => {
    const win = createFakeWindow({ destroyed: true, fullScreen: true })
    postHideWindowSafely(win)
    expect(win.hide).not.toHaveBeenCalled()
    expect(win.setFullScreen).not.toHaveBeenCalled()
  })
})
