import { join } from 'path'
import type { Page } from 'playwright'
import { getArtifactsDir } from '../store/paths'
import {
  assertXhsBehaviorAllowed,
  postRecordXhsBehavior,
  queryXhsOffPeakPublishWarning
} from '../store/xhs-behavior-guard'
import { getBrowserService } from './service'
import { humanMicroPause, humanStepPause } from './human-behavior'
import {
  humanTypeBySelectors,
  humanTypeInto
} from './human-input'
import { postVaryXhsPublishImages } from './xhs-image-variation'
import { runXhsWarmupBrowse } from './xhs-warmup-path'
import {
  XHS_PUBLISH_URL,
  clickXhsConfirmDialog,
  clickXhsImageTab,
  clickXhsPublishButton,
  dwellBeforeXhsPublish,
  keyboardSubmitXhsPublish,
  removeXhsPopoverOverlay,
  scrollXhsPublishFooterIntoView,
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
      tasks: Array<{ id: string; title: string; status: 'pending' | 'running' | 'done' | 'failed' | 'skipped' }>
    ) => Array<{ id: string; title: string; status: 'pending' | 'running' | 'done' | 'failed' | 'skipped' }>
  ) => void
  signal?: AbortSignal
}

function assertNotAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new Error('用户已中止')
}

