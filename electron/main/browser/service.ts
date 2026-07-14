import { chromium, type BrowserContext, type Page } from 'playwright'
import { getBrowserProfileDir } from '../store/paths'
import { getMainWindow } from '../window'
import type { BrowserStatus } from '../../../shared/types'
import { isProfileLockError, releaseBrowserProfileLock } from './profile-lock'
import { humanClickLocator, humanClickText, humanTypeInto, humanUploadFiles } from './human-input'

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

/**
 * Playwright 持久化浏览器服务。
 * - 使用 userDataDir 复用小红书/抖音登录 Cookie
 * - 启动前自动清理 SingletonLock / 残留 Chrome for Testing
 * - 有头窗口供用户直接查看；不再定时截帧（会触发窗口闪烁）
 */
class BrowserService {
  private context: BrowserContext | null = null
  private page: Page | null = null
  private lastUrl = ''
  private lastTitle = ''
  private starting: Promise<Page> | null = null

  async ensureStarted(): Promise<Page> {
    if (this.page && !this.page.isClosed()) {
      return this.page
    }
    // 并发 ensureStarted 共用同一次启动，避免双开抢锁
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
        // 每次尝试前释放 profile 锁（含残留进程）
        releaseBrowserProfileLock()
        await sleep(attempt === 1 ? 200 : 600)

        const profile = getBrowserProfileDir()
        this.context = await chromium.launchPersistentContext(profile, {
          headless: false,
          viewport: { width: 1280, height: 800 },
          locale: 'zh-CN',
          args: [
            '--disable-blink-features=AutomationControlled',
            // 降低「接管已有会话」概率
            '--no-first-run',
            '--no-default-browser-check'
          ]
        })

        // 启动后立刻校验 context 仍存活（锁冲突时会马上被关掉）
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
          `[browser] launch attempt ${attempt}/${maxAttempts} failed (profile lock?), retrying…`,
          err instanceof Error ? err.message : err
        )
        releaseBrowserProfileLock()
        await sleep(800 * attempt)
      }
    }
    throw lastError instanceof Error
      ? lastError
      : new Error(String(lastError ?? '浏览器启动失败'))
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

  async clearProfileAndRestart(): Promise<void> {
    await this.close()
    releaseBrowserProfileLock()
  }

  async close(): Promise<void> {
    if (this.context) {
      await this.context.close().catch(() => undefined)
    }
    this.context = null
    this.page = null
    // 关闭后顺手清锁，避免异常退出留下 SingletonLock
    releaseBrowserProfileLock()
  }
}

let singleton: BrowserService | null = null

export function getBrowserService(): BrowserService {
  if (!singleton) singleton = new BrowserService()
  return singleton
}
