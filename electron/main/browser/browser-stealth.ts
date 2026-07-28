import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { BrowserContext } from 'playwright'

/**
 * 有头浏览器窗口尺寸策略：
 * - 运行期禁止改窗：viewport 必须为 null（否则新 tab 会 setWindowBounds）
 * - 仅当 Chromium profile 残留「异常小」window_placement 时，启动前校正一次
 */
export const CHROMIUM_STEALTH_IGNORE_DEFAULT_ARGS = ['--enable-automation'] as const

export const CHROMIUM_STEALTH_LAUNCH_ARGS = [
  '--disable-blink-features=AutomationControlled',
  '--no-first-run',
  '--no-default-browser-check'
] as const

/** 相对工作区宽或高低于该比例，视为异常小窗口（需启动前校正） */
export const HEADED_WINDOW_TOO_SMALL_RATIO = 0.6

/** @deprecated 有头模式不使用强制 viewport 列表 */
export const HEADED_VIEWPORTS = [] as const

export type HeadedWindowPlacement = {
  left: number
  top: number
  right: number
  bottom: number
  maximized: boolean
  work_area_left: number
  work_area_top: number
  work_area_right: number
  work_area_bottom: number
}

export type HeadedWorkArea = {
  x: number
  y: number
  width: number
  height: number
}

/** 判断 profile 里的窗口外框是否异常偏小 */
export function queryIsHeadedWindowPlacementTooSmall(
  placement: Pick<HeadedWindowPlacement, 'left' | 'top' | 'right' | 'bottom'>,
  workArea: HeadedWorkArea
): boolean {
  const width = Math.max(0, placement.right - placement.left)
  const height = Math.max(0, placement.bottom - placement.top)
  if (workArea.width <= 0 || workArea.height <= 0) return false
  return (
    width < workArea.width * HEADED_WINDOW_TOO_SMALL_RATIO ||
    height < workArea.height * HEADED_WINDOW_TOO_SMALL_RATIO
  )
}

/** 生成贴合工作区的正常 window_placement（不进 macOS 系统全屏） */
export function queryNormalHeadedWindowPlacement(workArea: HeadedWorkArea): HeadedWindowPlacement {
  const left = workArea.x
  const top = workArea.y
  const right = workArea.x + workArea.width
  const bottom = workArea.y + workArea.height
  return {
    left,
    top,
    right,
    bottom,
    maximized: false,
    work_area_left: left,
    work_area_top: top,
    work_area_right: right,
    work_area_bottom: bottom
  }
}

/**
 * 启动前：若 Default/Preferences 中 window_placement 异常偏小，则改写为工作区大小。
 * @returns 是否发生了校正
 */
export function postResetHeadedWindowPlacementIfTooSmall(
  profileDir: string,
  workArea: HeadedWorkArea
): boolean {
  const prefsPath = join(profileDir, 'Default', 'Preferences')
  if (!existsSync(prefsPath)) return false

  let data: Record<string, unknown>
  try {
    data = JSON.parse(readFileSync(prefsPath, 'utf8')) as Record<string, unknown>
  } catch {
    return false
  }

  const browser = (data.browser ?? {}) as Record<string, unknown>
  const placement = browser.window_placement as HeadedWindowPlacement | undefined
  if (
    placement &&
    typeof placement.left === 'number' &&
    typeof placement.top === 'number' &&
    typeof placement.right === 'number' &&
    typeof placement.bottom === 'number' &&
    !queryIsHeadedWindowPlacementTooSmall(placement, workArea)
  ) {
    return false
  }

  browser.window_placement = queryNormalHeadedWindowPlacement(workArea)
  data.browser = browser
  writeFileSync(prefsPath, JSON.stringify(data))
  return true
}

/** @deprecated 运行期禁止改窗 */
export function queryHeadedWindowLaunchArgs(_workArea?: {
  width: number
  height: number
}): string[] {
  return []
}

/** @deprecated 有头模式禁止强制 viewport */
export function queryHeadedViewport(_workArea?: {
  width: number
  height: number
}): { width: number; height: number } | null {
  return null
}

/** @deprecated 同 queryHeadedViewport */
export function queryRandomHeadedViewport(_workArea?: {
  width: number
  height: number
}): { width: number; height: number } | null {
  return null
}

