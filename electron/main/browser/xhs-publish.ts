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
import { queryClampXhsPublishText } from './xhs-content-limits'
import {
  type XhsPublishType,
  XHS_PUBLISH_TYPE_LABELS,
  clickXhsConfirmDialog,
  clickXhsImageTab,
  clickXhsPublishButton,
  dwellBeforeXhsPublish,
  ensureXhsArticleEditor,
  keyboardSubmitXhsPublish,
  queryBuildXhsPublishUrl,
  queryInferXhsPublishType,
  queryIsXhsImagePublishMode,
  removeXhsPopoverOverlay,
  scrollXhsPublishFooterIntoView,
  uploadXhsImages,
  uploadXhsMediaFiles
} from './xhs-dom'

export interface PublishXhsParams {
  title: string
  content: string
  /** 图文配图本地路径 */
  imagePaths?: string[]
  /** 视频本地路径（publishType=video） */
  videoPaths?: string[]
  /** 播客音频本地路径（publishType=audio） */
  audioPaths?: string[]
  /**
   * 发布类型：image / video / article / audio。
   * 未传时由 queryInferXhsPublishType 根据素材与正文推断。
   */
  publishType?: XhsPublishType | string
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

type TaskItem = {
  id: string
  title: string
  status: 'pending' | 'running' | 'done' | 'failed' | 'skipped'
}

function assertNotAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new Error('用户已中止')
}

/**
 * 小红书发布：按类型直达官方入口 → 拟人填充 → 频次/作息校验。
 * 入口：
 * - 图文 https://creator.xiaohongshu.com/publish/publish?from=menu&target=image
 * - 视频 ...&target=video
 * - 长文 ...&target=article
 * - 播客 ...&target=audio
 */
