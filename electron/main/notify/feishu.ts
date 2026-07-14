import { createHmac } from 'crypto'

/**
 * 飞书自定义机器人签名。
 * 文档：timestamp + "\n" + secret 做 HMAC-SHA256（key 为签名串，对空内容摘要），再 base64。
 */
export function queryFeishuSign(secret: string, timestamp: string): string {
  const stringToSign = `${timestamp}\n${secret}`
  return createHmac('sha256', stringToSign).digest('base64')
}

type FeishuWebhookResponse = {
  code?: number
  msg?: string
  /** 旧版兼容字段 */
  StatusCode?: number
  StatusMessage?: string
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
  const data = (await res.json().catch(() => ({}))) as FeishuWebhookResponse
  // 新版用 code；旧版可能只有 StatusCode。任一非 0 即失败。
  const bizCode = data.code ?? data.StatusCode
  if (!res.ok || (bizCode != null && bizCode !== 0)) {
    const detail =
      data.msg || data.StatusMessage || `飞书通知失败 HTTP ${res.status}`
    // 常见业务错误给出可操作提示
    if (bizCode === 19021) {
      throw new Error('签名校验失败：请核对签名密钥，或关闭机器人「签名校验」后重试')
    }
    if (bizCode === 19024) {
      throw new Error('未命中自定义关键词：请在机器人安全设置中查看关键词，并在消息中包含该词')
    }
    if (bizCode === 19022) {
      throw new Error('IP 不在白名单：本机出口 IP 未加入飞书机器人白名单')
    }
    throw new Error(detail)
  }
}
