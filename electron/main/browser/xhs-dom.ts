import type { Page } from 'playwright'
import {
  humanBezierMoveTo,
  humanBezierScroll,
  humanMicroPause,
  humanStepPause,
  rand,
  sleep
} from './human-behavior'
import { humanClickAt, humanClickLocator, humanClickText, humanMoveTo } from './human-input'

/** 小红书创作台四种发布类型（与顶栏 TAB 一一对应） */
export type XhsPublishType = 'image' | 'video' | 'article' | 'audio'

/** 创作台发布页根路径 */
export const XHS_PUBLISH_BASE_URL =
  'https://creator.xiaohongshu.com/publish/publish'

/**
 * 官方菜单入口（from=menu + target）。
 * 注意：`source=image` 无效；必须用 `target=image|video|article|audio`。
 * @see https://creator.xiaohongshu.com/publish/publish?from=menu&target=image
 */
export const XHS_PUBLISH_URLS: Record<XhsPublishType, string> = {
  video: `${XHS_PUBLISH_BASE_URL}?from=menu&target=video`,
  image: `${XHS_PUBLISH_BASE_URL}?from=menu&target=image`,
  article: `${XHS_PUBLISH_BASE_URL}?from=menu&target=article`,
  audio: `${XHS_PUBLISH_BASE_URL}?from=menu&target=audio`
}

/** @deprecated 请用 queryBuildXhsPublishUrl('image')；保留兼容旧引用 */
export const XHS_PUBLISH_URL = XHS_PUBLISH_URLS.video

/** 图文发布直达入口 */
export const XHS_PUBLISH_IMAGE_URL = XHS_PUBLISH_URLS.image

/** 发布类型中文标签（任务清单 / 日志） */
export const XHS_PUBLISH_TYPE_LABELS: Record<XhsPublishType, string> = {
  image: '上传图文',
  video: '上传视频',
  article: '写长文',
  audio: '发播客'
}

interface TabHit {
  x: number
  y: number
  blocked: boolean
}

interface PublishInvokeResult {
  ok: boolean
  method: string
  error?: string
}

/** 页面信号：用于判定当前是否已在「上传图文」模式 */
export interface XhsPublishModeSignals {
  activeTabText: string
  bodyText: string
  fileAccept: string
}

/**
 * 规范化 TAB 文案后判断是否为「上传图文」。
 * 「写长文」含「文」但不含「图文」，需排除。
 */
export function queryMatchXhsImageTabLabel(text: string): boolean {
  const n = text.replace(/\s+/g, '')
  if (!n) return false
  if (n.includes('长文') || n.includes('视频') || n.includes('播客')) return false
  return n === '上传图文' || n === '图文' || n.includes('上传图文') || n === '图片'
}

/**
 * 将 Agent / 用户传入的发布类型文案规范为 XhsPublishType。
 * 支持：image/video/article/audio 以及 图文/视频/长文/播客 等中文别名。
 */
export function queryNormalizeXhsPublishType(raw: unknown): XhsPublishType | null {
  if (raw == null) return null
  const n = String(raw).trim().toLowerCase().replace(/\s+/g, '')
  if (!n) return null
  if (
    n === 'image' ||
    n === 'img' ||
    n.includes('图文') ||
    n === '图片' ||
    n === 'note'
  ) {
    return 'image'
  }
  if (n === 'video' || n.includes('视频')) return 'video'
  if (
    n === 'article' ||
    n === 'long' ||
    n.includes('长文') ||
    n.includes('文章')
  ) {
    return 'article'
  }
  if (n === 'audio' || n === 'podcast' || n.includes('播客') || n.includes('音频')) {
    return 'audio'
  }
  return null
}

/**
 * Agent 判断发布类型：显式 publishType 优先，其次素材路径，默认图文。
 * - 有 videoPaths → 视频
 * - 有 audioPaths → 播客
 * - 正文很长且无图无视频 → 长文
 * - 其余 → 图文
 */