export async function publishXhsNote(params: PublishXhsParams): Promise<string> {
  const {
    title,
    content,
    imagePaths = [],
    videoPaths = [],
    audioPaths = [],
    autoPublish,
    fullAccess,
    emitAwaitUser,
    updateTasks,
    signal
  } = params

  const publishType = queryInferXhsPublishType({
    publishType: params.publishType,
    imagePaths,
    videoPaths,
    audioPaths,
    content
  })
  const typeLabel = XHS_PUBLISH_TYPE_LABELS[publishType]
  const publishUrl = queryBuildXhsPublishUrl(publishType)

  // 作息与发布频次（深夜 0-6 点硬阻断，日/周上限硬阻断）
  assertXhsBehaviorAllowed('publish')
  const offPeakWarn = queryXhsOffPeakPublishWarning()

  const setTasks = (items: TaskItem[]) => updateTasks(() => items)

  const mediaStepTitle =
    publishType === 'image'
      ? '切换图文并上传配图'
      : publishType === 'video'
        ? '打开视频页并上传视频'
        : publishType === 'audio'
          ? '打开播客页并上传音频'
          : '打开长文页并进入编辑器'

  setTasks([
    { id: '0', title: `打开小红书创作平台（${typeLabel}）`, status: 'running' },
    { id: '1', title: '确认登录状态', status: 'pending' },
    { id: '2', title: mediaStepTitle, status: 'pending' },
    { id: '3', title: '填写标题正文并发布', status: 'pending' }
  ])

  const browser = getBrowserService()
  const page = await browser.ensureStarted()
  assertNotAborted(signal)

  // 按类型直达官方菜单入口（from=menu&target=*）
  await browser.navigate(publishUrl)
  await page.waitForLoadState('domcontentloaded').catch(() => undefined)
  await humanStepPause({ min: 2000, max: 5000 })
  assertNotAborted(signal)

  setTasks([
    { id: '0', title: `打开小红书创作平台（${typeLabel}）`, status: 'done' },
    { id: '1', title: '确认登录状态', status: 'running' },
    { id: '2', title: mediaStepTitle, status: 'pending' },
    { id: '3', title: '填写标题正文并发布', status: 'pending' }
  ])

  const needLogin = await detectNeedLogin(page)
  if (needLogin) {
    await emitAwaitUser(
      '检测到未登录小红书。请在右侧「智能体浏览器」或弹出的 Chromium 窗口中完成登录，然后点击「继续」。'
    )
    assertNotAborted(signal)
    await browser.navigate(publishUrl)
    await humanStepPause({ min: 2000, max: 4500 })
  }

  setTasks([
    { id: '0', title: `打开小红书创作平台（${typeLabel}）`, status: 'done' },
    { id: '1', title: '确认登录状态', status: 'done' },
    { id: '2', title: mediaStepTitle, status: 'running' },
    { id: '3', title: '填写标题正文并发布', status: 'pending' }
  ])

  await removeXhsPopoverOverlay(page)

  // —— 按类型准备素材 / 编辑器 ——
  let mediaSummary = ''
  if (publishType === 'image') {
    const prep = await prepareImagePublish(page, imagePaths)
    if (prep.error) return prep.error
    mediaSummary = prep.summary
  } else if (publishType === 'video') {
    const prep = await prepareVideoPublish(page, videoPaths)
    if (prep.error) return prep.error
    mediaSummary = prep.summary
  } else if (publishType === 'audio') {
    const prep = await prepareAudioPublish(page, audioPaths)
    if (prep.error) return prep.error
    mediaSummary = prep.summary
  } else {
    const prep = await prepareArticlePublish(page)
    if (prep.error) return prep.error
    mediaSummary = prep.summary
  }

  await humanStepPause({ min: 1500, max: 4000 })
  assertNotAborted(signal)

  // —— 按平台字数上限截断后再填写（避免超限导致无法发布） ——
  const clamped = queryClampXhsPublishText({ title, content, publishType })
  const titleText = clamped.title
  const contentText = clamped.content
  const clampNote =
    clamped.titleTruncated || clamped.contentTruncated
      ? `已按上限截断（标题≤${clamped.titleMax}、正文≤${clamped.contentMax}）。`
      : ''

  // —— 填写标题 / 正文（各类型共用启发式 selector） ——
  const titleFilled = await humanTypeBySelectors(
    page,
    [
      'input[placeholder*="标题"]',
      'textarea[placeholder*="标题"]',
      'div.title-container input',
      '[class*="title"] input',
      '[class*="title"] textarea',
      'input[placeholder*="填写标题"]'
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

  await humanStepPause({ min: 1500, max: 4000 })

  const bodyFilled = await humanTypeBySelectors(
    page,
    [
      'div[contenteditable="true"]',
      'textarea[placeholder*="正文"]',
      'textarea[placeholder*="输入"]',
      'textarea[placeholder*="描述"]',
      'textarea[placeholder*="说说"]',
      '[class*="editor"] [contenteditable="true"]'
    ],
    contentText,
    { delayMin: 40, delayMax: 120 }
  )
  if (!bodyFilled) {
    return (
      `${mediaSummary}已打开「${typeLabel}」页（${publishUrl}），但未能自动定位标题/正文输入框。` +
      `${clampNote}` +
      `标题草稿: ${titleText}\n正文草稿: ${contentText}\n` +
      `请用 browser_snapshot + browser_type 继续填写。`
    )
  }

  await humanStepPause({ min: 2500, max: 6000 })

  setTasks([
    { id: '0', title: `打开小红书创作平台（${typeLabel}）`, status: 'done' },
    { id: '1', title: '确认登录状态', status: 'done' },
    { id: '2', title: mediaStepTitle, status: 'done' },
    { id: '3', title: '填写标题正文并发布', status: 'running' }
  ])

  if (!autoPublish) {
    await scrollXhsPublishFooterIntoView(page)
    await dwellBeforeXhsPublish(page)
    setTasks([
      { id: '0', title: `打开小红书创作平台（${typeLabel}）`, status: 'done' },
      { id: '1', title: '确认登录状态', status: 'done' },
      { id: '2', title: mediaStepTitle, status: 'done' },
      { id: '3', title: '填写标题正文并发布', status: 'pending' }
    ])
    return (
      `已按「${typeLabel}」打开创作台并填写标题与正文（${publishUrl}）。` +
      `${mediaSummary}${clampNote}` +
      `停在待发布状态（autoPublish=false）。` +
      `页面已拟人滚到底部并停留确认；用户可在浏览器中检查后手动点「发布」。` +
      `${offPeakWarn ? `\n⚠️ ${offPeakWarn}` : ''}`
    )
  }

  if (!fullAccess) {
    await scrollXhsPublishFooterIntoView(page)
    await emitAwaitUser(
      `内容已填好（类型：${typeLabel}），页面已滚到底部发布栏。确认无误后点击「继续」，将触发小红书「发布」操作。`
    )
    assertNotAborted(signal)
  }

  await removeXhsPopoverOverlay(page)
  await humanMicroPause()

  let published = await clickXhsPublishButton(page)
  if (!published) {
    published = await keyboardSubmitXhsPublish(page)
    if (published) await clickXhsConfirmDialog(page)
  }

  if (!published) {
    return (
      `未能触发「发布」（创作台使用 closed Shadow DOM 的 xhs-publish-btn）。` +
      `类型「${typeLabel}」内容应已填好，请在右侧浏览器手动点击底部红色「发布」按钮。`
    )
  }

  await humanStepPause({ min: 2500, max: 5000 })
  postRecordXhsBehavior('publish')

  // 发布已触发：关闭有头浏览器，避免窗口长期占用与 profile 锁残留
  await browser.closeHeaded()

  setTasks([
    { id: '0', title: `打开小红书创作平台（${typeLabel}）`, status: 'done' },
    { id: '1', title: '确认登录状态', status: 'done' },
    { id: '2', title: mediaStepTitle, status: 'done' },
    { id: '3', title: '填写标题正文并发布', status: 'done' }
  ])

  return (
    `已触发「${typeLabel}」发布流程。标题「${titleText}」。入口 ${publishUrl}。` +
    `${clampNote}` +
    `智能体浏览器已自动关闭。` +
    `${offPeakWarn ? `\n⚠️ ${offPeakWarn}` : ''}` +
    `【执行完毕】`
  )
}

async function prepareImagePublish(
  page: Page,
  imagePaths: string[]
): Promise<{ error?: string; summary: string }> {
  if (!imagePaths.length) {
    return {
      error:
        '图文发布缺少配图。请先 fetch_web_images，或传入 imagePaths / imageSourceUrl / imageUrls。',
      summary: ''
    }
  }

  const tabOk = await clickXhsImageTab(page)
  const onImage = tabOk || (await queryIsXhsImagePublishMode(page))
  if (!onImage) {
    return {
      error:
        '未能进入「上传图文」页（可能被浮层遮挡、草稿恢复到视频页或页面改版）。' +
        '请手动打开：https://creator.xiaohongshu.com/publish/publish?from=menu&target=image' +
        '，或清空草稿箱后重试。',
      summary: ''
    }
  }

  const inputCount = await page.locator('input[type=file], .upload-input').count()
  if (inputCount === 0) {
    return {
      error: '已打开图文页，但未找到上传控件。请用 browser_snapshot 排查后 browser_upload。',
      summary: ''
    }
  }

  const variedDir = join(getArtifactsDir(), 'xhs-varied', String(Date.now()))
  const uploadPaths = postVaryXhsPublishImages(imagePaths, variedDir)
  try {
    await uploadXhsImages(page, uploadPaths)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { error: `图文页打开成功，但上传配图失败：${msg}`, summary: '' }
  }
  return { summary: `配图 ${uploadPaths.length} 张。` }
}

async function prepareVideoPublish(
  page: Page,
  videoPaths: string[]
): Promise<{ error?: string; summary: string }> {
  if (!videoPaths.length) {
    return {
      error:
        '视频发布缺少本地视频文件。请在 xhs_publish_note 传入 videoPaths（绝对路径），' +
        '并将 publishType 设为 video。',
      summary: ''
    }
  }
  const inputCount = await page.locator('input[type=file], .upload-input').count()
  if (inputCount === 0) {
    return {
      error:
        '已打开视频发布页，但未找到上传控件。请确认入口为 ' +
        'https://creator.xiaohongshu.com/publish/publish?from=menu&target=video',
      summary: ''
    }
  }
  try {
    await uploadXhsMediaFiles(page, videoPaths)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { error: `视频上传失败：${msg}`, summary: '' }
  }
  return { summary: `视频 ${videoPaths.length} 个。` }
}

async function prepareAudioPublish(
  page: Page,
  audioPaths: string[]
): Promise<{ error?: string; summary: string }> {
  if (!audioPaths.length) {
    return {
      error:
        '播客发布缺少本地音频文件。请在 xhs_publish_note 传入 audioPaths，' +
        '并将 publishType 设为 audio。',
      summary: ''
    }
  }
  const inputCount = await page.locator('input[type=file], .upload-input').count()
  if (inputCount === 0) {
    return {
      error:
        '已打开播客发布页，但未找到上传控件。请确认入口为 ' +
        'https://creator.xiaohongshu.com/publish/publish?from=menu&target=audio',
      summary: ''
    }
  }
  try {
    await uploadXhsMediaFiles(page, audioPaths)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { error: `音频上传失败：${msg}`, summary: '' }
  }
  return { summary: `音频 ${audioPaths.length} 个。` }
}

async function prepareArticlePublish(
  page: Page
): Promise<{ error?: string; summary: string }> {
  const ok = await ensureXhsArticleEditor(page)
  if (!ok) {
    return {
      error:
        '已打开长文入口，但未能进入编辑器。请手动点击「新的创作」，或打开：' +
        'https://creator.xiaohongshu.com/publish/publish?from=menu&target=article',
      summary: ''
    }
  }
  return { summary: '已进入长文编辑器。' }
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
