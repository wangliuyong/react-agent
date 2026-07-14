import type { Page } from 'playwright'
import { humanBezierMoveTo, humanBezierScroll, humanStepPause, rand, sleep } from './human-behavior'
import { humanClickAt, humanClickLocator, humanClickText } from './human-input'

/** 抖音创作者中心 - 内容上传页 */
export const DOUYIN_PUBLISH_URL =
  'https://creator.douyin.com/creator-micro/content/upload'

/**
 * 关闭常见引导/遮罩层，避免挡住上传区与发布按钮。
 * 抖音改版频繁，此处只做轻量清理，失败不阻断流程。
 */
export async function removeDouyinOverlay(page: Page): Promise<void> {
  await page.evaluate(() => {
    document
      .querySelectorAll('[class*="guide"], [class*="mask"], [class*="modal"]')
      .forEach((el) => {
        const style = window.getComputedStyle(el)
        if (style.position === 'fixed' && style.zIndex && Number(style.zIndex) > 1000) {
          ;(el as HTMLElement).style.display = 'none'
        }
      })
  })
  await humanClickAt(page, 120 + Math.random() * 40, 40 + Math.random() * 20)
  await sleep(200)
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

/**
 * 「发布 / 暂存离开」在创作者图文页最底部操作栏。
 * 分段拟人滚到底，再在底栏附近停留阅读一段时间后再点发布。
 */
export async function scrollDouyinPublishFooterIntoView(page: Page): Promise<void> {
  // 分段下滚，模拟人看完正文再找底部按钮
  const rounds = Math.floor(rand(2, 4))
  for (let i = 0; i < rounds; i++) {
    await humanBezierScroll(page, {
      direction: 'down',
      distance: rand(420, 780)
    })
  }

  // 兜底：容器仍可能很长，最后一次滚到绝对底部
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
  await sleep(rand(280, 520))

  for (const text of ['暂存离开', '发布', '立即发布']) {
    try {
      const el = page.getByText(text, { exact: text === '暂存离开' }).last()
      if (await el.isVisible({ timeout: 800 }).catch(() => false)) {
        await el.scrollIntoViewIfNeeded().catch(() => undefined)
        await sleep(rand(200, 450))
        break
      }
    } catch {
      // next
    }
  }

  await humanBezierScroll(page, { direction: 'down', distance: rand(180, 360) })
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

/** 点击「发布」主按钮（先拟人滚到底 → 停留确认 → 再点） */
export async function clickDouyinPublishButton(page: Page): Promise<boolean> {
  await removeDouyinOverlay(page)
  await scrollDouyinPublishFooterIntoView(page)
  await dwellBeforeDouyinPublish(page)
  await removeDouyinOverlay(page)

  const candidates = ['发布', '立即发布', '确认发布']

  // 优先点与「暂存离开」同排的发布按钮（底栏），避免点到页面其它「发布」文案
  try {
    const footer = page.getByText('暂存离开', { exact: true }).first()
    if (await footer.isVisible({ timeout: 1000 }).catch(() => false)) {
      const row = footer.locator('xpath=ancestor::*[contains(@class,"footer") or contains(@class,"bottom") or contains(@class,"action") or contains(@class,"bar")][1]')
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
      if (await btn.isVisible({ timeout: 1200 })) {
        await btn.scrollIntoViewIfNeeded().catch(() => undefined)
        await humanClickLocator(page, btn, { timeout: 5000 })
        await sleep(rand(700, 1200))
        return true
      }
    } catch {
      // next
    }
  }

  for (const text of candidates) {
    try {
      const el = page.getByText(text, { exact: true }).last()
      if (await el.isVisible({ timeout: 800 })) {
        await el.scrollIntoViewIfNeeded().catch(() => undefined)
        await humanClickLocator(page, el, { timeout: 3000 })
        await sleep(rand(700, 1200))
        return true
      }
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
