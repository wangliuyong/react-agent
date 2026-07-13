import type { Page } from 'playwright'

/** 随机数：区间 [min, max) */
export function rand(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

/** 异步休眠 */
export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

export interface StepPauseOptions {
  /** 最小毫秒，默认 2000 */
  min?: number
  /** 最大毫秒，默认 10000 */
  max?: number
}

/**
 * 自动化步骤间随机停顿（2～10 秒），打破固定间隔的机器特征。
 * 用于发布、浏览热身等关键步骤之间。
 */
export async function humanStepPause(opts?: StepPauseOptions): Promise<void> {
  const min = opts?.min ?? 2000
  const max = opts?.max ?? 10_000
  await sleep(rand(min, max))
}

/** 短停顿：表单字段切换、小操作之间 */
export async function humanMicroPause(): Promise<void> {
  await sleep(rand(400, 1200))
}

/** 三次贝塞尔曲线插值点 */
function cubicBezier(
  t: number,
  p0: number,
  p1: number,
  p2: number,
  p3: number
): number {
  const u = 1 - t
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3
}

/** ease-in-out，使起止更平滑 */
function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

export interface BezierMoveOptions {
  /** 轨迹采样步数 */
  steps?: number
  /** 控制点偏移幅度 */
  jitter?: number
}

/**
 * 贝塞尔曲线拟人鼠标移动：加速、减速、中途随机微停。
 * 替代 Playwright 默认的匀速直线 mouse.move。
 */
export async function humanBezierMoveTo(
  page: Page,
  target: { x: number; y: number },
  from?: { x: number; y: number },
  opts?: BezierMoveOptions
): Promise<void> {
  const viewport = page.viewportSize() ?? { width: 1280, height: 800 }
  const start = from ?? {
    x: rand(viewport.width * 0.2, viewport.width * 0.8),
    y: rand(viewport.height * 0.2, viewport.height * 0.7)
  }
  const jitter = opts?.jitter ?? 90
  const steps = Math.max(10, Math.floor(opts?.steps ?? rand(14, 26)))

  const cp1 = {
    x: start.x + rand(-jitter, jitter),
    y: start.y + rand(-jitter * 0.8, jitter * 0.8)
  }
  const cp2 = {
    x: target.x + rand(-jitter * 0.7, jitter * 0.7),
    y: target.y + rand(-jitter * 0.6, jitter * 0.6)
  }

  let prevT = 0
  for (let i = 1; i <= steps; i++) {
    const t = easeInOut(i / steps)
    const x = cubicBezier(t, start.x, cp1.x, cp2.x, target.x)
    const y = cubicBezier(t, start.y, cp1.y, cp2.y, target.y)
    await page.mouse.move(x, y)
    // 中途随机停顿，模拟手指微调
    if (Math.random() < 0.12) {
      await sleep(rand(40, 180))
    } else {
      await sleep(rand(8, 28))
    }
    prevT = t
  }
  void prevT
  await sleep(rand(50, 150))
}

export interface BezierScrollOptions {
  direction?: 'down' | 'up'
  /** 总滚动像素量级 */
  distance?: number
}

/**
 * 贝塞尔缓动 + 随机停顿的页面滚动，避免匀速 wheel 特征。
 */
export async function humanBezierScroll(
  page: Page,
  opts?: BezierScrollOptions
): Promise<void> {
  const direction = opts?.direction ?? 'down'
  const total =
    opts?.distance ??
    (direction === 'down' ? rand(380, 920) : rand(280, 680)) * (direction === 'up' ? -1 : 1)
  const steps = Math.floor(rand(9, 18))
  let accumulated = 0

  for (let i = 1; i <= steps; i++) {
    const t = easeInOut(i / steps)
    const prev = easeInOut((i - 1) / steps)
    const delta = total * (t - prev)
    accumulated += delta
    await page.mouse.wheel(0, delta)
    if (Math.random() < 0.22) {
      await sleep(rand(120, 480))
    } else {
      await sleep(rand(18, 55))
    }
  }

  void accumulated
  await sleep(rand(600, 2200))
}

/**
 * 模拟真人阅读停留：15 秒以上，带轻微滚动与鼠标漂移。
 */
export async function humanDwellRead(page: Page, minMs = 15_000, maxMs = 28_000): Promise<void> {
  const deadline = Date.now() + rand(minMs, maxMs)
  while (Date.now() < deadline) {
    if (Math.random() < 0.45) {
      await humanBezierScroll(page, {
        direction: Math.random() < 0.85 ? 'down' : 'up',
        distance: rand(80, 220) * (Math.random() < 0.85 ? 1 : -1)
      })
    } else {
      const vp = page.viewportSize() ?? { width: 1280, height: 800 }
      await humanBezierMoveTo(page, {
        x: rand(vp.width * 0.15, vp.width * 0.85),
        y: rand(vp.height * 0.2, vp.height * 0.75)
      })
      await sleep(rand(800, 2000))
    }
  }
}
