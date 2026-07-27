import type { BrowserContext } from 'playwright'

/** 拟人发布有头窗口随机分辨率，避免长期固定 viewport */
export const HEADED_VIEWPORTS = [
  { width: 1920, height: 1080 },
  { width: 1536, height: 864 },
  { width: 1440, height: 900 }
] as const

/** Playwright / Chrome 启动时需剔除的默认自动化开关 */
export const CHROMIUM_STEALTH_IGNORE_DEFAULT_ARGS = ['--enable-automation'] as const

/** 与 ignoreDefaultArgs 配合，进一步压低 Chromium 自动化特征 */
export const CHROMIUM_STEALTH_LAUNCH_ARGS = [
  '--disable-blink-features=AutomationControlled',
  '--no-first-run',
  '--no-default-browser-check'
] as const

export function queryRandomHeadedViewport(): { width: number; height: number } {
  const list = HEADED_VIEWPORTS
  return list[Math.floor(Math.random() * list.length)]
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