export function queryInferXhsPublishType(input: {
  publishType?: unknown
  videoPaths?: string[]
  audioPaths?: string[]
  imagePaths?: string[]
  content?: string
}): XhsPublishType {
  const explicit = queryNormalizeXhsPublishType(input.publishType)
  if (explicit) return explicit

  const videos = (input.videoPaths ?? []).filter(Boolean)
  if (videos.length > 0) return 'video'

  const audios = (input.audioPaths ?? []).filter(Boolean)
  if (audios.length > 0) return 'audio'

  const images = (input.imagePaths ?? []).filter(Boolean)
  const contentLen = (input.content ?? '').trim().length
  // 长文入口适合无配图、正文较长的笔记；有图仍走图文
  if (contentLen >= 140 && images.length === 0) return 'article'

  return 'image'
}

/** 按发布类型返回官方直达 URL（from=menu&target=*） */
export function queryBuildXhsPublishUrl(type: XhsPublishType): string {
  return XHS_PUBLISH_URLS[type] ?? XHS_PUBLISH_URLS.image
}

/**
 * 构造图文发布 URL（兼容旧调用）。
 * 始终返回官方菜单图文入口；忽略错误的 source=image。
 */
export function queryBuildXhsPublishImageUrl(_baseUrl?: string): string {
  return XHS_PUBLISH_URLS.image
}

/**
 * 根据激活 TAB / 正文文案 / file accept 判断是否已在图文上传模式。
 * TAB 文案优先；否则看是否像图片上传区而非视频区。
 */
export function queryIsXhsImagePublishModeFromSignals(
  signals: XhsPublishModeSignals
): boolean {
  const tab = (signals.activeTabText || '').replace(/\s+/g, '')
  if (tab) {
    if (queryMatchXhsImageTabLabel(tab)) return true
    if (tab.includes('视频') || tab.includes('长文') || tab.includes('播客')) return false
  }

  const body = signals.bodyText || ''
  const accept = (signals.fileAccept || '').toLowerCase()
  if (/拖拽图片|上传图片/.test(body)) return true
  if (accept.includes('image') && !accept.includes('video')) return true
  if (/拖拽视频|上传视频/.test(body)) return false
  if (accept.includes('video') && !accept.includes('image')) return false
  return false
}

/**
 * 移除创作台常见浮层（d-popover 等），避免挡住 TAB / 发布按钮。
 * 小红书改版后浮层会 intercept pointer events，导致拟人点击无效。
 */
export async function removeXhsPopoverOverlay(page: Page): Promise<void> {
  await page.evaluate(() => {
    document.querySelectorAll('div.d-popover, div.d-modal-mask').forEach((el) => {
      el.remove()
    })
  })
  // 点击页面上方空白区，收起可能残留的 popover
  await humanClickAt(page, 380 + Math.random() * 80, 28 + Math.random() * 40)
  await humanMicroPause()
}

/** 元素中心是否被其它层遮挡（elementFromPoint 检测） */
export async function queryElementBlocked(
  page: Page,
  selector: string
): Promise<boolean> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel) as HTMLElement | null
    if (!el) return true
    const rect = el.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return true
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    const target = document.elementFromPoint(x, y)
    return !(target === el || el.contains(target))
  }, selector)
}

/**
 * 采集发布页模式信号（激活 TAB / 正文 / file accept）。
 * 在页面上下文执行，避免依赖单一 class。
 */
export async function queryXhsPublishModeSignals(page: Page): Promise<XhsPublishModeSignals> {
  return page.evaluate(() => {
    const tabSelectors = [
      'div.creator-tab',
      '[class*="creator-tab"]',
      '[role="tab"]',
      '.header-tabs [class*="tab"]'
    ]
    const tabs: HTMLElement[] = []
    for (const sel of tabSelectors) {
      document.querySelectorAll(sel).forEach((el) => tabs.push(el as HTMLElement))
    }

    let activeTabText = ''
    for (const tab of tabs) {
      const text = (tab.innerText || tab.textContent || '').trim()
      if (!text) continue
      const cls = typeof tab.className === 'string' ? tab.className : ''
      const active =
        /active|selected|current|is-active|tab-active/i.test(cls) ||
        tab.getAttribute('aria-selected') === 'true' ||
        tab.getAttribute('data-active') === 'true'
      if (active) {
        activeTabText = text
        break
      }
    }

    const input = document.querySelector(
      '.upload-input, input[type="file"]'
    ) as HTMLInputElement | null

    return {
      activeTabText,
      bodyText: (document.body?.innerText || '').slice(0, 4000),
      fileAccept: input?.accept || ''
    }
  })
}

