/**
 * 通用 Webhook 通知（企业微信/钉钉/自定义 HTTP 均可自配 URL）。
 * 发送 JSON：{ text, title?, channel: 'webhook' }
 */
import { postHttpJson } from '../net/http-client'

/** 组装通用 Webhook 请求路径与 JSON 请求体，供发送与历史上下文记录复用 */
export function queryGenericWebhookRequest(opts: {
  webhookUrl: string
  secret?: string
  title?: string
  text: string
}): {
  requestPath: string
  requestBody: Record<string, unknown>
  requestHeaders: Record<string, string>
} {
  const requestBody: Record<string, unknown> = {
    msg_type: 'text',
    text: opts.text,
    title: opts.title,
    channel: 'webhook'
  }
  // 部分机器人用 secret 作为 Authorization Bearer
  const requestHeaders: Record<string, string> = {}
  if (opts.secret?.trim()) {
    requestHeaders.Authorization = `Bearer ${opts.secret.trim()}`
  }
  return { requestPath: opts.webhookUrl, requestBody, requestHeaders }
}

export async function postGenericWebhookText(opts: {
  webhookUrl: string
  secret?: string
  title?: string
  text: string
}): Promise<void> {
  const { requestPath, requestBody, requestHeaders } = queryGenericWebhookRequest(opts)
  await postHttpJson(requestPath, requestBody, {
    headers: requestHeaders,
    timeoutMs: 15_000
  })
}
