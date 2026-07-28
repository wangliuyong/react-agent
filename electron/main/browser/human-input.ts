import { readFileSync } from 'fs'
import { basename, extname } from 'path'
import type { Locator, Page } from 'playwright'
import { humanBezierMoveTo, humanGaussianPause, rand, sleep } from './human-behavior'
import { queryHumanTypeDelayMs } from './xhs-content-rewrite'

/** 按扩展名推断拖放用的 MIME（创作者中心会校验 type） */
export function queryMimeTypeFromFilePath(filePath: string): string {
  const ext = extname(filePath).toLowerCase()
  const map: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
    '.avif': 'image/avif'
  }
  return map[ext] ?? 'application/octet-stream'
}

/**
 * 拟人鼠标/键盘：贝塞尔移动轨迹 + 真实 click/type，避免 locator.fill / 瞬时 click。
 * 用于小红书发布等需要「像用户操作」的场景。
 */
export async function humanMoveTo(
  page: Page,
  target: { x: number; y: number },
  _steps = 18
): Promise<void> {
  await humanBezierMoveTo(page, target)
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

/** 在页面绝对坐标处拟人点击（用于 closed shadow 宿主坐标兜底） */
export async function humanClickAt(page: Page, x: number, y: number): Promise<void> {
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
  const useLegacyDelay = opts?.delayMin != null || opts?.delayMax != null
  const delayMin = opts?.delayMin ?? 60
  const delayMax = opts?.delayMax ?? 80

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

  // 逐字键盘输入（禁止 fill/整段粘贴），每字高斯微停顿
  for (const ch of text) {
    const perCharDelay = useLegacyDelay ? rand(delayMin, delayMax) : queryHumanTypeDelayMs()
    await page.keyboard.type(ch, { delay: perCharDelay })
    if (ch === '\n' || ch === '，' || ch === '。' || ch === '、') {
      await humanGaussianPause(0.12, 0.05)
    }
  }
  await sleep(rand(100, 250))
}

export async function humanTypeBySelectors(
  page: Page,
  selectors: string[],
  text: string,
  opts?: { clear?: boolean; delayMin?: number; delayMax?: number }
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
 * 将本地文件以「拖入」方式放到目标区域（模拟 OS 拖文件进浏览器）。
 * 派发 dragenter → dragover → drop，DataTransfer 携带真实 File。
 * 用于抖音创作者中心等明确提示「将图片拖入此区域」的上传区。
 */
export async function humanDropLocalFiles(
  page: Page,
  dropTarget: Locator,
  paths: string[]
): Promise<void> {
  if (!paths.length) return

  await dropTarget.waitFor({ state: 'visible', timeout: 12_000 })
  await dropTarget.scrollIntoViewIfNeeded().catch(() => undefined)

  const box = await dropTarget.boundingBox()
  if (box) {
    // 鼠标先移入投放区，更接近真人拖放
    await humanMoveTo(page, {
      x: box.x + box.width * rand(0.4, 0.6),
      y: box.y + box.height * rand(0.4, 0.6)
    })
    await sleep(rand(80, 180))
  }

  const payloads = paths.map((p) => ({
    name: basename(p),
    mimeType: queryMimeTypeFromFilePath(p),
    // base64 避免大图用 number[] 序列化占内存
    b64: readFileSync(p).toString('base64')
  }))

  await dropTarget.evaluate((el, files) => {
    const dt = new DataTransfer()
    for (const f of files) {
      const binary = atob(f.b64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      dt.items.add(new File([bytes], f.name, { type: f.mimeType }))
    }
    // dragover 需可取消，部分上传组件在 dragover 里 preventDefault 后才接受 drop
    for (const type of ['dragenter', 'dragover', 'drop'] as const) {
      el.dispatchEvent(
        new DragEvent(type, {
          bubbles: true,
          cancelable: true,
          dataTransfer: dt
        })
      )
    }
  }, payloads)

  await sleep(rand(900, 1600))
}

/**
 * 上传本地文件。
 * 优先直接对隐藏 file input 调 setInputFiles（不弹 OS 框）。
 * 若 input 尚未挂载、必须点击触发：用 filechooser 接管，禁止裸点「上传」导致原生对话框卡住。
 */
export async function humanUploadFiles(
  page: Page,
  paths: string[],
  opts?: { fileInputSelector?: string; triggerTexts?: string[] }
): Promise<void> {
  const triggers = opts?.triggerTexts ?? ['上传图文', '上传图片', '上传', '添加图片', '从本地上传']
  const input = opts?.fileInputSelector
    ? page.locator(opts.fileInputSelector).first()
    : page.locator('input[type=file]').first()

  const attached = await input.waitFor({ state: 'attached', timeout: 3_000 }).then(
    () => true,
    () => false
  )
  if (attached) {
    await input.setInputFiles(paths)
    await sleep(rand(800, 1500))
    return
  }

  let trigger = null as ReturnType<Page['getByText']> | null
  for (const text of triggers) {
    const loc = page.getByText(text, { exact: false }).first()
    if (await loc.isVisible({ timeout: 1200 }).catch(() => false)) {
      trigger = loc
      break
    }
  }
  if (!trigger) {
    // 最后再等一次 input（部分站点延迟挂载）
    await input.waitFor({ state: 'attached', timeout: 10_000 })
    await input.setInputFiles(paths)
    await sleep(rand(800, 1500))
    return
  }

  const chooserPromise = page.waitForEvent('filechooser', { timeout: 12_000 })
  await humanClickLocator(page, trigger)
  const chooser = await chooserPromise
  await chooser.setFiles(paths)
  await sleep(rand(800, 1500))
}
