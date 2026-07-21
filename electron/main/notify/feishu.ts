import { createHmac } from 'crypto'
import { queryHttpResponse } from '../net/http-client'

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

/** 解析飞书 Webhook 业务错误并抛出可读异常 */
function throwFeishuWebhookError(
  data: FeishuWebhookResponse,
  httpStatus: number
): never {
  const bizCode = data.code ?? data.StatusCode
  const detail =
    data.msg || data.StatusMessage || `飞书通知失败 HTTP ${httpStatus}`
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

/**
 * 飞书自定义机器人 Webhook 通用发送。
 * 文档：https://open.feishu.cn/document/client-docs/bot-v3/add-custom-bot
 */
export async function postFeishuWebhook(opts: {
  webhookUrl: string
  secret?: string
  msgType: string
  content: Record<string, unknown>
}): Promise<void> {
  const body: Record<string, unknown> = {
    msg_type: opts.msgType,
    content: opts.content
  }
  if (opts.secret?.trim()) {
    const timestamp = String(Math.floor(Date.now() / 1000))
    body.timestamp = timestamp
    body.sign = queryFeishuSign(opts.secret.trim(), timestamp)
  }
  const res = await queryHttpResponse(opts.webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    timeoutMs: 15_000
  })
  const data = (await res.json().catch(() => ({}))) as FeishuWebhookResponse
  const bizCode = data.code ?? data.StatusCode
  if (!res.ok || (bizCode != null && bizCode !== 0)) {
    throwFeishuWebhookError(data, res.status)
  }
}

/** 通过飞书自定义机器人 Webhook 发送纯文本（msg_type=text） */
export async function postFeishuWebhookText(opts: {
  webhookUrl: string
  secret?: string
  text: string
}): Promise<void> {
  await postFeishuWebhook({
    webhookUrl: opts.webhookUrl,
    secret: opts.secret,
    msgType: 'text',
    content: { text: opts.text }
  })
}

/** 飞书 post 富文本正文（zh_cn 区块） */
export type FeishuPostLocaleBody = {
  title: string
  content: Array<
    Array<
      | { tag: 'text'; text: string }
      | { tag: 'a'; text: string; href: string }
      | { tag: 'at'; user_id: string }
    >
  >
}

/**
 * 通过飞书自定义机器人 Webhook 发送富文本（msg_type=post）。
 * 支持 text / a / at 等行内元素组合。
 */
export async function postFeishuWebhookPost(opts: {
  webhookUrl: string
  secret?: string
  post: FeishuPostLocaleBody
  locale?: 'zh_cn' | 'en_us'
}): Promise<void> {
  const locale = opts.locale ?? 'zh_cn'
  await postFeishuWebhook({
    webhookUrl: opts.webhookUrl,
    secret: opts.secret,
    msgType: 'post',
    content: {
      post: {
        [locale]: opts.post
      }
    }
  })
}

/**
 * 通过飞书自定义机器人 Webhook 发送图片（msg_type=image）。
 * image_key 需通过飞书「上传图片」API 获取；自定义机器人本身无上传能力。
 */
export async function postFeishuWebhookImage(opts: {
  webhookUrl: string
  secret?: string
  imageKey: string
}): Promise<void> {
  await postFeishuWebhook({
    webhookUrl: opts.webhookUrl,
    secret: opts.secret,
    msgType: 'image',
    content: { image_key: opts.imageKey }
  })
}

/**
 * 通过飞书自定义机器人 Webhook 发送群名片（msg_type=share_chat）。
 * 机器人只能分享其所在群的群名片。
 */
export async function postFeishuWebhookShareChat(opts: {
  webhookUrl: string
  secret?: string
  shareChatId: string
}): Promise<void> {
  await postFeishuWebhook({
    webhookUrl: opts.webhookUrl,
    secret: opts.secret,
    msgType: 'share_chat',
    content: { share_chat_id: opts.shareChatId }
  })
}
