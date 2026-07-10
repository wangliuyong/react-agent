import type { Page } from 'playwright'
import { getBrowserService } from './service'
import {
  humanClickLocator,
  humanClickText,
  humanTypeBySelectors,
  humanTypeInto,
  humanUploadFiles
} from './human-input'

export interface PublishXhsParams {
  title: string
  content: string
  imagePaths: string[]
  autoPublish: boolean
  fullAccess: boolean
  emitAwaitUser: (reason: string) => Promise<void>
  updateTasks: (
    updater: (
      tasks: Array<{ id: string; title: string; status: 'pending' | 'running' | 'done' | 'failed' }>
    ) => Array<{ id: string; title: string; status: 'pending' | 'running' | 'done' | 'failed' }>
  ) => void
  signal?: AbortSignal
}

const PUBLISH_URL = 'https://creator.xiaohongshu.com/publish/publish'

function assertNotAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new Error('用户已中止')
}

/**
 * 小红书图文发布：全程拟人鼠标移动/点击 + 键盘逐字输入。
 * 不用 locator.fill / 瞬时脚本点击。
 */
export async function publishXhsNote(params: PublishXhsParams): Promise<string> {
  const {
    title,
    content,
    imagePaths,
    autoPublish,
    fullAccess,
    emitAwaitUser,
    updateTasks,
    signal
  } = params

  const setTasks = (
    items: Array<{ id: string; title: string; status: 'pending' | 'running' | 'done' | 'failed' }>
  ) => updateTasks(() => items)

  setTasks([
    { id: '1', title: '打开小红书创作平台', status: 'running' },
    { id: '2', title: '确认登录状态', status: 'pending' },
    { id: '3', title: '上传配图并填写标题正文', status: 'pending' },
    { id: '4', title: '发布并验证', status: 'pending' }
  ])

  const browser = getBrowserService()
  const page = await browser.ensureStarted()
  assertNotAborted(signal)

  await browser.navigate(PUBLISH_URL)
  await page.waitForTimeout(2000)
  assertNotAborted(signal)

  setTasks([
    { id: '1', title: '打开小红书创作平台', status: 'done' },
    { id: '2', title: '确认登录状态', status: 'running' },
    { id: '3', title: '上传配图并填写标题正文', status: 'pending' },
    { id: '4', title: '发布并验证', status: 'pending' }
  ])

  const needLogin = await detectNeedLogin(page)
  if (needLogin) {
    await emitAwaitUser(
      '检测到未登录小红书。请在右侧「智能体浏览器」或弹出的 Chromium 窗口中完成登录，然后点击「继续」。'
    )
    assertNotAborted(signal)
    await browser.navigate(PUBLISH_URL)
    await page.waitForTimeout(2000)
  }

  setTasks([
    { id: '1', title: '打开小红书创作平台', status: 'done' },
    { id: '2', title: '确认登录状态', status: 'done' },
    { id: '3', title: '上传配图并填写标题正文', status: 'running' },
    { id: '4', title: '发布并验证', status: 'pending' }
  ])

  // 鼠标点「上传图文」
  await humanClickText(page, ['上传图文', '图文'])
  await page.waitForTimeout(800)

  const inputCount = await page.locator('input[type=file]').count()
  if (inputCount === 0) {
    return (
      '未能找到上传控件。页面结构可能已变更。' +
      '请用 browser_snapshot 查看当前页，再用 browser_upload 手动上传。'
    )
  }

  // 先鼠标点上传入口，再注入本地文件（系统文件框无法真实模拟）
  await humanUploadFiles(page, imagePaths, {
    triggerTexts: ['上传图文', '上传图片', '上传', '添加图片']
  })
  await page.waitForTimeout(2000)
  assertNotAborted(signal)

  const titleText = title.slice(0, 20)
  const titleFilled = await humanTypeBySelectors(
    page,
    [
      'input[placeholder*="标题"]',
      'textarea[placeholder*="标题"]',
      '[class*="title"] input',
      '[class*="title"] textarea'
    ],
    titleText
  )
  if (!titleFilled) {
    const editable = page.locator('[contenteditable="true"]').first()
    if (await editable.isVisible({ timeout: 2000 }).catch(() => false)) {
      await humanTypeInto(page, editable, titleText)
    }
  }

  const bodyFilled = await humanTypeBySelectors(
    page,
    [
      'div[contenteditable="true"]',
      'textarea[placeholder*="正文"]',
      'textarea[placeholder*="输入"]',
      '[class*="editor"] [contenteditable="true"]'
    ],
    content
  )
  if (!bodyFilled) {
    return (
      `配图已上传，但未能自动定位标题/正文输入框。` +
      `标题草稿: ${title}\n正文草稿: ${content}\n` +
      `请用 browser_snapshot + browser_type 继续填写。`
    )
  }

  setTasks([
    { id: '1', title: '打开小红书创作平台', status: 'done' },
    { id: '2', title: '确认登录状态', status: 'done' },
    { id: '3', title: '上传配图并填写标题正文', status: 'done' },
    { id: '4', title: '发布并验证', status: 'running' }
  ])

  if (!autoPublish) {
    setTasks([
      { id: '1', title: '打开小红书创作平台', status: 'done' },
      { id: '2', title: '确认登录状态', status: 'done' },
      { id: '3', title: '上传配图并填写标题正文', status: 'done' },
      { id: '4', title: '发布并验证', status: 'pending' }
    ])
    return (
      `已用鼠标/键盘填写标题与正文，配图 ${imagePaths.length} 张，停在待发布状态（autoPublish=false）。` +
      `用户可在浏览器中检查后手动点「发布」。`
    )
  }

  if (!fullAccess) {
    await emitAwaitUser('内容已填好。确认无误后点击「继续」，将用鼠标点击小红书「发布」按钮。')
    assertNotAborted(signal)
  }

  // 发布按钮：优先精确匹配，避免点到其它含「发布」的文案
  const published = await humanClickPublish(page)
  if (!published) {
    return '未能找到「发布」按钮。内容应已填好，请用户在右侧浏览器手动点击发布。'
  }

  await page.waitForTimeout(3000)

  setTasks([
    { id: '1', title: '打开小红书创作平台', status: 'done' },
    { id: '2', title: '确认登录状态', status: 'done' },
    { id: '3', title: '上传配图并填写标题正文', status: 'done' },
    { id: '4', title: '发布并验证', status: 'done' }
  ])

  return `已用鼠标点击发布。标题「${title}」。请在智能体浏览器中确认是否发布成功。【执行完毕】`
}

async function humanClickPublish(page: Page): Promise<boolean> {
  // 常见：底部红色「发布」按钮
  const candidates = [
    page.getByRole('button', { name: /^发布$/ }),
    page.locator('button').filter({ hasText: /^发布$/ }),
    page.getByText('发布笔记', { exact: false }),
    page.getByText('发布', { exact: true })
  ]

  for (const loc of candidates) {
    try {
      const target = loc.first()
      if (await target.isVisible({ timeout: 1200 })) {
        await humanClickLocator(page, target)
        return true
      }
    } catch {
      // next
    }
  }
  return humanClickText(page, ['发布笔记', '发布'])
}

async function detectNeedLogin(page: Page): Promise<boolean> {
  const url = page.url()
  if (/login|passport|signin/i.test(url)) return true
  const loginVisible = await page
    .getByText(/登录|扫码登录|手机号登录/, { exact: false })
    .first()
    .isVisible()
    .catch(() => false)
  const editorVisible = await page
    .locator('input[type=file], [contenteditable="true"], textarea')
    .first()
    .isVisible()
    .catch(() => false)
  if (editorVisible) return false
  return loginVisible
}
