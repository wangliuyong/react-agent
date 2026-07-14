import type { Page } from 'playwright'
import { getBrowserService } from './service'
import { humanTypeBySelectors, humanTypeInto } from './human-input'
import {
  DOUYIN_PUBLISH_URL,
  clickDouyinConfirmDialog,
  clickDouyinImageTab,
  clickDouyinPublishButton,
  removeDouyinOverlay,
  scrollDouyinPublishFooterIntoView,
  dwellBeforeDouyinPublish,
  uploadDouyinImages,
  queryDouyinImagePreviewCount
} from './douyin-dom'

export interface PublishDouyinParams {
  title: string
  content: string
  imagePaths: string[]
  autoPublish: boolean
  fullAccess: boolean
  emitAwaitUser: (reason: string) => Promise<void>
  updateTasks: (
    updater: (
      tasks: Array<{ id: string; title: string; status: 'pending' | 'running' | 'done' | 'failed' | 'skipped' }>
    ) => Array<{ id: string; title: string; status: 'pending' | 'running' | 'done' | 'failed' | 'skipped' }>
  ) => void
  signal?: AbortSignal
}

function assertNotAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new Error('用户已中止')
}

type TaskItem = { id: string; title: string; status: 'pending' | 'running' | 'done' | 'failed' | 'skipped' }

/**
 * 抖音图文发布：全程拟人鼠标/键盘，适配创作者中心上传页。
 * 当前仅支持图文笔记；视频上传后续单独接入。
 */