/**
 * 小红书图文发布：浏览热身 → 拟人操作 → 频次/作息校验。
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

  // 作息与发布频次（深夜 0-6 点硬阻断，日/周上限硬阻断）
  assertXhsBehaviorAllowed('publish')
  const offPeakWarn = queryXhsOffPeakPublishWarning()

  const setTasks = (
    items: Array<{ id: string; title: string; status: 'pending' | 'running' | 'done' | 'failed' | 'skipped' }>
  ) => updateTasks(() => items)

  setTasks([
    { id: '0', title: '模拟浏览热身（发现页）', status: 'running' },
    { id: '1', title: '打开小红书创作平台', status: 'pending' },
    { id: '2', title: '确认登录状态', status: 'pending' },
    { id: '3', title: '切换图文并上传配图', status: 'pending' },
    { id: '4', title: '填写标题正文并发布', status: 'pending' }
  ])

  const browser = getBrowserService()
  const page = await browser.ensureStarted()
  assertNotAborted(signal)

  // 非直达：先走发现页完整浏览链路
  let warmupMsg = ''
  try {
    warmupMsg = await runXhsWarmupBrowse(page, { signal })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('用户已中止') || msg.includes('深夜静默')) throw e
    warmupMsg = `浏览热身部分跳过：${msg}`
  }

  setTasks([
    { id: '0', title: '模拟浏览热身（发现页）', status: 'done' },
    { id: '1', title: '打开小红书创作平台', status: 'running' },
    { id: '2', title: '确认登录状态', status: 'pending' },
    { id: '3', title: '切换图文并上传配图', status: 'pending' },
    { id: '4', title: '填写标题正文并发布', status: 'pending' }
  ])

  await browser.navigate(XHS_PUBLISH_URL)
  await page.waitForLoadState('domcontentloaded').catch(() => undefined)
  await humanStepPause({ min: 2000, max: 5000 })
  assertNotAborted(signal)

  setTasks([
    { id: '0', title: '模拟浏览热身（发现页）', status: 'done' },
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
    await humanStepPause({ min: 2000, max: 4500 })
  }

  setTasks([
    { id: '0', title: '模拟浏览热身（发现页）', status: 'done' },
    { id: '1', title: '打开小红书创作平台', status: 'done' },
    { id: '2', title: '确认登录状态', status: 'done' },
    { id: '3', title: '切换图文并上传配图', status: 'running' },
    { id: '4', title: '填写标题正文并发布', status: 'pending' }
  ])

  await removeXhsPopoverOverlay(page)
  const tabOk = await clickXhsImageTab(page)
  if (!tabOk) {
    return (
      '未能切换到「上传图文」TAB（可能被浮层遮挡或页面改版）。' +
      '请在智能体浏览器中手动点击「上传图文」后，用 browser_snapshot 继续。'
    )
  }

  await humanMicroPause()
  const inputCount = await page.locator('input[type=file], .upload-input').count()
  if (inputCount === 0) {
    return (
      '已切换图文 TAB，但未找到上传控件。页面结构可能已变更。' +
      '请用 browser_snapshot 查看当前页，再用 browser_upload 手动上传。'
    )
  }

  // 配图差异化：微裁剪/缩放，降低批量同质化风险
  const variedDir = join(getArtifactsDir(), 'xhs-varied', String(Date.now()))
  const uploadPaths = postVaryXhsPublishImages(imagePaths, variedDir)

  try {
    await uploadXhsImages(page, uploadPaths)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return `切换图文 TAB 成功，但上传配图失败：${msg}`
  }
  await humanStepPause({ min: 2000, max: 6000 })
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
    titleText,
    { delayMin: 45, delayMax: 130 }
  )
  if (!titleFilled) {
    const editable = page.locator('[contenteditable="true"]').first()
    if (await editable.isVisible({ timeout: 2000 }).catch(() => false)) {
      await humanTypeInto(page, editable, titleText, { delayMin: 45, delayMax: 130 })
    }
  }

  await humanStepPause({ min: 2000, max: 5000 })

  const bodyFilled = await humanTypeBySelectors(
    page,
    [
      'div[contenteditable="true"]',
      'textarea[placeholder*="正文"]',
      'textarea[placeholder*="输入"]',
      '[class*="editor"] [contenteditable="true"]'
    ],
    content,
    { delayMin: 40, delayMax: 120 }
  )
  if (!bodyFilled) {
    return (
      `配图已上传，但未能自动定位标题/正文输入框。` +
      `标题草稿: ${title}\n正文草稿: ${content}\n` +
      `请用 browser_snapshot + browser_type 继续填写。`
    )
  }

  // 填写完成后停留检查，模拟真人审阅
  await humanStepPause({ min: 3000, max: 8000 })

  setTasks([
    { id: '0', title: '模拟浏览热身（发现页）', status: 'done' },
    { id: '1', title: '打开小红书创作平台', status: 'done' },
    { id: '2', title: '确认登录状态', status: 'done' },
    { id: '3', title: '切换图文并上传配图', status: 'done' },
    { id: '4', title: '填写标题正文并发布', status: 'running' }
  ])

  if (!autoPublish) {
    await scrollXhsPublishFooterIntoView(page)
    await dwellBeforeXhsPublish(page)
    setTasks([
      { id: '0', title: '模拟浏览热身（发现页）', status: 'done' },
      { id: '1', title: '打开小红书创作平台', status: 'done' },
      { id: '2', title: '确认登录状态', status: 'done' },
      { id: '3', title: '切换图文并上传配图', status: 'done' },
      { id: '4', title: '填写标题正文并发布', status: 'pending' }
    ])
    return (
      `已切换图文 TAB 并填写标题与正文，配图 ${uploadPaths.length} 张，停在待发布状态（autoPublish=false）。` +
      `页面已拟人滚到底部并停留确认；用户可在浏览器中检查后手动点「发布」。` +
      `${warmupMsg ? `\n${warmupMsg}` : ''}` +
      `${offPeakWarn ? `\n⚠️ ${offPeakWarn}` : ''}`
    )
  }

  if (!fullAccess) {
    // 先滚到底让用户看见发布条；真正点发布前的停留在 clickXhsPublishButton 内
    await scrollXhsPublishFooterIntoView(page)
    await emitAwaitUser('内容已填好，页面已滚到底部发布栏。确认无误后点击「继续」，将触发小红书「发布」操作。')
    assertNotAborted(signal)
  }

  await removeXhsPopoverOverlay(page)
  await humanMicroPause()

  // 内部：分段滚到底 → 底栏停留约 3.5～9 秒 → 再点发布
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

  await humanStepPause({ min: 2500, max: 5000 })
  postRecordXhsBehavior('publish')

  setTasks([
    { id: '0', title: '模拟浏览热身（发现页）', status: 'done' },
    { id: '1', title: '打开小红书创作平台', status: 'done' },
    { id: '2', title: '确认登录状态', status: 'done' },
    { id: '3', title: '切换图文并上传配图', status: 'done' },
    { id: '4', title: '填写标题正文并发布', status: 'done' }
  ])

  return (
    `已触发发布流程。标题「${title}」。请在智能体浏览器中确认是否发布成功。` +
    `${warmupMsg ? `\n${warmupMsg}` : ''}` +
    `${offPeakWarn ? `\n⚠️ ${offPeakWarn}` : ''}` +
    `【执行完毕】`
  )
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