/** 当前是否已在「上传图文」模式 */
export async function queryIsXhsImagePublishMode(page: Page): Promise<boolean> {
  const signals = await queryXhsPublishModeSignals(page)
  return queryIsXhsImagePublishModeFromSignals(signals)
}

/** 查找图文 TAB 并返回拟人点击坐标（支持多 selector + 模糊文案） */
async function queryCreatorTabHit(page: Page): Promise<TabHit | null> {
  return page.evaluate(() => {
    const matchLabel = (raw: string): boolean => {
      const n = raw.replace(/\s+/g, '')
      if (!n) return false
      if (n.includes('长文') || n.includes('视频') || n.includes('播客')) return false
      return n === '上传图文' || n === '图文' || n.includes('上传图文') || n === '图片'
    }

    const selectors = [
      'div.creator-tab',
      '[class*="creator-tab"]',
      '[role="tab"]',
      '.header-tabs [class*="tab"]'
    ]
    const seen = new Set<HTMLElement>()
    for (const sel of selectors) {
      const tabs = Array.from(document.querySelectorAll(sel)) as HTMLElement[]
      for (const tab of tabs) {
        if (seen.has(tab)) continue
        seen.add(tab)
        const text = (tab.innerText || tab.textContent || '').trim()
        if (!matchLabel(text)) continue
        const rect = tab.getBoundingClientRect()
        if (rect.width < 2 || rect.height < 2) continue
        const x = rect.left + rect.width / 2
        const y = rect.top + rect.height / 2
        const target = document.elementFromPoint(x, y)
        const blocked = !(target === tab || tab.contains(target))
        return { x, y, blocked }
      }
    }
    return null
  })
}

/** DOM 内直接 click（绕过被遮挡时的坐标点击失败） */
async function postClickXhsImageTabInDom(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const matchLabel = (raw: string): boolean => {
      const n = raw.replace(/\s+/g, '')
      if (!n) return false
      if (n.includes('长文') || n.includes('视频') || n.includes('播客')) return false
      return n === '上传图文' || n === '图文' || n.includes('上传图文') || n === '图片'
    }
    const nodes = Array.from(
      document.querySelectorAll(
        'div.creator-tab, [class*="creator-tab"], [role="tab"], button, span, a, div'
      )
    ) as HTMLElement[]
    for (const el of nodes) {
      const text = (el.innerText || el.textContent || '').trim()
      // 只要叶子级/短文案节点，避免点到整块容器
      if (text.length > 12) continue
      if (!matchLabel(text)) continue
      const rect = el.getBoundingClientRect()
      if (rect.width < 2 || rect.height < 2) continue
      el.click()
      return true
    }
    return false
  })
}

/**
 * 切换到「上传图文」TAB。
 * 策略：已在图文则跳过 → 拟人点 TAB → DOM click → 直达 target=image URL。
 * 每次点击后必须校验模式信号，避免「点了但还在视频页」的假成功。
 */
