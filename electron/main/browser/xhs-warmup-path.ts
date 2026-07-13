import type { Page } from 'playwright'
import {
  humanBezierMoveTo,
  humanBezierScroll,
  humanDwellRead,
  humanMicroPause,
  humanStepPause,
  rand,
  sleep
} from './human-behavior'
import { humanClickAt, humanClickLocator } from './human-input'
import {
  assertXhsBehaviorAllowed,
  postRecordXhsBehavior
} from '../store/xhs-behavior-guard'

/** 小红书发现页 / 首页，用于发布前浏览热身 */
export const XHS_EXPLORE_URL = 'https://www.xiaohongshu.com/explore'

export interface XhsWarmupOptions {
  signal?: AbortSignal
}

function assertNotAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new Error('用户已中止')
}

/**
 * 发布前模拟真人浏览链路，避免直达创作台：
 * 发现页随机刷 3～5 屏 → 点开 1～2 篇详情停留 ≥15s → 随机点赞 1 篇（在限额内）。
 */
export async function runXhsWarmupBrowse(page: Page, opts?: XhsWarmupOptions): Promise<string> {
  const signal = opts?.signal
  assertNotAborted(signal)

  await page.goto(XHS_EXPLORE_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await humanStepPause({ min: 2500, max: 5000 })
  assertNotAborted(signal)

  const scrollTimes = Math.floor(rand(3, 6))
  for (let i = 0; i < scrollTimes; i++) {
    await humanBezierScroll(page)
    await humanMicroPause()
    assertNotAborted(signal)
  }

  const openCount = Math.floor(rand(1, 3))
  const opened: string[] = []

  for (let i = 0; i < openCount; i++) {
    const href = await pickRandomFeedNoteHref(page, opened)
    if (!href) break

    const noteLink = page.locator(`a[href="${href}"]`).first()
    try {
      if (await noteLink.isVisible({ timeout: 2500 })) {
        await humanClickLocator(page, noteLink)
      } else {
        await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 45_000 })
      }
    } catch {
      await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 45_000 }).catch(() => undefined)
    }

    opened.push(href)
    await humanDwellRead(page, 15_000, 26_000)
    assertNotAborted(signal)

    // 首篇详情页尝试点赞（受日限额约束）
    if (i === 0) {
      await tryWarmupLike(page)
    }

    if (i < openCount - 1) {
      await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => undefined)
      await humanStepPause({ min: 2000, max: 4500 })
    }
  }

  await humanStepPause({ min: 2000, max: 6000 })
  return `浏览热身完成：滚动 ${scrollTimes} 次，浏览笔记 ${opened.length} 篇。`
}

/** 从当前页提取可点击的笔记详情链接 */
async function pickRandomFeedNoteHref(page: Page, exclude: string[]): Promise<string | null> {
  const hrefs = await page.evaluate(() => {
    const out: string[] = []
    const seen = new Set<string>()
    const anchors = Array.from(document.querySelectorAll('a[href]')) as HTMLAnchorElement[]
    for (const a of anchors) {
      const href = a.href || a.getAttribute('href') || ''
      if (!href || seen.has(href)) continue
      // 笔记详情常见路径
      if (!/\/explore\/[a-f0-9]+/i.test(href) && !/xiaohongshu\.com\/discovery\/item\//i.test(href)) {
        continue
      }
      const rect = a.getBoundingClientRect()
      if (rect.width < 40 || rect.height < 40) continue
      if (rect.top < 0 || rect.top > window.innerHeight) continue
      seen.add(href)
      out.push(href.split('?')[0])
    }
    return out
  })

  const candidates = hrefs.filter((h) => !exclude.includes(h))
  if (!candidates.length) return null
  return candidates[Math.floor(Math.random() * candidates.length)]
}

/** 详情页尝试点赞；失败或超限则静默跳过 */
async function tryWarmupLike(page: Page): Promise<void> {
  try {
    assertXhsBehaviorAllowed('like')
  } catch {
    return
  }

  const likeSelectors = [
    '[class*="like-wrapper"]',
    '[class*="like-icon"]',
    'span[class*="like"]',
    '[aria-label*="点赞"]',
    '[aria-label*="赞"]'
  ]

  for (const sel of likeSelectors) {
    try {
      const loc = page.locator(sel).first()
      if (!(await loc.isVisible({ timeout: 1200 }))) continue
      await humanClickLocator(page, loc)
      await sleep(rand(800, 1800))
      postRecordXhsBehavior('like')
      return
    } catch {
      // next selector
    }
  }

  // 坐标兜底：详情页右侧互动栏大致区域
  const vp = page.viewportSize() ?? { width: 1280, height: 800 }
  await humanBezierMoveTo(page, { x: vp.width - rand(48, 72), y: rand(320, 480) })
  await humanClickAt(page, vp.width - rand(48, 72), rand(320, 480))
  await sleep(rand(600, 1200))
  postRecordXhsBehavior('like')
}
