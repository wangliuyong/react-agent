import type { Locator, Page } from 'playwright'

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

/**
 * 拟人鼠标/键盘：移动轨迹 + 真实 click/type，避免 locator.fill / 瞬时 click。
 * 用于小红书发布等需要「像用户操作」的场景。
 */
export async function humanMoveTo(
  page: Page,
  target: { x: number; y: number },
  steps = 18
): Promise<void> {
  const stepCount = Math.max(8, Math.floor(steps + rand(-3, 5)))
  await page.mouse.move(target.x, target.y, { steps: stepCount })
  await sleep(rand(40, 120))
}

export async function humanClickLocator(
  page: Page,
  locator: Locator,
  opts?: { timeout?: number }
): Promise<void> {
  await locator.waitFor({ state: 'visible', timeout: opts?.timeout ?? 15_000 })
  await locator.scrollIntoViewIfNeeded().catch(() => undefined)

  const box = await locator.boundingBox()
  if (!box) {
    // 无几何信息时仍走 Playwright 点击，但带 delay 模拟按压
    await locator.click({ delay: rand(40, 90), timeout: opts?.timeout ?? 15_000 })
    return
  }

  // 点在元素中心附近，带轻微抖动，更像真人
  const x = box.x + box.width * rand(0.35, 0.65)
  const y = box.y + box.height * rand(0.35, 0.65)

  await humanMoveTo(page, { x, y }, rand(14, 28))
  await sleep(rand(50, 150))
  await page.mouse.down()
  await sleep(rand(40, 100))
  await page.mouse.up()
  await sleep(rand(80, 200))
}

export async function humanClickText(
  page: Page,
  texts: string[],
  opts?: { timeoutPer?: number }
): Promise<boolean> {
  for (const text of texts) {
    try {
      const loc = page.getByText(text, { exact: false }).first()
      if (await loc.isVisible({ timeout: opts?.timeoutPer ?? 1500 })) {
        await humanClickLocator(page, loc)
        return true
      }
    } catch {
      // try next
    }
  }
  return false
}

export async function humanClickSelector(
  page: Page,
  selector: string,
  opts?: { timeout?: number }
): Promise<void> {
  await humanClickLocator(page, page.locator(selector).first(), opts)
}

/**
 * 先鼠标点入输入区，再逐字键盘输入（不用 fill）。
 */
export async function humanTypeInto(
  page: Page,
  locator: Locator,
  text: string,
  opts?: { clear?: boolean; delayMin?: number; delayMax?: number }
): Promise<void> {
  const clear = opts?.clear !== false
  const delayMin = opts?.delayMin ?? 35
  const delayMax = opts?.delayMax ?? 95

  await humanClickLocator(page, locator)

  if (clear) {
    // macOS: Meta+A；其它平台 Control+A
    const mod = process.platform === 'darwin' ? 'Meta' : 'Control'
    await page.keyboard.down(mod)
    await page.keyboard.press('KeyA')
    await page.keyboard.up(mod)
    await sleep(rand(40, 90))
    await page.keyboard.press('Backspace')
    await sleep(rand(60, 140))
  }

  // 分段输入，偶尔短暂停顿，模拟打字节奏
  for (const ch of text) {
    await page.keyboard.type(ch, { delay: rand(delayMin, delayMax) })
    if (ch === '\n' || ch === '，' || ch === '。' || ch === '、') {
      await sleep(rand(80, 220))
    }
  }
  await sleep(rand(100, 250))
}

export async function humanTypeBySelectors(
  page: Page,
  selectors: string[],
  text: string,
  opts?: { clear?: boolean }
): Promise<boolean> {
  for (const sel of selectors) {
    try {
      const loc = page.locator(sel).first()
      if (!(await loc.isVisible({ timeout: 1500 }))) continue
      await humanTypeInto(page, loc, text, opts)
      return true
    } catch {
      // next
    }
  }
  return false
}

/**
 * 上传：先鼠标点「上传」相关按钮，再对隐藏 file input 设文件。
 * OS 文件选择框无法真实模拟，setInputFiles 是必要兜底。
 */
export async function humanUploadFiles(
  page: Page,
  paths: string[],
  opts?: { fileInputSelector?: string; triggerTexts?: string[] }
): Promise<void> {
  const triggers = opts?.triggerTexts ?? ['上传图文', '上传图片', '上传', '添加图片', '从本地上传']
  await humanClickText(page, triggers).catch(() => false)
  await sleep(rand(300, 700))

  const input = opts?.fileInputSelector
    ? page.locator(opts.fileInputSelector).first()
    : page.locator('input[type=file]').first()

  await input.waitFor({ state: 'attached', timeout: 10_000 })
  await input.setInputFiles(paths)
  await sleep(rand(800, 1500))
}