export async function clickXhsImageTab(page: Page, timeoutMs = 18_000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs

  await page
    .locator('div.upload-content, div.creator-tab, [class*="creator-tab"]')
    .first()
    .waitFor({ state: 'visible', timeout: Math.min(timeoutMs, 12_000) })
    .catch(() => undefined)

  if (await queryIsXhsImagePublishMode(page)) return true

  let navigatedFallback = false

  while (Date.now() < deadline) {
    if (await queryIsXhsImagePublishMode(page)) return true

    await removeXhsPopoverOverlay(page)

    const hit = await queryCreatorTabHit(page)
    if (hit) {
      if (hit.blocked) {
        await removeXhsPopoverOverlay(page)
        await sleep(250)
        // 遮挡时直接走 DOM click
        await postClickXhsImageTabInDom(page)
      } else {
        await humanClickAt(page, hit.x, hit.y)
      }
      await humanStepPause({ min: 700, max: 1600 })
      if (await queryIsXhsImagePublishMode(page)) return true
    } else {
      // 文案 fallback（改版后 class 可能变化）
      await humanClickText(page, ['上传图文', '图文'], { timeoutPer: 1200 })
      await humanStepPause({ min: 500, max: 1200 })
      if (await queryIsXhsImagePublishMode(page)) return true
      await postClickXhsImageTabInDom(page)
      await sleep(600)
      if (await queryIsXhsImagePublishMode(page)) return true
    }

    // TAB 点击无效时，用官方图文入口直达（from=menu&target=image）
    if (!navigatedFallback && Date.now() + 2500 < deadline) {
      navigatedFallback = true
      await page
        .goto(queryBuildXhsPublishUrl('image'), { waitUntil: 'domcontentloaded' })
        .catch(() => undefined)
      await humanStepPause({ min: 1500, max: 3200 })
      if (await queryIsXhsImagePublishMode(page)) return true
    }

    await sleep(280)
  }

  return queryIsXhsImagePublishMode(page)
}

/** 等待 xhs-publish-btn 宿主可点击（submit-disabled=false） */
export async function waitForXhsPublishReady(
  page: Page,
  timeoutMs = 15_000
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const ready = await page.evaluate(() => {
      const widgets = Array.from(document.querySelectorAll('xhs-publish-btn'))
      for (const widget of widgets) {
        if (widget.getAttribute('is-publish') === 'false') continue
        const rect = widget.getBoundingClientRect()
        if (rect.width < 2 || rect.height < 2) continue
        if (widget.getAttribute('submit-disabled') === 'true') return false
        return true
      }
      // 旧版 DOM fallback
      const oldBtn = document.querySelector(
        '.publish-page-publish-btn button.bg-red'
      ) as HTMLButtonElement | null
      if (oldBtn && !oldBtn.disabled) return true
      return false
    })
    if (ready) return true
    await sleep(500)
  }
  return false
}

/**
 * 调用 xhs-publish-btn 宿主上暴露的发布/存草稿方法。
 * closed shadow DOM 内真按钮无法被 Playwright 直接 locator，只能走宿主回调。
 */
export async function invokeXhsPublishAction(
  page: Page,
  mode: 'publish' | 'draft'
): Promise<PublishInvokeResult> {
  return page.evaluate((actionMode) => {
    const widgets = Array.from(document.querySelectorAll('xhs-publish-btn')) as HTMLElement[]
    const publishNames = ['_onPublish', '_onSubmit', 'onPublish', '_handlePublish']
    const draftNames = ['_onSave', '_onSaveDraft', 'onSave', '_handleSave']
    const names = actionMode === 'publish' ? publishNames : draftNames
    const disabledAttr = actionMode === 'publish' ? 'submit-disabled' : 'save-disabled'

    for (const widget of widgets) {
      const rect = widget.getBoundingClientRect()
      if (rect.width < 2 || rect.height < 2) continue
      if (widget.getAttribute('is-publish') === 'false') continue
      if (widget.getAttribute(disabledAttr) === 'true') {
        return { ok: false, method: 'disabled', error: '按钮处于禁用状态' }
      }

      const host = widget as unknown as Record<string, unknown>
      for (const name of names) {
        const fn = host[name]
        if (typeof fn === 'function') {
          try {
            ;(fn as () => void).call(widget)
            return { ok: true, method: name }
          } catch (e) {
            return { ok: false, method: name, error: String(e) }
          }
        }
      }

      // 无暴露方法时，在宿主上派发完整 Pointer 序列（部分版本可触发）
      const types = ['pointerover', 'pointerenter', 'pointerdown', 'pointerup', 'click']
      for (const type of types) {
        widget.dispatchEvent(
          new PointerEvent(type, { bubbles: true, cancelable: true, view: window })
        )
      }
      return { ok: true, method: 'dispatchEvent' }
    }

    return { ok: false, method: 'none', error: '未找到 xhs-publish-btn' }
  }, mode)
}

