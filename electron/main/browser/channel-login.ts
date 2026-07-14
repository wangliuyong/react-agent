import type { Page } from 'playwright'
import {
  getPublishChannels,
  normalizeChannelKind,
  queryPublishChannelMeta,
  type PublishChannelId
} from '../../../shared/publish-channels'
import type { BrowserStatus, ChannelLoginStatus } from '../../../shared/types'
import { getBrowserService } from './service'

/**
 * 检测页面是否处于未登录态。
 * 与 xhs-publish / douyin-publish 内逻辑保持一致：URL 含 login 或可见登录入口且无编辑器。
 */
async function detectNeedLogin(page: Page): Promise<boolean> {
  const url = page.url()
  if (/login|passport|signin|sso/i.test(url)) return true

  const loginVisible = await page
    .getByText(/登录|扫码登录|手机号登录/, { exact: false })
    .first()
    .isVisible()
    .catch(() => false)

  const editorVisible = await page
    .locator(
      'div.upload-content, input[type=file], [contenteditable="true"], textarea'
    )
    .first()
    .isVisible()
    .catch(() => false)

  if (editorVisible) return false
  return loginVisible
}

/**
 * 对单个渠道执行登录态检测：打开创作者中心并判断是否需要登录。
 */
export async function queryChannelLoginStatus(
  channelId: PublishChannelId
): Promise<ChannelLoginStatus> {
  const meta = queryPublishChannelMeta(channelId)
  const checkedAt = Date.now()

  if (!meta.enabled || !meta.loginCheckUrl) {
    return {
      channelId,
      state: 'unsupported',
      checkedAt,
      message: '该渠道尚未接入'
    }
  }

  try {
    const browser = getBrowserService()
    const page = await browser.ensureStarted()
    await page.goto(meta.loginCheckUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000
    })
    // 等待页面渲染登录入口或编辑器
    await page.waitForTimeout(2000)

    const needLogin = await detectNeedLogin(page)
    return {
      channelId,
      state: needLogin ? 'logged_out' : 'logged_in',
      checkedAt,
      message: needLogin ? '请在浏览器中扫码或账号登录' : '创作者中心已登录'
    }
  } catch (err) {
    return {
      channelId,
      state: 'error',
      checkedAt,
      message: err instanceof Error ? err.message : String(err)
    }
  }
}

/** 批量检测发布渠道的登录态（通知渠道无需登录；串行避免并发抢浏览器） */
export async function queryAllChannelLoginStatuses(): Promise<ChannelLoginStatus[]> {
  const results: ChannelLoginStatus[] = []
  for (const channel of getPublishChannels()) {
    if (normalizeChannelKind(channel.kind) !== 'publish') continue
    results.push(await queryChannelLoginStatus(channel.id))
  }
  return results
}

/**
 * 打开指定渠道的创作者中心，便于用户手动登录。
 * 返回当前浏览器状态供 UI 展示。
 */
export async function postOpenChannelLogin(channelId: PublishChannelId): Promise<BrowserStatus> {
  const meta = queryPublishChannelMeta(channelId)
  if (!meta.enabled || !meta.loginCheckUrl) {
    throw new Error(`${meta.label} 尚未接入，暂无法打开登录页`)
  }

  const browser = getBrowserService()
  await browser.navigate(meta.loginCheckUrl)
  return browser.getStatus()
}
