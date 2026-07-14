import { createHmac } from 'crypto'

/**
 * 飞书自定义机器人签名。
 * 文档：timestamp + "\n" + secret 做 HMAC-SHA256，再 base64。
 */
export function queryFeishuSign(secret: string, timestamp: string): string {
  const stringToSign = `${timestamp}\n${secret}`
  return createHmac('sha256', stringToSign).digest('base64')
}

/** 通过飞书自定义机器人 Webhook 发送纯文本 */
export async function postFeishuWebhookText(opts: {
  webhookUrl: string
  secret?: string
  text: string
}): Promise<void> {
  const body: Record<string, unknown> = {
    msg_type: 'text',
    content: { text: opts.text }
  }
  if (opts.secret?.trim()) {
    const timestamp = String(Math.floor(Date.now() / 1000))
    body.timestamp = timestamp
    body.sign = queryFeishuSign(opts.secret.trim(), timestamp)
  }
  const res = await fetch(opts.webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  const data = (await res.json().catch(() => ({}))) as { code?: number; msg?: string }
  // 飞书成功通常 code===0
  if (!res.ok || (data.code != null && data.code !== 0)) {
    throw new Error(data.msg || `飞书通知失败 HTTP ${res.status}`)
  }
}
