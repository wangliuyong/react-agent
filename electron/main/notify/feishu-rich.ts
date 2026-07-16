import type { FeishuPostLocaleBody } from './feishu'
import { postFeishuWebhookPost, postFeishuWebhookText } from './feishu'

/** 飞书 post 行内元素 */
export type FeishuPostInlineElement =
  | { tag: 'text'; text: string }
  | { tag: 'a'; text: string; href: string }
  | { tag: 'at'; user_id: string }

/** Markdown → 飞书富文本转换选项 */
export type FeishuRichTextOptions = {
  /** @ 提及，all 表示 @所有人；仅写入首行 */
  atUserId?: 'all' | string
  /** post 标题 */
  title?: string
}

/**
 * 将一行 Markdown 解析为飞书 post 行内元素数组。
 * 支持 [标题](url) 链接，其余为纯文本。
 */
export function parseMarkdownLineToPostElements(line: string): FeishuPostInlineElement[] {
  const elements: FeishuPostInlineElement[] = []
  const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = linkRe.exec(line)) !== null) {
    const before = line.slice(lastIndex, match.index)
    if (before) elements.push({ tag: 'text', text: before })
    elements.push({ tag: 'a', text: match[1], href: match[2] })
    lastIndex = match.index + match[0].length
  }

  const rest = line.slice(lastIndex)
  if (rest) elements.push({ tag: 'text', text: rest })
  if (elements.length === 0) elements.push({ tag: 'text', text: line })
  return elements
}

/**
 * 预处理 Markdown：去掉常见标记，保留可读正文行。
 */
function queryMarkdownPlainLines(markdown: string): string[] {
  let text = markdown.trim()
  if (!text) return []

  text = text.replace(/\*\*([^*]+)\*\*/g, '$1')
  text = text.replace(/\*([^*]+)\*/g, '$1')
  text = text.replace(/__([^_]+)__/g, '$1')
  text = text.replace(/_([^_]+)_/g, '$1')
  text = text.replace(/^#{1,6}\s+/gm, '')
  text = text.replace(/^>\s?/gm, '')
  text = text.replace(/^[-*_]{3,}\s*$/gm, '')
  text = text.replace(/`([^`]+)`/g, '$1')
  text = text.replace(/^\s*[-*+]\s+/gm, '')
  text = text.replace(/^\s*\d+\.\s+/gm, '')

  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

/**
 * 将 Markdown 正文转为飞书 post 富文本结构（msg_type=post）。
 * 每行 Markdown 对应 post.content 中的一行；链接转为 tag=a。
 */
export function markdownToFeishuPost(
  markdown: string,
  options: FeishuRichTextOptions = {}
): FeishuPostLocaleBody {
  const lines = queryMarkdownPlainLines(markdown)
  const rows: FeishuPostInlineElement[][] = lines.map((line) =>
    parseMarkdownLineToPostElements(line)
  )

  // 首行前置 @ 提及
  if (options.atUserId) {
    const atEl: FeishuPostInlineElement = { tag: 'at', user_id: options.atUserId }
    if (rows.length > 0) {
      rows[0] = [atEl, ...rows[0]]
    } else {
      rows.push([atEl])
    }
  }

  if (rows.length === 0) {
    rows.push([{ tag: 'text', text: '（无内容）' }])
  }

  return {
    title: options.title?.trim() || '通知',
    content: rows
  }
}

/**
 * 将 Markdown 正文转为飞书 text 消息支持的 @ / 链接标签字符串。
 * 用于简单文本场景；定时任务等结构化内容优先用 markdownToFeishuPost。
 */
export function markdownToFeishuTextRich(
  markdown: string,
  options: FeishuRichTextOptions = {}
): string {
  const post = markdownToFeishuPost(markdown, options)
  const parts: string[] = []

  for (const row of post.content) {
    const line = row
      .map((el) => {
        if (el.tag === 'text') return el.text
        if (el.tag === 'a') return `<a href="${el.href}">${el.text}</a>`
        return `<at user_id="${el.user_id}"></at>`
      })
      .join('')
    parts.push(line)
  }

  return parts.join('\n')
}

/**
 * 通过飞书 Webhook 发送 post 富文本（msg_type=post）。
 */
export async function postFeishuWebhookRichText(opts: {
  webhookUrl: string
  secret?: string
  post: FeishuPostLocaleBody
}): Promise<void> {
  await postFeishuWebhookPost({
    webhookUrl: opts.webhookUrl,
    secret: opts.secret,
    post: opts.post
  })
}

/**
 * 通过飞书 Webhook 发送带 @ 的纯文本（msg_type=text）。
 * 正文需已含 <at user_id="..."> 等标签。
 */
export async function postFeishuWebhookTextRich(opts: {
  webhookUrl: string
  secret?: string
  text: string
}): Promise<void> {
  await postFeishuWebhookText({
    webhookUrl: opts.webhookUrl,
    secret: opts.secret,
    text: opts.text
  })
}
