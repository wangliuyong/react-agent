import { chromium, type BrowserContext, type Page } from 'playwright'
import { getBrowserProfileDir, getHeadlessBrowserProfileDir } from '../store/paths'
import { getMainWindow } from '../window'
import type { BrowserStatus } from '../../../shared/types'
import { isProfileLockError, releaseBrowserProfileLock } from './profile-lock'
import { humanClickLocator, humanClickText, humanTypeInto, humanUploadFiles } from './human-input'

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

/** 有头=拟人发布/登录；无头=后台数据抓取（不弹窗） */
export type BrowserLaunchMode = 'headed' | 'headless'

/**
 * 单个 Playwright 持久化上下文封装。
 * headed / headless 各持一份，避免抢同一 profile 锁。
 */
class BrowserContextSlot {
  private context: BrowserContext | null = null
  private page: Page | null = null
  private lastUrl = ''
  private lastTitle = ''
  private starting: Promise<Page> | null = null

  constructor(
    private readonly mode: BrowserLaunchMode,
    private readonly profileDir: string,
    private readonly notifyOpen: boolean
  ) {}

  async ensureStarted(): Promise<Page> {
    if (this.page && !this.page.isClosed()) {
      return this.page
    }
    if (this.starting) {
      return this.starting
    }
    this.starting = this.launchWithRetry().finally(() => {
      this.starting = null
    })
    return this.starting
  }

  private async launchWithRetry(maxAttempts = 3): Promise<Page> {
    let lastError: unknown
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.close()
        releaseBrowserProfileLock(this.profileDir)
        await sleep(attempt === 1 ? 200 : 600)

        this.context = await chromium.launchPersistentContext(this.profileDir, {
          headless: this.mode === 'headless',
          viewport: { width: 1280, height: 800 },
          locale: 'zh-CN',
          args: [
            '--disable-blink-features=AutomationControlled',
            '--no-first-run',
            '--no-default-browser-check'
          ]
        })

        const pages = this.context.pages()
        this.page = pages[0] ?? (await this.context.newPage())
        if (this.page.isClosed()) {
          throw new Error('Target page, context or browser has been closed')
        }

        this.page.on('framenavigated', async () => {
          try {
            this.lastUrl = this.page?.url() ?? ''
            this.lastTitle = (await this.page?.title()) ?? ''
          } catch {
            // ignore
          }
        })

        this.context.on('close', () => {
          this.context = null
          this.page = null
        })

        return this.page
      } catch (err) {
        lastError = err
        this.context = null
        this.page = null
        if (!isProfileLockError(err) || attempt === maxAttempts) {
          break
        }
        console.warn(
          `[browser:${this.mode}] launch attempt ${attempt}/${maxAttempts} failed, retrying…`,
          err instanceof Error ? err.message : err
        )
        releaseBrowserProfileLock(this.profileDir)
        await sleep(800 * attempt)
      }
    }
    throw lastError instanceof Error
      ? lastError
      : new Error(String(lastError ?? `浏览器启动失败(${this.mode})`))
  }

  async navigate(url: string): Promise<void> {
    const page = await this.ensureStarted()
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 })
    this.lastUrl = page.url()
    try {
      this.lastTitle = await page.title()
    } catch {
      // ignore
    }
    // 无头抓取不向 UI 推 browser_open，避免误导用户「弹出了浏览器」
    if (!this.notifyOpen) return
    const win = getMainWindow()
    if (win && !win.isDestroyed()) {
      win.webContents.send('event:agent', {
        type: 'browser_open',
        sessionId: '',
        url
      })
    }
  }

  async snapshot(maxLength = 12000): Promise<string> {
    const page = await this.ensureStarted()
    const snapshot = await page.locator('body').ariaSnapshot().catch(async () => {
      const text = await page.innerText('body')
      return text
    })
    const text = typeof snapshot === 'string' ? snapshot : String(snapshot)
    return text.length > maxLength ? text.slice(0, maxLength) + '\n...[截断]' : text
  }

  async click(opts: { selector?: string; text?: string }): Promise<void> {
    const page = await this.ensureStarted()
    if (opts.selector) {
      await humanClickLocator(page, page.locator(opts.selector).first())
      return
    }
    if (opts.text) {
      const ok = await humanClickText(page, [opts.text])
      if (!ok) throw new Error(`未找到可点击文本: ${opts.text}`)
      return
    }
    throw new Error('browser_click 需要 selector 或 text')
  }

  async type(opts: { selector?: string; text: string; clear?: boolean }): Promise<void> {
    const page = await this.ensureStarted()
    const locator = opts.selector
      ? page.locator(opts.selector).first()
      : page.locator('textarea:visible, input:visible, [contenteditable=true]:visible').first()
    await humanTypeInto(page, locator, opts.text, { clear: opts.clear !== false })
  }

  async upload(opts: { selector?: string; paths: string[] }): Promise<void> {
    const page = await this.ensureStarted()
    await humanUploadFiles(page, opts.paths, {
      fileInputSelector: opts.selector
    })
  }

  async wait(opts: { ms?: number; selector?: string }): Promise<void> {
    const page = await this.ensureStarted()
    if (opts.selector) {
      await page.locator(opts.selector).first().waitFor({ state: 'visible', timeout: 60_000 })
    }
    if (opts.ms) {
      await page.waitForTimeout(opts.ms)
    }
    if (!opts.selector && !opts.ms) {
      await page.waitForTimeout(1000)
    }
  }

  /**
   * 无头模式下从页面提取纯文本（数据兜底用）。
   * 可选 CSS 选择器缩小范围。
   */
  async extractText(opts?: { selector?: string; maxLength?: number }): Promise<string> {
    const page = await this.ensureStarted()
    const maxLength = opts?.maxLength ?? 20_000
    const locator = opts?.selector
      ? page.locator(opts.selector).first()
      : page.locator('body')
    const text = await locator.innerText().catch(() => '')
    return text.length > maxLength ? text.slice(0, maxLength) + '\n...[截断]' : text
  }

  getPage(): Page | null {
    return this.page
  }

  getStatus(): BrowserStatus {
    return {
      running: Boolean(this.page && !this.page.isClosed()),
      url: this.lastUrl,
      title: this.lastTitle
    }
  }

  async close(): Promise<void> {
    if (this.context) {
      await this.context.close().catch(() => undefined)
    }
    this.context = null
    this.page = null
    releaseBrowserProfileLock(this.profileDir)
  }
}

