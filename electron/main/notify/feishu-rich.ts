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
 * 检测正文是否含 Markdown 结构。
 * 用于飞书渠道自动选择 post 而非 text，避免表格/标题等语法原样展示。
 */
export function queryLooksLikeMarkdown(text: string): boolean {
  const s = text.trim()
  if (!s) return false
  return (
    /^#{1,6}\s/m.test(s) ||
    /^\|.+\|$/m.test(s) ||
    /\*\*[^*]+\*\*/.test(s) ||
    /\[.+?\]\(.+?\)/.test(s) ||
    /^[-*+]\s/m.test(s) ||
    /^\d+\.\s/m.test(s) ||
    /^>\s/m.test(s)
  )
}

/** 去掉行内 Markdown 标记（粗体/斜体/代码），链接由 parseMarkdownLineToPostElements 处理 */
function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .trim()
}

/** 解析 Markdown 表格行，返回单元格数组；非表格行返回 null */
function parseMarkdownTableRow(line: string): string[] | null {
  const trimmed = line.trim()
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return null
  const cells = trimmed
    .slice(1, -1)
    .split('|')
    .map((c) => stripInlineMarkdown(c))
  return cells.length >= 2 && cells.some(Boolean) ? cells : null
}

/** Markdown 表格分隔行，如 |---|---| */
function queryIsTableSeparator(line: string): boolean {
  return /^\|[\s\-:|]+\|$/.test(line.trim())
}

/** 将表格单元格格式化为飞书可读行（列用空格分隔，去掉管道符） */
function formatTableCells(cells: string[]): string {
  return cells.filter(Boolean).join('    ')
}

/**
 * 将 Markdown 转为飞书 post 可读正文行。
 * - 表格 → 去掉 | 与分隔行，按列空格对齐展示
 * - 标题/列表/引用 → 转为纯文本段落
 */
export function markdownToFeishuLines(markdown: string): string[] {
  const result: string[] = []
  let tableHeaders: string[] | null = null
  let inTable = false

  for (const rawLine of markdown.split('\n')) {
    const trimmed = rawLine.trim()
    if (!trimmed) {
      if (result.length > 0 && result[result.length - 1] !== '') {
        result.push('')
      }
      tableHeaders = null
      inTable = false
      continue
    }

    if (queryIsTableSeparator(trimmed)) {
      continue
    }

    const tableCells = parseMarkdownTableRow(trimmed)
    if (tableCells) {
      inTable = true
      if (!tableHeaders) {
        tableHeaders = tableCells
        result.push(formatTableCells(tableCells))
      } else {
        result.push(formatTableCells(tableCells))
      }
      continue
    }

    if (inTable) {
      tableHeaders = null
      inTable = false
    }

    const headerMatch = trimmed.match(/^#{1,6}\s+(.+)$/)
    if (headerMatch) {
      if (result.length > 0 && result[result.length - 1] !== '') {
        result.push('')
      }
      result.push(stripInlineMarkdown(headerMatch[1]))
      continue
    }

    if (trimmed.startsWith('>')) {
      result.push(stripInlineMarkdown(trimmed.replace(/^>\s?/, '')))
      continue
    }

    const bulletMatch = trimmed.match(/^[-*+]\s+(.+)$/)
    if (bulletMatch) {
      result.push(`• ${stripInlineMarkdown(bulletMatch[1])}`)
      continue
    }

    const orderedMatch = trimmed.match(/^\d+\.\s+(.+)$/)
    if (orderedMatch) {
      result.push(`${orderedMatch[0].match(/^\d+/)?.[0]}. ${stripInlineMarkdown(orderedMatch[1])}`)
      continue
    }

    if (/^[-*_]{3,}\s*$/.test(trimmed)) {
      result.push('────────')
      continue
    }

    result.push(stripInlineMarkdown(trimmed))
  }

  // 去掉连续空行与首尾空行
  const compact: string[] = []
  for (const line of result) {
    if (line === '' && compact[compact.length - 1] === '') continue
    compact.push(line)
  }
  return compact.filter((l) => l !== '').length ? compact.filter((l, i, arr) => !(l === '' && i === arr.length - 1)) : []
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
 * 将 Markdown 正文转为飞书 post 富文本结构（msg_type=post）。
 * 每行对应 post.content 中的一段；链接转为 tag=a。
 */
export function markdownToFeishuPost(
  markdown: string,
  options: FeishuRichTextOptions = {}
): FeishuPostLocaleBody {
  const lines = markdownToFeishuLines(markdown)
  const rows: FeishuPostInlineElement[][] = lines
    .filter((line) => line.trim())
    .map((line) => parseMarkdownLineToPostElements(line))

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
