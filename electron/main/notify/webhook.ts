/**
 * 通用 Webhook 通知（企业微信/钉钉/自定义 HTTP 均可自配 URL）。
 * 发送 JSON：{ text, title?, channel: 'webhook' }
 */
import { postHttpJson } from '../net/http-client'

export async function postGenericWebhookText(opts: {
  webhookUrl: string
  secret?: string
  title?: string
  text: string
}): Promise<void> {
  const body: Record<string, unknown> = {
    msg_type: 'text',
    text: opts.text,
    title: opts.title,
    channel: 'webhook'
  }
  // 部分机器人用 secret 作为 Authorization Bearer
  const headers: Record<string, string> = {}
  if (opts.secret?.trim()) {
    headers.Authorization = `Bearer ${opts.secret.trim()}`
  }
  await postHttpJson(opts.webhookUrl, body, {
    headers,
    timeoutMs: 15_000
  })
}
