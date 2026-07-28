import type { Page } from 'playwright'
import {
  humanBezierMoveTo,
  humanBezierScroll,
  humanGaussianPause,
  humanStepPause,
  rand,
  sleep
} from './human-behavior'
import { humanClickAt, humanClickLocator, humanClickText } from './human-input'

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
 * 注意：禁止在左上角盲点——创作者中心 Logo /「首页」导航就在该区域，
 * 误点会直接离开上传页，导致填好的文案丢失。
 */
export async function removeDouyinOverlay(page: Page): Promise<void> {
  const hadOverlay = await page.evaluate(() => {
    let hidden = 0
    document
      .querySelectorAll('[class*="guide"], [class*="mask"], [class*="modal"], [class*="popover"]')
      .forEach((el) => {
        const style = window.getComputedStyle(el)
        if (style.position === 'fixed' && style.zIndex && Number(style.zIndex) > 1000) {
          ;(el as HTMLElement).style.display = 'none'
          hidden += 1
        }
      })
    return hidden > 0
  })

  // 仅在检测到遮罩时：Esc 关闭，必要时点内容区中部（避开侧栏与顶栏 Logo/首页）
  if (hadOverlay) {
    await page.keyboard.press('Escape').catch(() => undefined)
    await sleep(120)
    const vp = page.viewportSize() ?? { width: 1280, height: 800 }
    await humanClickAt(
      page,
      vp.width * rand(0.35, 0.62),
      vp.height * rand(0.35, 0.55)
    )
  }
  await sleep(150)
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
 * 切换到「发布图文」模式（上传页默认可能是视频）。
 * 文案 fallback：图文 / 发布图文 / 图片。
 */
export async function clickDouyinImageTab(page: Page, timeoutMs = 15_000): Promise<boolean> {
  const texts = ['发布图文', '图文', '图片']
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    for (const text of texts) {
      const clicked = await humanClickText(page, [text], { timeoutPer: 1200 })
      if (clicked) {
        await sleep(800)
        return true
      }
    }
    await removeDouyinOverlay(page)
    await sleep(300)
  }
  return false
}

/**
 * 上传图文配图。
 * 抖音首张上传后 file input 常会从 DOM 移除并进入编辑态；
 * 因此优先一次性 setInputFiles(全部路径)，避免第二张起 waitFor 超时假失败。
 */