/**
 * Playwright 浏览器服务（有头 + 无头双上下文）。
 * - headed：拟人发布/登录，复用 Cookie profile
 * - headless：后台数据抓取，独立 profile，不弹窗
 */
class BrowserService {
  private readonly headed = new BrowserContextSlot(
    'headed',
    getBrowserProfileDir(),
    true
  )
  private readonly headless = new BrowserContextSlot(
    'headless',
    getHeadlessBrowserProfileDir(),
    false
  )

  private slot(mode: BrowserLaunchMode = 'headed'): BrowserContextSlot {
    return mode === 'headless' ? this.headless : this.headed
  }

  /** 默认有头；数据兜底传 headless */
  async ensureStarted(mode: BrowserLaunchMode = 'headed'): Promise<Page> {
    return this.slot(mode).ensureStarted()
  }

  async navigate(url: string, mode: BrowserLaunchMode = 'headed'): Promise<void> {
    return this.slot(mode).navigate(url)
  }

  async snapshot(maxLength = 12000, mode: BrowserLaunchMode = 'headed'): Promise<string> {
    return this.slot(mode).snapshot(maxLength)
  }

  async click(
    opts: { selector?: string; text?: string },
    mode: BrowserLaunchMode = 'headed'
  ): Promise<void> {
    return this.slot(mode).click(opts)
  }

  async type(
    opts: { selector?: string; text: string; clear?: boolean },
    mode: BrowserLaunchMode = 'headed'
  ): Promise<void> {
    return this.slot(mode).type(opts)
  }

  async upload(
    opts: { selector?: string; paths: string[] },
    mode: BrowserLaunchMode = 'headed'
  ): Promise<void> {
    return this.slot(mode).upload(opts)
  }

  async wait(
    opts: { ms?: number; selector?: string },
    mode: BrowserLaunchMode = 'headed'
  ): Promise<void> {
    return this.slot(mode).wait(opts)
  }

  async extractText(
    opts?: { selector?: string; maxLength?: number },
    mode: BrowserLaunchMode = 'headless'
  ): Promise<string> {
    return this.slot(mode).extractText(opts)
  }

  getPage(mode: BrowserLaunchMode = 'headed'): Page | null {
    return this.slot(mode).getPage()
  }

  /** UI 状态仅反映有头浏览器（用户可见的智能体浏览器） */
  getStatus(): BrowserStatus {
    return this.headed.getStatus()
  }

  async clearProfileAndRestart(): Promise<void> {
    await this.close()
    releaseBrowserProfileLock(getBrowserProfileDir())
    releaseBrowserProfileLock(getHeadlessBrowserProfileDir())
  }

  async close(): Promise<void> {
    await Promise.all([this.headed.close(), this.headless.close()])
  }
}

let singleton: BrowserService | null = null

export function getBrowserService(): BrowserService {
  if (!singleton) singleton = new BrowserService()
  return singleton
}
