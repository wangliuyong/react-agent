import type { Page } from 'playwright'
import { getBrowserService } from './service'
import {
  humanTypeBySelectors,
  humanTypeInto
} from './human-input'
import {
  XHS_PUBLISH_URL,
  clickXhsConfirmDialog,
  clickXhsImageTab,
  clickXhsPublishButton,
  keyboardSubmitXhsPublish,
  removeXhsPopoverOverlay,
  uploadXhsImages
} from './xhs-dom'

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

function assertNotAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new Error('用户已中止')
}

/**
 * 小红书图文发布：全程拟人鼠标移动/点击 + 键盘逐字输入。
 * 适配创作台 closed Shadow DOM（xhs-publish-btn）与浮层遮挡。
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
    { id: '3', title: '切换图文并上传配图', status: 'pending' },
    { id: '4', title: '填写标题正文并发布', status: 'pending' }
  ])

  const browser = getBrowserService()
  const page = await browser.ensureStarted()
  assertNotAborted(signal)

  await browser.navigate(XHS_PUBLISH_URL)
  await page.waitForLoadState('domcontentloaded').catch(() => undefined)
  await page.waitForTimeout(2000)
  assertNotAborted(signal)

  setTasks([
    { id: '1', title: '打开小红书创作平台', status: 'done' },
    { id: '2', title: '确认登录状态', status: 'running' },
    { id: '3', title: '切换图文并上传配图', status: 'pending' },
    { id: '4', title: '填写标题正文并发布', status: 'pending' }
  ])

  const needLogin = await detectNeedLogin(page)
  if (needLogin) {
    await emitAwaitUser(
      '检测到未登录小红书。请在右侧「智能体浏览器」或弹出的 Chromium 窗口中完成登录，然后点击「继续」。'
    )
    assertNotAborted(signal)
    await browser.navigate(XHS_PUBLISH_URL)
    await page.waitForTimeout(2000)
  }

  setTasks([
    { id: '1', title: '打开小红书创作平台', status: 'done' },
    { id: '2', title: '确认登录状态', status: 'done' },
    { id: '3', title: '切换图文并上传配图', status: 'running' },
    { id: '4', title: '填写标题正文并发布', status: 'pending' }
  ])

  // 先清理浮层，再切到「上传图文」TAB（避免默认停在视频页）
  await removeXhsPopoverOverlay(page)
  const tabOk = await clickXhsImageTab(page)
  if (!tabOk) {
    return (
      '未能切换到「上传图文」TAB（可能被浮层遮挡或页面改版）。' +
      '请在智能体浏览器中手动点击「上传图文」后，用 browser_snapshot 继续。'
    )
  }

  await page.waitForTimeout(600)
  const inputCount = await page.locator('input[type=file], .upload-input').count()
  if (inputCount === 0) {
    return (
      '已切换图文 TAB，但未找到上传控件。页面结构可能已变更。' +
      '请用 browser_snapshot 查看当前页，再用 browser_upload 手动上传。'
    )
  }

  try {
    await uploadXhsImages(page, imagePaths)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return `切换图文 TAB 成功，但上传配图失败：${msg}`
  }
  await page.waitForTimeout(1500)
  assertNotAborted(signal)

  const titleText = title.slice(0, 20)
  const titleFilled = await humanTypeBySelectors(
    page,
    [
      'input[placeholder*="标题"]',
      'textarea[placeholder*="标题"]',
      'div.title-container input',
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
    { id: '3', title: '切换图文并上传配图', status: 'done' },
    { id: '4', title: '填写标题正文并发布', status: 'running' }
  ])

  if (!autoPublish) {
    setTasks([
      { id: '1', title: '打开小红书创作平台', status: 'done' },
      { id: '2', title: '确认登录状态', status: 'done' },
      { id: '3', title: '切换图文并上传配图', status: 'done' },
      { id: '4', title: '填写标题正文并发布', status: 'pending' }
    ])
    return (
      `已切换图文 TAB 并填写标题与正文，配图 ${imagePaths.length} 张，停在待发布状态（autoPublish=false）。` +
      `用户可在浏览器中检查后手动点「发布」。`
    )
  }

  if (!fullAccess) {
    await emitAwaitUser('内容已填好。确认无误后点击「继续」，将触发小红书「发布」操作。')
    assertNotAborted(signal)
  }

  await removeXhsPopoverOverlay(page)

  let published = await clickXhsPublishButton(page)
  if (!published) {
    published = await keyboardSubmitXhsPublish(page)
    if (published) await clickXhsConfirmDialog(page)
  }

  if (!published) {
    return (
      '未能触发「发布」（创作台使用 closed Shadow DOM 的 xhs-publish-btn）。' +
      '内容应已填好，请在右侧浏览器手动点击底部红色「发布」按钮。'
    )
  }

  await page.waitForTimeout(3000)

  setTasks([
    { id: '1', title: '打开小红书创作平台', status: 'done' },
    { id: '2', title: '确认登录状态', status: 'done' },
    { id: '3', title: '切换图文并上传配图', status: 'done' },
    { id: '4', title: '填写标题正文并发布', status: 'done' }
  ])

  return `已触发发布流程。标题「${title}」。请在智能体浏览器中确认是否发布成功。【执行完毕】`
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
    .locator('div.upload-content, input[type=file], [contenteditable="true"], textarea')
    .first()
    .isVisible()
    .catch(() => false)
  if (editorVisible) return false
  return loginVisible
}