/** 计算 closed shadow 宿主上「发布」按钮大致坐标（右侧红色按钮区域） */
async function queryXhsPublishClickPoint(page: Page): Promise<{ x: number; y: number } | null> {
  return page.evaluate(() => {
    const widgets = Array.from(document.querySelectorAll('xhs-publish-btn'))
    for (const widget of widgets) {
      if (widget.getAttribute('is-publish') === 'false') continue
      if (widget.getAttribute('submit-disabled') === 'true') continue
      const rect = widget.getBoundingClientRect()
      if (rect.width < 2 || rect.height < 2) continue
      return {
        x: rect.left + rect.width * 0.65,
        y: rect.top + rect.height / 2
      }
    }
    return null
  })
}

/** 点击旧版 .publish-page-publish-btn button.bg-red */
async function clickLegacyPublishButton(page: Page): Promise<boolean> {
  const btn = page.locator('.publish-page-publish-btn button.bg-red').first()
  try {
    if (await btn.isVisible({ timeout: 1200 })) {
      await humanClickLocator(page, btn)
      return true
    }
  } catch {
    // fallback
  }
  return false
}

/**
 * 分段拟人滚到发布条（页面底部「发布」），避免瞬间跳转。
 */
export async function scrollXhsPublishFooterIntoView(page: Page): Promise<void> {
  const rounds = Math.floor(rand(2, 4))
  for (let i = 0; i < rounds; i++) {
    await humanBezierScroll(page, {
      direction: 'down',
      distance: rand(380, 720)
    })
  }

  await page.evaluate(() => {
    const forceBottom = (el: Element | Document): void => {
      const target = el instanceof Document ? el.documentElement : (el as HTMLElement)
      try {
        target.scrollTop = target.scrollHeight
      } catch {
        /* ignore */
      }
    }
    forceBottom(document)
    forceBottom(document.body)
    document.querySelectorAll('[class*="scroll"], [class*="content"], main, [role="main"]').forEach((el) => {
      const h = el as HTMLElement
      if (h.scrollHeight > h.clientHeight + 80) forceBottom(h)
    })
    const widget =
      document.querySelector('xhs-publish-btn') ||
      document.querySelector('.publish-page-publish-btn')
    widget?.scrollIntoView({ block: 'center', inline: 'center' })
  })
  await sleep(rand(280, 520))
  await humanBezierScroll(page, { direction: 'down', distance: rand(120, 280) })
}

/**
 * 滚到底后模拟人类审阅：底栏附近挪鼠标 + 随机停顿约 3.5～9 秒，再点发布。
 */
export async function dwellBeforeXhsPublish(page: Page): Promise<void> {
  const vp = page.viewportSize() ?? { width: 1280, height: 800 }
  await humanBezierMoveTo(page, {
    x: rand(vp.width * 0.55, vp.width * 0.92),
    y: rand(vp.height * 0.75, vp.height * 0.95)
  })
  await sleep(rand(400, 900))

  if (Math.random() < 0.55) {
    await humanBezierScroll(page, {
      direction: Math.random() < 0.4 ? 'up' : 'down',
      distance: rand(50, 140)
    })
    await humanBezierScroll(page, { direction: 'down', distance: rand(70, 180) })
  }

  await humanStepPause({ min: 3500, max: 9000 })

  await humanBezierMoveTo(page, {
    x: rand(vp.width * 0.7, vp.width * 0.96),
    y: rand(vp.height * 0.8, vp.height * 0.97)
  })
  await sleep(rand(350, 800))
}

/**
 * 点击「发布」：拟人滚到底 → 停留确认 → 再 invoke / 坐标点击 / 旧版按钮。
 */
export async function clickXhsPublishButton(page: Page): Promise<boolean> {
  await removeXhsPopoverOverlay(page)

  const ready = await waitForXhsPublishReady(page)
  if (!ready) return false

  await scrollXhsPublishFooterIntoView(page)
  await dwellBeforeXhsPublish(page)
  await removeXhsPopoverOverlay(page)

  const invoked = await invokeXhsPublishAction(page, 'publish')
  if (invoked.ok) {
    await sleep(rand(500, 900))
    if (await clickXhsConfirmDialog(page)) return true
    // 部分版本 invoke 后无跳转，继续坐标兜底
  }

  const point = await queryXhsPublishClickPoint(page)
  if (point) {
    await humanClickAt(page, point.x, point.y)
    await sleep(rand(500, 900))
    if (await clickXhsConfirmDialog(page)) return true
    return true
  }

  if (await clickLegacyPublishButton(page)) {
    await clickXhsConfirmDialog(page)
    return true
  }

  return false
}