/**
 * 在页面任意脚本执行前注入的反检测逻辑（Playwright addInitScript）。
 * 注意：勿删除 __playwright* 等运行时绑定，否则 CDP/输入会失效。
 */
function installStealthInPage(): void {
  const maskWebdriver = (): void => {
    try {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
        configurable: true
      })
    } catch {
      // ignore
    }
    try {
      const navProto = Object.getPrototypeOf(navigator) as Navigator & { webdriver?: unknown }
      if ('webdriver' in navProto) {
        Object.defineProperty(navProto, 'webdriver', {
          get: () => undefined,
          configurable: true
        })
      }
    } catch {
      // ignore
    }
  }

  /**
   * 清理 ChromeDriver / 旧版 Selenium 在 window、document 上挂的 cdc_ 等全局变量。
   * Playwright 自身特征不在此列，避免误删导致崩溃。
   */
  const purgeLegacyAutomationGlobals = (): void => {
    const suspicious =
      /^(cdc_|\$cdc_|__webdriver|__driver|__selenium|__fxdriver|__phantom|__nightmare|_Selenium|_WEBDRIVER|calledSelenium|webdriverAsyncExecutor)/i

    const scrub = (obj: object): void => {
      let names: string[] = []
      try {
        names = Object.getOwnPropertyNames(obj)
      } catch {
        return
      }
      for (const key of names) {
        if (!suspicious.test(key)) continue
        try {
          delete (obj as Record<string, unknown>)[key]
        } catch {
          try {
            Object.defineProperty(obj, key, {
              get: () => undefined,
              configurable: true
            })
          } catch {
            // ignore
          }
        }
      }
    }

    scrub(window)
    scrub(document)
  }

  /** 补齐真实 Chrome 常见的 window.chrome，避免「无 chrome 对象」判定 */
  const patchChromeRuntime = (): void => {
    const w = window as Window & { chrome?: { runtime?: Record<string, unknown> } }
    if (!w.chrome) {
      w.chrome = { runtime: {} }
    } else if (!w.chrome.runtime) {
      w.chrome.runtime = {}
    }
  }

  /** 统一 languages，与 launch locale=zh-CN 对齐 */
  const patchNavigatorLocales = (): void => {
    try {
      Object.defineProperty(navigator, 'languages', {
        get: () => ['zh-CN', 'zh', 'en-US', 'en'],
        configurable: true
      })
      Object.defineProperty(navigator, 'language', {
        get: () => 'zh-CN',
        configurable: true
      })
    } catch {
      // ignore
    }
  }

  /**
   * permissions.query 在自动化环境下 notifications 常异常；
   * 对齐 Notification.permission，减少「非真人浏览器」启发式命中。
   */
  const patchPermissionsQuery = (): void => {
    const original = navigator.permissions?.query?.bind(navigator.permissions)
    if (!original) return
    navigator.permissions.query = (parameters: PermissionDescriptor) => {
      if (parameters.name === 'notifications') {
        return Promise.resolve({
          state: Notification.permission,
          onchange: null
        } as PermissionStatus)
      }
      return original(parameters)
    }
  }

  /** 轻量 Canvas 扰动，避免长期固定 toDataURL 指纹 */
  const patchCanvas = (): void => {
    const proto = HTMLCanvasElement.prototype
    const original = proto.toDataURL
    proto.toDataURL = function toDataURL(...args: Parameters<typeof original>) {
      const ctx = this.getContext('2d')
      if (ctx) {
        const noise = (Math.random() - 0.5) * 0.4
        ctx.fillStyle = `rgba(0,0,0,${Math.abs(noise) / 1000})`
        ctx.fillRect(0, 0, 1, 1)
      }
      return original.apply(this, args)
    }
  }

  maskWebdriver()
  purgeLegacyAutomationGlobals()
  patchChromeRuntime()
  patchNavigatorLocales()
  patchPermissionsQuery()
  patchCanvas()

  // 部分站点在后续脚本里再次写入 webdriver / cdc_，轮询一次早期清理
  window.setTimeout(() => {
    maskWebdriver()
    purgeLegacyAutomationGlobals()
  }, 0)
}

/**
 * 注入反自动化检测脚本。
 * 须在 context 创建后、首个页面导航前调用（service 已满足）。
 */
export async function postApplyBrowserStealthScripts(context: BrowserContext): Promise<void> {
  await context.addInitScript(installStealthInPage)
}