export async function publishDouyinNote(params: PublishDouyinParams): Promise<string> {
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

  const setTasks = (items: TaskItem[]) => updateTasks(() => items)

  setTasks([
    { id: '1', title: '打开抖音创作者中心', status: 'running' },
    { id: '2', title: '确认登录状态', status: 'pending' },
    { id: '3', title: '切换图文并上传配图', status: 'pending' },
    { id: '4', title: '填写文案并发布', status: 'pending' }
  ])

  const browser = getBrowserService()
  const page = await browser.ensureStarted()
  assertNotAborted(signal)

  await browser.navigate(DOUYIN_PUBLISH_URL)
  await page.waitForLoadState('domcontentloaded').catch(() => undefined)
  await page.waitForTimeout(2500)
  assertNotAborted(signal)

  setTasks([
    { id: '1', title: '打开抖音创作者中心', status: 'done' },
    { id: '2', title: '确认登录状态', status: 'running' },
    { id: '3', title: '切换图文并上传配图', status: 'pending' },
    { id: '4', title: '填写文案并发布', status: 'pending' }
  ])

  const needLogin = await detectNeedLogin(page)
  if (needLogin) {
    await emitAwaitUser(
      '检测到未登录抖音创作者中心。请在右侧「智能体浏览器」中完成登录，然后点击「继续」。'
    )
    assertNotAborted(signal)
    await browser.navigate(DOUYIN_PUBLISH_URL)
    await page.waitForTimeout(2500)
  }

  setTasks([
    { id: '1', title: '打开抖音创作者中心', status: 'done' },
    { id: '2', title: '确认登录状态', status: 'done' },
    { id: '3', title: '切换图文并上传配图', status: 'running' },
    { id: '4', title: '填写文案并发布', status: 'pending' }
  ])

  await removeDouyinOverlay(page)
  const tabOk = await clickDouyinImageTab(page)
  if (!tabOk) {
    // 部分账号默认即为图文页，继续尝试找上传控件
    const fileInputCount = await page.locator('input[type="file"]').count()
    if (fileInputCount === 0) {
      return (
        '未能切换到「发布图文」或找到上传控件（页面可能改版）。' +
        '请在智能体浏览器中手动切换到图文上传后，用 browser_snapshot 继续。'
      )
    }
  }

  await page.waitForTimeout(600)
  const inputCount = await page.locator('input[type="file"]').count()
  if (inputCount === 0) {
    return (
      '未找到图片上传控件。页面结构可能已变更。' +
      '请用 browser_snapshot 查看当前页，再用 browser_upload 手动上传。'
    )
  }

  try {
    await uploadDouyinImages(page, imagePaths)
  } catch (e) {
    const previewCount = await queryDouyinImagePreviewCount(page)
    if (previewCount > 0) {
      // 首张已进编辑态、后续 file input 超时：页面上其实已有图，继续填文案
      console.warn(
        '[douyin-publish] 上传过程报错但检测到预览图，继续填写文案:',
        e instanceof Error ? e.message : e
      )
    } else {
      const msg = e instanceof Error ? e.message : String(e)
      return `切换图文成功，但上传配图失败：${msg}`
    }
  }

  await page.waitForTimeout(1800)
  assertNotAborted(signal)

  // 抖音图文：标题常作为独立输入；正文为作品描述区（contenteditable / textarea）
  const titleText = title.slice(0, 30)
  const fullText = titleText ? `${titleText}\n${content}` : content

  const titleFilled = await humanTypeBySelectors(
    page,
    [
      'input[placeholder*="标题"]',
      'textarea[placeholder*="标题"]',
      '[class*="title"] input',
      '[class*="title"] textarea',
      'input[placeholder*="作品标题"]'
    ],
    titleText
  )

  const bodyFilled = await humanTypeBySelectors(
    page,
    [
      'div[contenteditable="true"][data-placeholder*="描述"]',
      'div[contenteditable="true"][placeholder*="描述"]',
      '[class*="desc"] [contenteditable="true"]',
      '[class*="editor"] [contenteditable="true"]',
      'textarea[placeholder*="描述"]',
      'textarea[placeholder*="作品"]',
      'textarea[placeholder*="添加"]',
      'div[contenteditable="true"]'
    ],
    titleFilled ? content : fullText
  )

  if (!bodyFilled && !titleFilled) {
    // 优先找「作品描述」文案附近的可编辑区
    const descNear = page
      .getByText(/作品描述|添加作品描述|写下作品描述/, { exact: false })
      .locator('..')
      .locator('[contenteditable="true"], textarea')
      .first()
    if (await descNear.isVisible({ timeout: 2000 }).catch(() => false)) {
      await humanTypeInto(page, descNear, fullText)
    } else {
      const editable = page.locator('[contenteditable="true"]').first()
      if (await editable.isVisible({ timeout: 2000 }).catch(() => false)) {
        await humanTypeInto(page, editable, fullText)
      } else {
        return (
          `配图已上传，但未能自动定位文案输入框。` +
          `标题草稿: ${title}\n正文草稿: ${content}\n` +
          `请用 browser_snapshot + browser_type 继续填写。`
        )
      }
    }
  }

  setTasks([
    { id: '1', title: '打开抖音创作者中心', status: 'done' },
    { id: '2', title: '确认登录状态', status: 'done' },
    { id: '3', title: '切换图文并上传配图', status: 'done' },
    { id: '4', title: '填写文案并发布', status: 'running' }
  ])

  if (!autoPublish) {
    await scrollDouyinPublishFooterIntoView(page)
    await dwellBeforeDouyinPublish(page)
    setTasks([
      { id: '1', title: '打开抖音创作者中心', status: 'done' },
      { id: '2', title: '确认登录状态', status: 'done' },
      { id: '3', title: '切换图文并上传配图', status: 'done' },
      { id: '4', title: '填写文案并发布', status: 'pending' }
    ])
    return (
      `已上传配图 ${imagePaths.length} 张并填写文案，停在待发布状态（autoPublish=false）。` +
      `页面已拟人滚到底部并停留确认；用户可在浏览器中检查后手动点「发布」。`
    )
  }

  if (!fullAccess) {
    // 先滚到底让用户能看见底栏；真正发布前的拟人停留放在 clickDouyinPublishButton 内
    await scrollDouyinPublishFooterIntoView(page)
    await emitAwaitUser('内容已填好，页面已滚到底部操作栏。确认无误后点击「继续」，将触发抖音「发布」操作。')
    assertNotAborted(signal)
  }

  await removeDouyinOverlay(page)

  // 内部：分段滚到底 → 底栏停留约 3.5～9 秒（拟人确认）→ 再点发布
  let published = await clickDouyinPublishButton(page)
  if (published) {
    await clickDouyinConfirmDialog(page)
  }

  if (!published) {
    return (
      '未能自动触发「发布」按钮（页面可能改版）。' +
      '内容应已填好，请在右侧浏览器手动点击「发布」。'
    )
  }

  await page.waitForTimeout(3000)

  setTasks([
    { id: '1', title: '打开抖音创作者中心', status: 'done' },
    { id: '2', title: '确认登录状态', status: 'done' },
    { id: '3', title: '切换图文并上传配图', status: 'done' },
    { id: '4', title: '填写文案并发布', status: 'done' }
  ])

  return `已触发抖音发布流程。标题「${title}」。请在智能体浏览器中确认是否发布成功。【执行完毕】`
}

async function detectNeedLogin(page: Page): Promise<boolean> {
  const url = page.url()
  if (/login|passport|signin|sso/i.test(url)) return true
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