/** 二次确认弹窗（部分账号发布前会弹出） */
export async function clickXhsConfirmDialog(page: Page): Promise<boolean> {
  const texts = ['确认发布', '发布', '确定']
  for (const text of texts) {
    try {
      const btn = page.getByRole('button', { name: text }).first()
      if (await btn.isVisible({ timeout: 800 })) {
        await humanClickLocator(page, btn, { timeout: 3000 })
        await sleep(800)
        return true
      }
    } catch {
      // next
    }
  }
  return false
}

/**
 * 逐张上传图片：首张用 .upload-input，后续用 input[type=file]。
 */
export async function uploadXhsImages(page: Page, imagePaths: string[]): Promise<void> {
  for (let i = 0; i < imagePaths.length; i++) {
    const selector = i === 0 ? '.upload-input, input[type="file"]' : 'input[type="file"]'
    const input = page.locator(selector).first()
    await input.waitFor({ state: 'attached', timeout: 15_000 })
    await input.setInputFiles(imagePaths[i])
    await humanStepPause({ min: i === 0 ? 1200 : 900, max: i === 0 ? 2800 : 2200 })
    // 等待预览数量达到 i+1
    await page
      .locator('.img-preview-area .pr')
      .nth(i)
      .waitFor({ state: 'attached', timeout: 60_000 })
      .catch(() => sleep(2000))
  }
}

/**
 * 上传视频 / 播客等媒体文件（单文件或少量文件）。
 * 创作台通常用同一个 hidden file input，accept 随 target 变化。
 */
export async function uploadXhsMediaFiles(page: Page, mediaPaths: string[]): Promise<void> {
  if (!mediaPaths.length) return
  const input = page.locator('.upload-input, input[type="file"]').first()
  await input.waitFor({ state: 'attached', timeout: 15_000 })
  // 多文件一次传入（若 input 支持 multiple）；否则至少传首个
  try {
    await input.setInputFiles(mediaPaths)
  } catch {
    await input.setInputFiles(mediaPaths[0])
  }
  await humanStepPause({ min: 2000, max: 4500 })
}

/**
 * 长文入口：若停在「写长文」落地页，点击「新的创作」进入编辑器。
 */
export async function ensureXhsArticleEditor(page: Page): Promise<boolean> {
  const editor = page.locator('[contenteditable="true"], textarea, input[placeholder*="标题"]').first()
  if (await editor.isVisible({ timeout: 1500 }).catch(() => false)) return true

  const clicked = await humanClickText(page, ['新的创作', '开始创作', '写长文'], {
    timeoutPer: 2000
  })
  if (clicked) {
    await humanStepPause({ min: 1200, max: 2500 })
  }
  return editor.isVisible({ timeout: 5000 }).catch(() => false)
}

/** 键盘 Tab 聚焦到发布按钮后 Enter（绕过 closed shadow 的兜底方案） */
export async function keyboardSubmitXhsPublish(page: Page): Promise<boolean> {
  const widget = page.locator('xhs-publish-btn').first()
  try {
    if (!(await widget.isVisible({ timeout: 2000 }))) return false
    const box = await widget.boundingBox()
    if (!box) return false
    // 点宿主左缘获取焦点，避免误触内部按钮
    await humanMoveTo(page, { x: box.x + 4, y: box.y + box.height / 2 })
    await page.mouse.click(box.x + 4, box.y + box.height / 2)
    await sleep(200)
    // 暂存离开 → 发布
    await page.keyboard.press('Tab')
    await sleep(120)
    await page.keyboard.press('Tab')
    await sleep(120)
    await page.keyboard.press('Enter')
    await sleep(500)
    return true
  } catch {
    return false
  }
}