export async function uploadDouyinImages(page: Page, imagePaths: string[]): Promise<void> {
  if (!imagePaths.length) return

  const fileInput = page.locator('input[type="file"]').first()
  await fileInput.waitFor({ state: 'attached', timeout: 15_000 })

  // 一次传入多张（input 通常带 multiple），与创作者中心行为一致
  try {
    await fileInput.setInputFiles(imagePaths)
    await sleep(2000)
    if (await queryDouyinImagePreviewCount(page) > 0) return
  } catch {
    // 回退逐张
  }

  let uploaded = 0
  for (let i = 0; i < imagePaths.length; i++) {
    let input = page.locator('input[type="file"]').first()
    const attached = await input.waitFor({ state: 'attached', timeout: 4000 }).then(
      () => true,
      () => false
    )
    if (!attached) {
      // 编辑态需点「添加」才出现新的 file input
      await humanClickText(page, ['添加', '继续添加', '上传'], { timeoutPer: 1500 })
      await sleep(600)
      input = page.locator('input[type="file"]').first()
      const ok = await input.waitFor({ state: 'attached', timeout: 8_000 }).then(
        () => true,
        () => false
      )
      if (!ok) {
        if (uploaded > 0 || (await queryDouyinImagePreviewCount(page)) > 0) {
          // 已有预览：视为上传成功，留给后续补图手动处理
          return
        }
        throw new Error('未找到可用于继续上传的文件选择控件')
      }
    }
    await input.setInputFiles(imagePaths[i])
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
 * 填写完成后拟人「通读一遍」：轻微上下扫视标题/描述区，再停顿确认。
 * 不改变输入内容，只模拟人类检查动作。
 */
export async function humanReviewDouyinFilledContent(page: Page): Promise<void> {
  const vp = page.viewportSize() ?? { width: 1280, height: 800 }

  // 先移到标题附近，像在核对标题字数
  await humanBezierMoveTo(page, {
    x: rand(vp.width * 0.25, vp.width * 0.7),
    y: rand(vp.height * 0.22, vp.height * 0.42)
  })
  await humanGaussianPause(0.6, 0.25)

  // 轻扫描述区：先下再略回，避免一眼到底栏
  await humanBezierScroll(page, {
    direction: 'down',
    distance: rand(160, 360)
  })
  await humanGaussianPause(0.45, 0.2)
  if (Math.random() < 0.7) {
    await humanBezierScroll(page, {
      direction: 'up',
      distance: rand(60, 140)
    })
  }

  await humanBezierMoveTo(page, {
    x: rand(vp.width * 0.3, vp.width * 0.75),
    y: rand(vp.height * 0.4, vp.height * 0.65)
  })
  // 通读停留约 2～5 秒
  await humanStepPause({ min: 2000, max: 5000 })
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

/** 发布页缩放下限（50%），再小可读性与点击命中都会变差 */
export const DOUYIN_PUBLISH_MIN_ZOOM = 0.5

/**
 * 滚动仍找不到发布按钮时的缩放阶梯：从 90% 每次降 10%，最低到 minZoom。
 * 纯函数，便于单测。
 */
export function queryDouyinPublishZoomSteps(minZoom = DOUYIN_PUBLISH_MIN_ZOOM): number[] {
  const floor = Math.max(0.1, Math.min(1, minZoom))
  const steps: number[] = []
  // 从略小于 100% 开始：0.9 → 0.8 → … → floor
  for (let z = 0.9; z >= floor - 1e-9; z = Math.round((z - 0.1) * 10) / 10) {
    steps.push(Number(z.toFixed(1)))
  }
  return steps
}

/**
 * 用 CSS zoom 缩小创作者页，让底栏发布按钮更容易进入视口。
 * Chromium/Electron 支持 documentElement.style.zoom。
 */
export async function postApplyDouyinPageZoom(page: Page, zoom: number): Promise<void> {
  const clamped = Math.max(DOUYIN_PUBLISH_MIN_ZOOM, Math.min(1, zoom))
  await page.evaluate((z) => {
    const root = document.documentElement as HTMLElement
    root.style.zoom = String(z)
  }, clamped)
  await sleep(rand(200, 400))
}

/** 强制把主滚动容器滚到绝对底部（缩放后需再调一次） */
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
 * 先分段下滚；仍找不到则逐步缩小页面（最低 50%），再滚到底找发布按钮。
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

  // 滚动仍找不到：逐步缩放页面（90%→…→50%），每次缩完再滚底检查
  if (!(await queryDouyinPublishButtonVisible(page))) {
    for (const zoom of queryDouyinPublishZoomSteps()) {
      console.warn(`[douyin-dom] 未找到发布按钮，缩小页面至 ${Math.round(zoom * 100)}%`)
      await postApplyDouyinPageZoom(page, zoom)
      await postForceDouyinPageBottom(page)

      for (const text of ['暂存离开', '立即发布', '发布']) {
        try {
          const el = page.getByText(text, { exact: true }).last()
          if (await el.isVisible({ timeout: 600 }).catch(() => false)) {
            await el.scrollIntoViewIfNeeded().catch(() => undefined)
            break
          }
        } catch {
          // next
        }
      }

      if (await queryDouyinPublishButtonVisible(page)) break

      await humanBezierScroll(page, {
        direction: 'down',
        distance: rand(200, 420)
      })
      if (await queryDouyinPublishButtonVisible(page)) break
    }
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
