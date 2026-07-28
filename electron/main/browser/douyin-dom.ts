import type { Page } from 'playwright'
import {
  humanBezierMoveTo,
  humanBezierScroll,
  humanGaussianPause,
  humanStepPause,
  rand,
  sleep
} from './human-behavior'
import { humanClickLocator, humanDropLocalFiles } from './human-input'

/** 抖音创作者中心 - 内容上传页 */
export const DOUYIN_PUBLISH_URL =
  'https://creator.douyin.com/creator-micro/content/upload'

/** 抖音图文作品标题硬上限（创作者中心限制） */
export const DOUYIN_TITLE_MAX_LENGTH = 20

/** 页面上回读到的标题 / 作品描述草稿 */
export interface DouyinFilledDraft {
  title: string
  content: string
}

/** 填写内容校验结果 */
export interface DouyinFillVerifyResult {
  ok: boolean
  title: string
  content: string
  /** 未通过时的可读原因（如「标题未写入」「正文缺字」） */
  issues: string[]
}

/**
 * 归一化文案再比对：去掉首尾空白、折叠连续空白、统一换行。
 * 抖音编辑器偶发插入零宽字符 / 多余空格，归一化后更稳。
 */
export function queryNormalizeDouyinDraftText(raw: string): string {
  return String(raw ?? '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * 判断「期望文案」是否已出现在页面回读值中。
 * 允许页面多出前后缀（如话题标签），但核心正文必须覆盖期望内容的主要片段。
 */
export function queryDouyinTextLooksFilled(expected: string, actual: string): boolean {
  const exp = queryNormalizeDouyinDraftText(expected)
  const act = queryNormalizeDouyinDraftText(actual)
  if (!exp) return true
  if (!act) return false
  if (act.includes(exp) || exp.includes(act)) return true

  // 长文按句/行抽样：至少一半非空片段出现在回读结果里
  const chunks = exp
    .split(/[\n。！？!?；;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 4)
  if (chunks.length === 0) {
    // 短文：要求回读覆盖期望长度的 70% 以上公共前缀/子串
    const minLen = Math.max(2, Math.floor(exp.length * 0.7))
    return act.includes(exp.slice(0, minLen))
  }
  const hit = chunks.filter((c) => act.includes(c)).length
  return hit >= Math.ceil(chunks.length * 0.5)
}

/**
 * 对比「计划填写」与「页面回读」是否一致。
 * titleFilledSeparately：标题是否写入独立标题框（否则标题可能并入描述区）。
 */
export function queryVerifyDouyinFilledDraft(params: {
  expectedTitle: string
  expectedContent: string
  actual: DouyinFilledDraft
  titleFilledSeparately: boolean
}): DouyinFillVerifyResult {
  const expectedTitle = queryNormalizeDouyinDraftText(params.expectedTitle).slice(
    0,
    DOUYIN_TITLE_MAX_LENGTH
  )
  const expectedContent = queryNormalizeDouyinDraftText(params.expectedContent)
  const title = queryNormalizeDouyinDraftText(params.actual.title)
  const content = queryNormalizeDouyinDraftText(params.actual.content)
  const issues: string[] = []

  if (params.titleFilledSeparately && expectedTitle) {
    if (!queryDouyinTextLooksFilled(expectedTitle, title)) {
      // 偶发标题框失败、整段进了描述：描述里出现标题也算过
      if (!queryDouyinTextLooksFilled(expectedTitle, content)) {
        issues.push('标题未正确写入')
      }
    }
  }

  const bodyExpected =
    params.titleFilledSeparately || !expectedTitle
      ? expectedContent
      : queryNormalizeDouyinDraftText(`${expectedTitle}\n${expectedContent}`)

  if (bodyExpected && !queryDouyinTextLooksFilled(bodyExpected, content)) {
    // 标题与正文拆开写时，正文区可能不含标题；再单独验正文
    if (
      params.titleFilledSeparately &&
      expectedContent &&
      queryDouyinTextLooksFilled(expectedContent, content)
    ) {
      // ok
    } else if (
      !params.titleFilledSeparately &&
      expectedContent &&
      queryDouyinTextLooksFilled(expectedContent, content)
    ) {
      // 合并写入失败但正文进了描述
    } else {
      issues.push('作品描述未正确写入')
    }
  }

  if (!title && !content) {
    issues.push('页面未读到任何已填文案')
  }

  return { ok: issues.length === 0, title, content, issues }
}

/**
 * 关闭常见引导/遮罩层，避免挡住上传区与发布按钮。
 * 抖音改版频繁，此处只做轻量清理，失败不阻断流程。
 *
 * 严禁：
 * - 左上角盲点（Logo /「首页」）
 * - 任意 Esc（图文编辑态按 Esc 会退出草稿并回到创作者首页/上传落地页）
 * - 内容区盲点（可能点到侧栏或可导航卡片）
 * 只做 CSS 隐藏高 z-index 遮罩，绝不模拟点击/按键。
 */
export async function removeDouyinOverlay(page: Page): Promise<void> {
  await page.evaluate(() => {
    document
      .querySelectorAll('[class*="guide"], [class*="mask"], [class*="modal"], [class*="popover"]')
      .forEach((el) => {
        const style = window.getComputedStyle(el)
        const z = Number(style.zIndex)
        // 仅处理明确盖住全屏的浮层，避免误伤侧栏/编辑器内部节点
        if (style.position !== 'fixed' && style.position !== 'absolute') return
        if (!Number.isFinite(z) || z < 1000) return
        const rect = el.getBoundingClientRect()
        const coversViewport =
          rect.width >= window.innerWidth * 0.5 && rect.height >= window.innerHeight * 0.4
        if (!coversViewport) return
        ;(el as HTMLElement).style.pointerEvents = 'none'
        ;(el as HTMLElement).style.display = 'none'
      })
  })
  await sleep(120)
}

/** 当前是否仍停留在抖音创作者「上传/发布」相关页 */
export function queryIsDouyinPublishUrl(url: string): boolean {
  try {
    const u = new URL(url)
    if (!/creator\.douyin\.com$/i.test(u.hostname) && !/\.douyin\.com$/i.test(u.hostname)) {
      return false
    }
    // 上传页、图文编辑页；排除首页 /home、数据中心等
    return /\/content\/(upload|post|publish|edit)|\/creator-micro\/content/i.test(u.pathname)
  } catch {
    return /creator\.douyin\.com.*content/i.test(url)
  }
}

/** 是否为创作者「首页」类地址（误触后常见落点） */
export function queryIsDouyinCreatorHomeUrl(url: string): boolean {
  try {
    const u = new URL(url)
    if (!/creator\.douyin\.com/i.test(u.hostname)) return false
    const path = u.pathname.replace(/\/+$/, '') || '/'
    return (
      path === '/' ||
      path === '/creator-micro' ||
      /\/creator-micro\/home$/i.test(path) ||
      /\/home$/i.test(path)
    )
  } catch {
    return /creator\.douyin\.com\/(creator-micro\/)?home?/i.test(url)
  }
}

/**
 * 确认仍停留在抖音发布/上传页。
 * 填文案后若已离开，不得自动 goto（会丢掉已填草稿），由调用方中止并提示。
 */
export async function ensureDouyinPublishPage(page: Page): Promise<boolean> {
  if (queryIsDouyinPublishUrl(page.url())) return true
  console.warn('[douyin-dom] 检测到已离开发布页:', page.url())
  return false
}

/**
 * 填完文案后锁定页面：拦截回首页/侧栏导航点击，并拦截 history 跳到 home。
 * 返回解锁函数；发布流程结束或失败时务必调用。
 */
export async function lockDouyinPublishStay(page: Page): Promise<() => Promise<void>> {
  await page.evaluate(() => {
    const w = window as unknown as {
      __raDouyinLockInstalled?: boolean
      __raDouyinLockCleanup?: () => void
    }
    if (w.__raDouyinLockInstalled) return
    w.__raDouyinLockInstalled = true

    const isForbiddenNavTarget = (el: EventTarget | null): boolean => {
      if (!el || !(el instanceof Element)) return false
      const hit = (el.closest('a,button,[role="link"],[role="button"],[class*="menu"],[class*="nav"]') ??
        el) as HTMLElement
      const text = (hit.innerText || hit.textContent || '').replace(/\s+/g, ' ').trim()
      if (/^首页$|^主页$|^Home$/i.test(text)) return true
      const href = (hit.closest('a')?.getAttribute('href') || hit.getAttribute('href') || '').trim()
      if (/\/home\b|creator-micro\/?(\?|#|$)/i.test(href)) return true
      if (hit.closest('a[class*="logo"], [class*="logo"] a, a[href="/"], a[href="/creator-micro"]')) {
        return true
      }
      // 左侧窄栏导航（约 0～220px）：禁止离开发布编辑态
      const rect = hit.getBoundingClientRect()
      if (rect.right <= 220 && rect.width > 0 && rect.height > 0) {
        if (/首页|内容管理|互动|数据|成长|资金|直播|小店/.test(text)) return true
      }
      return false
    }

    const onClick = (e: Event) => {
      if (!isForbiddenNavTarget(e.target)) return
      e.preventDefault()
      e.stopPropagation()
      ;(e as MouseEvent).stopImmediatePropagation?.()
      console.warn('[douyin-lock] blocked navigation click')
    }

    document.addEventListener('click', onClick, true)
    document.addEventListener('auxclick', onClick, true)

    const origPush = history.pushState.bind(history)
    const origReplace = history.replaceState.bind(history)
    const blockUrl = (url: unknown): boolean => {
      const s = String(url ?? '')
      if (!s) return false
      return /\/home\b/i.test(s) || /creator-micro\/?(\?|#|$)/i.test(s)
    }
    history.pushState = ((data: unknown, unused: string, url?: string | URL | null) => {
      if (blockUrl(url)) {
        console.warn('[douyin-lock] blocked pushState', url)
        return
      }
      return origPush(data, unused, url as string | URL | null | undefined)
    }) as History['pushState']
    history.replaceState = ((data: unknown, unused: string, url?: string | URL | null) => {
      if (blockUrl(url)) {
        console.warn('[douyin-lock] blocked replaceState', url)
        return
      }
      return origReplace(data, unused, url as string | URL | null | undefined)
    }) as History['replaceState']

    w.__raDouyinLockCleanup = () => {
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('auxclick', onClick, true)
      history.pushState = origPush
      history.replaceState = origReplace
      w.__raDouyinLockInstalled = false
      w.__raDouyinLockCleanup = undefined
    }
  })

  const onFrameNavigated = async (): Promise<void> => {
    try {
      const url = page.url()
      if (queryIsDouyinPublishUrl(url)) return
      // 仅对「首页」强制返回；发布成功跳到内容管理等其它页不干预
      if (!queryIsDouyinCreatorHomeUrl(url)) return
      console.warn('[douyin-lock] navigated to creator home after fill, goBack:', url)
      await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => undefined)
    } catch {
      // ignore
    }
  }
  page.on('framenavigated', onFrameNavigated)

  return async () => {
    page.off('framenavigated', onFrameNavigated)
    await page
      .evaluate(() => {
        const w = window as unknown as { __raDouyinLockCleanup?: () => void }
        w.__raDouyinLockCleanup?.()
      })
      .catch(() => undefined)
  }
}

/**
 * 切换到「发布图文」模式（上传页默认可能是视频）。
 * 仅精确匹配 TAB 文案，避免模糊匹配「图片」点到其它入口。
 */
export async function clickDouyinImageTab(page: Page, timeoutMs = 15_000): Promise<boolean> {
  const texts = ['发布图文', '图文']
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    for (const text of texts) {
      try {
        const loc = page.getByText(text, { exact: true }).first()
        if (await loc.isVisible({ timeout: 1200 }).catch(() => false)) {
          const box = await loc.boundingBox().catch(() => null)
          // TAB 一般在主内容区上半部，排除左侧导航
          if (box && box.x < 200) continue
          await humanClickLocator(page, loc)
          await sleep(800)
          return true
        }
      } catch {
        // next
      }
    }
    await removeDouyinOverlay(page)
    await sleep(300)
  }
  return false
}

/**
 * 从页面文案解析「已添加 N 张图片」数量（创作者中心图文编辑态常见文案）。
 * 纯函数，供预览计数与单测使用。
 */
export function queryParseDouyinAddedImageCount(text: string): number {
  const m = String(text ?? '').match(/已添加\s*(\d+)\s*张/)
  if (!m) return 0
  const n = Number(m[1])
  return Number.isFinite(n) && n > 0 ? n : 0
}

/**
 * 定位抖音图文「拖入图片」投放区。
 * 优先匹配文案提示区域，再回退到带 upload/drag 类名的容器。
 */
export async function queryDouyinImageDropTarget(page: Page) {
  const byClass = page
    .locator(
      '[class*="upload-drag"], [class*="drag-area"], [class*="upload-dragger"], [class*="container-drag"]'
    )
    .filter({ hasText: /上传|拖入|图片/ })
    .first()
  if (await byClass.isVisible({ timeout: 800 }).catch(() => false)) return byClass

  const dropHint = page
    .getByText(/直接将图片文件拖入此区域|将图片文件拖入此区域|拖入此区域/)
    .first()
  if (await dropHint.isVisible({ timeout: 900 }).catch(() => false)) {
    // 文案节点偏小：上溯到含 file input 或 upload/drag 类名的容器
    const ancestor = dropHint.locator(
      'xpath=ancestor::div[.//input[@type="file"] or contains(@class,"upload") or contains(@class,"drag") or contains(@class,"drop")][1]'
    )
    if ((await ancestor.count().catch(() => 0)) > 0) return ancestor
    // 再退一步：包含该文案的较大 div
    const block = page.locator('div').filter({ hasText: /拖入此区域/ }).first()
    if (await block.isVisible({ timeout: 500 }).catch(() => false)) return block
    return dropHint
  }

  const uploadBlock = page
    .locator('[class*="upload"]')
    .filter({ hasText: /点击上传|上传图文|拖入/ })
    .first()
  if (await uploadBlock.isVisible({ timeout: 600 }).catch(() => false)) return uploadBlock

  const fileInput = page.locator('input[type="file"]').first()
  if ((await fileInput.count().catch(() => 0)) > 0) {
    return fileInput.locator(
      'xpath=ancestor::div[contains(@class,"upload") or contains(@class,"drag")][1]'
    )
  }
  return null
}

/**
 * 点击会弹出系统文件框的入口时，必须先等 filechooser 再 setFiles。
 * 裸点「添加/上传」会打开 OS 对话框并卡住自动化（Playwright 无法操作原生框）。
 */
async function postUploadDouyinFilesViaChooser(
  page: Page,
  paths: string[],
  triggerTexts: string[]
): Promise<boolean> {
  let trigger = null as ReturnType<Page['getByText']> | null
  for (const text of triggerTexts) {
    const loc = page.getByText(text, { exact: false }).first()
    if (await loc.isVisible({ timeout: 1200 }).catch(() => false)) {
      trigger = loc
      break
    }
  }
  if (!trigger) return false

  const chooserPromise = page.waitForEvent('filechooser', { timeout: 12_000 })
  await humanClickLocator(page, trigger)
  const chooser = await chooserPromise
  await chooser.setFiles(paths)
  return true
}

/**
 * 上传图文配图。
 * 优先「拖入投放区」（与创作者中心「将图片文件拖入此区域」一致）；
 * 失败再回退 setInputFiles / filechooser。首张后补图同理。
 */
export async function uploadDouyinImages(page: Page, imagePaths: string[]): Promise<void> {
  if (!imagePaths.length) return

  const needed = imagePaths.length

  // 1) 优先拖入：模拟用户把本地图片拖进上传区
  try {
    const dropTarget = await queryDouyinImageDropTarget(page)
    if (dropTarget) {
      await humanDropLocalFiles(page, dropTarget, imagePaths)
      await sleep(2000)
      const count = await queryDouyinImagePreviewCount(page)
      if (count >= needed) return
      if (count > 0) {
        const remaining = imagePaths.slice(count)
        if (!remaining.length) return
        const again = await queryDouyinImageDropTarget(page)
        if (again) {
          await humanDropLocalFiles(page, again, remaining)
          await sleep(1500)
          if ((await queryDouyinImagePreviewCount(page)) >= needed) return
        }
        const ok = await postUploadDouyinFilesViaChooser(page, remaining, [
          '继续添加',
          '添加图片',
          '添加'
        ])
        await sleep(1500)
        if (ok || (await queryDouyinImagePreviewCount(page)) > 0) return
      }
    }
  } catch (err) {
    console.warn('[douyin-upload] 拖入失败，回退 setInputFiles:', err)
  }

  const fileInput = page.locator('input[type="file"]').first()
  const hasInput = await fileInput.waitFor({ state: 'attached', timeout: 8_000 }).then(
    () => true,
    () => false
  )

  // 2) 回退：一次 setInputFiles（input 通常带 multiple）
  if (hasInput) {
    try {
      await fileInput.setInputFiles(imagePaths)
      await sleep(2000)
      const count = await queryDouyinImagePreviewCount(page)
      if (count >= needed) return
      if (count > 0) {
        const remaining = imagePaths.slice(count)
        if (!remaining.length) return
        const ok = await postUploadDouyinFilesViaChooser(page, remaining, [
          '继续添加',
          '添加图片',
          '添加'
        ])
        await sleep(1500)
        if (ok || (await queryDouyinImagePreviewCount(page)) > 0) return
      }
    } catch {
      // 回退逐张
    }
  }

  let uploaded = await queryDouyinImagePreviewCount(page)
  for (let i = uploaded; i < imagePaths.length; i++) {
    const dropTarget = await queryDouyinImageDropTarget(page)
    if (dropTarget) {
      try {
        await humanDropLocalFiles(page, dropTarget, [imagePaths[i]])
        uploaded += 1
        await sleep(i === 0 ? 1800 : 1200)
        continue
      } catch {
        // fall through
      }
    }

    const input = page.locator('input[type="file"]').first()
    const attached = await input.waitFor({ state: 'attached', timeout: 4000 }).then(
      () => true,
      () => false
    )
    if (attached) {
      await input.setInputFiles(imagePaths[i])
    } else {
      // 编辑态：点「添加」会弹系统文件框 → 必须用 filechooser.setFiles
      const ok = await postUploadDouyinFilesViaChooser(page, [imagePaths[i]], [
        '继续添加',
        '添加图片',
        '添加',
        '上传图片',
        '上传'
      ])
      if (!ok) {
        if (uploaded > 0 || (await queryDouyinImagePreviewCount(page)) > 0) {
          return
        }
        throw new Error('未找到可用于继续上传的拖放区域或文件选择控件')
      }
    }
    uploaded += 1
    await sleep(i === 0 ? 1800 : 1200)
  }
}

/** 统计页面上已出现的配图预览数量（启发式，改版时容错） */
export async function queryDouyinImagePreviewCount(page: Page): Promise<number> {
  const candidates = [
    '[class*="preview"] img',
    '[class*="thumb"] img',
    '[class*="image-list"] img',
    '[class*="upload"] img',
    '.semi-upload-picture-card img'
  ]
  let max = 0
  for (const sel of candidates) {
    try {
      const n = await page.locator(sel).count()
      if (n > max) max = n
    } catch {
      // next
    }
  }

  // 创作者中心编辑态常见「已添加1张图片」，DOM img 选择器偶发匹配不到
  try {
    const bodyText = await page.locator('body').innerText({ timeout: 2000 })
    const fromLabel = queryParseDouyinAddedImageCount(bodyText)
    if (fromLabel > max) max = fromLabel
  } catch {
    // ignore
  }

  return max
}

const DOUYIN_TITLE_SELECTORS = [
  'input[placeholder*="标题"]',
  'textarea[placeholder*="标题"]',
  '[class*="title"] input',
  '[class*="title"] textarea',
  'input[placeholder*="作品标题"]'
]

const DOUYIN_BODY_SELECTORS = [
  'div[contenteditable="true"][data-placeholder*="描述"]',
  'div[contenteditable="true"][placeholder*="描述"]',
  '[class*="desc"] [contenteditable="true"]',
  '[class*="editor"] [contenteditable="true"]',
  'textarea[placeholder*="描述"]',
  'textarea[placeholder*="作品"]',
  'textarea[placeholder*="添加"]',
  'div[contenteditable="true"]'
]

/** 从单个输入控件回读当前值（input/textarea/contenteditable） */
async function queryLocatorDraftText(page: Page, selectors: string[]): Promise<string> {
  for (const sel of selectors) {
    try {
      const loc = page.locator(sel).first()
      if (!(await loc.isVisible({ timeout: 800 }).catch(() => false))) continue
      const tag = await loc.evaluate((el) => el.tagName.toLowerCase()).catch(() => '')
      if (tag === 'input' || tag === 'textarea') {
        const v = await loc.inputValue().catch(() => '')
        if (v.trim()) return v
      }
      const text = await loc.innerText().catch(async () => (await loc.textContent()) ?? '')
      if (text.trim()) return text
    } catch {
      // next
    }
  }
  return ''
}

/**
 * 回读创作者页已填标题与作品描述，供发布前校验。
 */
export async function queryDouyinFilledDraft(page: Page): Promise<DouyinFilledDraft> {
  const title = await queryLocatorDraftText(page, DOUYIN_TITLE_SELECTORS)
  let content = await queryLocatorDraftText(page, DOUYIN_BODY_SELECTORS)

  // 描述区 selector 未命中时，兜底取第一个 contenteditable（排除标题框）
  if (!content.trim()) {
    const editables = page.locator('[contenteditable="true"]')
    const n = await editables.count().catch(() => 0)
    for (let i = 0; i < n; i++) {
      const loc = editables.nth(i)
      if (!(await loc.isVisible().catch(() => false))) continue
      const text = (await loc.innerText().catch(async () => (await loc.textContent()) ?? '')) ?? ''
      const normalized = queryNormalizeDouyinDraftText(text)
      if (!normalized) continue
      // 若只有一个可编辑区且与标题相同，视为合并写入
      if (title && queryNormalizeDouyinDraftText(title) === normalized) continue
      content = text
      break
    }
  }

  return { title, content }
}

/**
 * 填写完成后拟人「通读一遍」：只在主内容区轻停，不点、不按 Esc、不靠近顶栏/侧栏。
 */
export async function humanReviewDouyinFilledContent(page: Page): Promise<void> {
  const vp = page.viewportSize() ?? { width: 1280, height: 800 }

  // 鼠标停在标题/描述主栏（避开左侧导航与顶部 Logo）
  await humanBezierMoveTo(page, {
    x: rand(vp.width * 0.42, vp.width * 0.78),
    y: rand(vp.height * 0.38, vp.height * 0.62)
  })
  await humanGaussianPause(0.5, 0.2)

  // 只向下轻扫找底栏，避免上滚把顶栏 Logo 送进误触区
  await humanBezierScroll(page, {
    direction: 'down',
    distance: rand(120, 280)
  })
  await humanStepPause({ min: 1200, max: 2800 })
}

/**
 * 发布前完整校验：拟人通读 → 回读 DOM → 与期望文案比对。
 */
export async function queryVerifyDouyinFilledContent(
  page: Page,
  params: {
    expectedTitle: string
    expectedContent: string
    titleFilledSeparately: boolean
  }
): Promise<DouyinFillVerifyResult> {
  await humanReviewDouyinFilledContent(page)
  const actual = await queryDouyinFilledDraft(page)
  return queryVerifyDouyinFilledDraft({
    expectedTitle: params.expectedTitle,
    expectedContent: params.expectedContent,
    actual,
    titleFilledSeparately: params.titleFilledSeparately
  })
}

/** 判断底栏「发布」相关按钮是否已进入可视区（排除侧栏「发布」入口） */
async function queryDouyinPublishButtonVisible(page: Page): Promise<boolean> {
  // 最稳：与发布同排的「暂存离开」
  const stash = page.getByText('暂存离开', { exact: true }).last()
  if (await stash.isVisible({ timeout: 400 }).catch(() => false)) return true

  // 仅认 button role，避免侧栏文字链「发布」被当成底栏按钮
  for (const name of ['发布', '立即发布', '确认发布']) {
    const btn = page.getByRole('button', { name }).last()
    if (!(await btn.isVisible({ timeout: 300 }).catch(() => false))) continue
    const box = await btn.boundingBox().catch(() => null)
    const vp = page.viewportSize() ?? { width: 1280, height: 800 }
    // 底栏按钮通常在视口下半区；侧栏入口多在左侧中上部
    if (box && box.y >= vp.height * 0.55 && box.x >= vp.width * 0.35) return true
  }
  return false
}

/** 强制把主滚动容器滚到绝对底部 */
async function postForceDouyinPageBottom(page: Page): Promise<void> {
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
  })
  await sleep(rand(200, 400))
}

/**
 * 「发布 / 暂存离开」在创作者图文页最底部操作栏。
 * 分段拟人下滚直到发布按钮进入可视区；不缩放页面，避免浏览器内容区视觉变小。
 */
export async function scrollDouyinPublishFooterIntoView(page: Page): Promise<void> {
  const maxRounds = 8
  for (let i = 0; i < maxRounds; i++) {
    if (await queryDouyinPublishButtonVisible(page)) break

    await humanBezierScroll(page, {
      direction: 'down',
      distance: rand(420, 780)
    })
    await sleep(rand(180, 420))
  }

  // 兜底：容器仍可能很长，最后一次滚到绝对底部
  await postForceDouyinPageBottom(page)

  for (const text of ['暂存离开', '立即发布', '发布']) {
    try {
      // 「发布」必须 exact，避免匹配侧栏「发布作品」等长文案
      const el = page.getByText(text, { exact: true }).last()
      if (await el.isVisible({ timeout: 800 }).catch(() => false)) {
        await el.scrollIntoViewIfNeeded().catch(() => undefined)
        await sleep(rand(200, 450))
        break
      }
    } catch {
      // next
    }
  }

  // 仍不可见时再轻推一下，避免卡在半屏
  if (!(await queryDouyinPublishButtonVisible(page))) {
    await humanBezierScroll(page, { direction: 'down', distance: rand(180, 360) })
  }
}

/**
 * 滚到底后模拟人类「再看一眼」：底栏附近轻微挪鼠标 + 随机停顿，再点发布。
 */
export async function dwellBeforeDouyinPublish(page: Page): Promise<void> {
  const vp = page.viewportSize() ?? { width: 1280, height: 800 }
  // 鼠标先落到页面下部（底栏一带），像在瞄按钮
  await humanBezierMoveTo(page, {
    x: rand(vp.width * 0.55, vp.width * 0.92),
    y: rand(vp.height * 0.78, vp.height * 0.95)
  })
  await sleep(rand(400, 900))

  // 偶发上下轻扫一眼配图/文案
  if (Math.random() < 0.55) {
    await humanBezierScroll(page, {
      direction: Math.random() < 0.35 ? 'up' : 'down',
      distance: rand(60, 160)
    })
    // 再轻轻滚回底栏
    await humanBezierScroll(page, { direction: 'down', distance: rand(80, 200) })
  }

  // 关键停留：像确认标题/描述无误再点（约 3.5～9 秒）
  await humanStepPause({ min: 3500, max: 9000 })

  // 停顿后略移向发布按钮区域
  await humanBezierMoveTo(page, {
    x: rand(vp.width * 0.72, vp.width * 0.96),
    y: rand(vp.height * 0.82, vp.height * 0.97)
  })
  await sleep(rand(350, 800))
}

/** 点击「发布」主按钮（下滚直到发布按钮可见 → 停留确认 → 再点） */
export async function clickDouyinPublishButton(page: Page): Promise<boolean> {
  if (!(await ensureDouyinPublishPage(page))) return false

  await removeDouyinOverlay(page)
  await scrollDouyinPublishFooterIntoView(page)
  await dwellBeforeDouyinPublish(page)
  await removeDouyinOverlay(page)

  if (!(await ensureDouyinPublishPage(page))) return false

  const vp = page.viewportSize() ?? { width: 1280, height: 800 }
  const candidates = ['发布', '立即发布', '确认发布']

  /** 仅点击视口右下区域的底栏按钮，避免侧栏/顶栏「发布」入口 */
  const isFooterPublishHit = (box: { x: number; y: number; width: number; height: number } | null): boolean => {
    if (!box) return false
    return box.y >= vp.height * 0.55 && box.x >= vp.width * 0.35
  }

  // 优先点与「暂存离开」同排的发布按钮（底栏），避免点到页面其它「发布」文案
  try {
    const footer = page.getByText('暂存离开', { exact: true }).first()
    if (await footer.isVisible({ timeout: 1000 }).catch(() => false)) {
      const row = footer.locator(
        'xpath=ancestor::*[contains(@class,"footer") or contains(@class,"bottom") or contains(@class,"action") or contains(@class,"bar")][1]'
      )
      const inRow = row.getByRole('button', { name: /发布/ }).last()
      if (await inRow.isVisible({ timeout: 800 }).catch(() => false)) {
        await humanClickLocator(page, inRow, { timeout: 5000 })
        await sleep(rand(700, 1200))
        return true
      }
      const near = footer.locator('xpath=..').getByText('发布', { exact: true }).last()
      if (await near.isVisible({ timeout: 600 }).catch(() => false)) {
        await humanClickLocator(page, near, { timeout: 5000 })
        await sleep(rand(700, 1200))
        return true
      }
    }
  } catch {
    // fall through
  }

  for (const text of candidates) {
    try {
      const btn = page.getByRole('button', { name: text }).last()
      if (!(await btn.isVisible({ timeout: 1200 }))) continue
      const box = await btn.boundingBox().catch(() => null)
      if (!isFooterPublishHit(box)) continue
      await btn.scrollIntoViewIfNeeded().catch(() => undefined)
      await humanClickLocator(page, btn, { timeout: 5000 })
      await sleep(rand(700, 1200))
      return true
    } catch {
      // next
    }
  }

  for (const text of candidates) {
    try {
      const el = page.getByText(text, { exact: true }).last()
      if (!(await el.isVisible({ timeout: 800 }))) continue
      const box = await el.boundingBox().catch(() => null)
      if (!isFooterPublishHit(box)) continue
      await el.scrollIntoViewIfNeeded().catch(() => undefined)
      await humanClickLocator(page, el, { timeout: 3000 })
      await sleep(rand(700, 1200))
      return true
    } catch {
      // next
    }
  }

  return false
}

/** 二次确认弹窗 */
export async function clickDouyinConfirmDialog(page: Page): Promise<boolean> {
  const texts = ['确认发布', '发布', '确定', '继续发布']
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
