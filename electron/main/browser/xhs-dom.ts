import type { Page } from 'playwright'
import { humanClickAt, humanClickLocator, humanMoveTo } from './human-input'

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

/** 小红书创作台发布页（与社区 MCP 对齐，带 source 参数） */
export const XHS_PUBLISH_URL =
  'https://creator.xiaohongshu.com/publish/publish?source=official'

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
  await sleep(200)
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

/** 查找 creator-tab 并返回拟人点击坐标 */
async function queryCreatorTabHit(page: Page, tabName: string): Promise<TabHit | null> {
  return page.evaluate((name) => {
    const tabs = Array.from(document.querySelectorAll('div.creator-tab')) as HTMLElement[]
    for (const tab of tabs) {
      const text = (tab.innerText || tab.textContent || '').trim()
      if (text !== name) continue
      const rect = tab.getBoundingClientRect()
      if (rect.width < 2 || rect.height < 2) continue
      const x = rect.left + rect.width / 2
      const y = rect.top + rect.height / 2
      const target = document.elementFromPoint(x, y)
      const blocked = !(target === tab || tab.contains(target))
      return { x, y, blocked }
    }
    return null
  }, tabName)
}

/**
 * 切换到「上传图文」TAB。
 * 被浮层遮挡时会先 removeXhsPopoverOverlay 再重试。
 */
export async function clickXhsImageTab(page: Page, timeoutMs = 15_000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs

  await page
    .locator('div.upload-content')
    .first()
    .waitFor({ state: 'visible', timeout: timeoutMs })
    .catch(() => undefined)

  while (Date.now() < deadline) {
    const hit = await queryCreatorTabHit(page, '上传图文')
    if (!hit) {
      // 文案 fallback：部分版本 tab 文案为「图文」
      const alt = await queryCreatorTabHit(page, '图文')
      if (alt) {
        if (alt.blocked) {
          await removeXhsPopoverOverlay(page)
          await sleep(250)
          continue
        }
        await humanClickAt(page, alt.x, alt.y)
        await sleep(800)
        return true
      }
      await sleep(250)
      continue
    }

    if (hit.blocked) {
      await removeXhsPopoverOverlay(page)
      await sleep(250)
      continue
    }

    await humanClickAt(page, hit.x, hit.y)
    await sleep(800)
    return true
  }

  return false
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
 * 点击「发布」：优先 invoke 宿主方法，再坐标点击 xhs-publish-btn，最后旧版按钮。
 */
export async function clickXhsPublishButton(page: Page): Promise<boolean> {
  await removeXhsPopoverOverlay(page)

  const ready = await waitForXhsPublishReady(page)
  if (!ready) return false

  // 滚动到底部，确保发布条可见
  await page.evaluate(() => {
    const widget = document.querySelector('xhs-publish-btn')
    widget?.scrollIntoView({ block: 'center', inline: 'center' })
  })
  await sleep(300)

  const invoked = await invokeXhsPublishAction(page, 'publish')
  if (invoked.ok) {
    await sleep(500)
    if (await clickXhsConfirmDialog(page)) return true
    // 部分版本 invoke 后无跳转，继续坐标兜底
  }

  const point = await queryXhsPublishClickPoint(page)
  if (point) {
    await humanClickAt(page, point.x, point.y)
    await sleep(500)
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
    await sleep(i === 0 ? 1500 : 1000)
    // 等待预览数量达到 i+1
    await page
      .locator('.img-preview-area .pr')
      .nth(i)
      .waitFor({ state: 'attached', timeout: 60_000 })
      .catch(() => sleep(2000))
  }
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
