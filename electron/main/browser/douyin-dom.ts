import type { Page } from 'playwright'
import { humanClickAt, humanClickLocator, humanClickText } from './human-input'

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

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

/** 逐张上传图文配图 */
export async function uploadDouyinImages(page: Page, imagePaths: string[]): Promise<void> {
  for (let i = 0; i < imagePaths.length; i++) {
    const input = page.locator('input[type="file"]').nth(i === 0 ? 0 : 0)
    await input.waitFor({ state: 'attached', timeout: 15_000 })
    await input.setInputFiles(imagePaths[i])
    await sleep(i === 0 ? 1800 : 1200)
  }
}

/** 点击「发布」主按钮 */
export async function clickDouyinPublishButton(page: Page): Promise<boolean> {
  await removeDouyinOverlay(page)

  const candidates = ['发布', '立即发布', '确认发布']
  for (const text of candidates) {
    try {
      const btn = page.getByRole('button', { name: text }).last()
      if (await btn.isVisible({ timeout: 1200 })) {
        await humanClickLocator(page, btn, { timeout: 5000 })
        await sleep(800)
        return true
      }
    } catch {
      // next
    }
  }

  // 部分版本发布按钮为 div/span
  for (const text of candidates) {
    try {
      const el = page.getByText(text, { exact: true }).last()
      if (await el.isVisible({ timeout: 800 })) {
        await humanClickLocator(page, el, { timeout: 3000 })
        await sleep(800)
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
