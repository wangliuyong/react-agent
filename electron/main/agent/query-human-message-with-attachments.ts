import { HumanMessage } from '@langchain/core/messages'
import type { BaseMessage } from '@langchain/core/messages'
import { extname, basename } from 'path'
import { queryLocalOcrBlocksForAttachments } from '../ocr/local-ocr'

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tif', '.tiff', '.heic'])

function queryIsImagePath(filePath: string): boolean {
  return IMAGE_EXT.has(extname(filePath).toLowerCase())
}

/**
 * 拼 UI / session 落盘用的纯文本（含附件路径列表，不塞 base64）。
 */
export function queryAttachmentPathsText(
  content: string,
  attachmentPaths: string[] = []
): string {
  const text = content.trim()
  if (!attachmentPaths.length) return text
  const list = attachmentPaths.map((p) => p.trim()).filter(Boolean)
  if (!list.length) return text
  const block = `[附件]\n${list.join('\n')}`
  return text ? `${text}\n\n${block}` : block
}

/**
 * 去掉落盘文案末尾的 `[附件]` 块（保留本机 OCR 段）。
 */
export function queryStripAttachmentFooter(content: string): string {
  const raw = String(content ?? '')
  const idx = raw.lastIndexOf('\n\n[附件]\n')
  if (idx >= 0) return raw.slice(0, idx).trim()
  if (raw.startsWith('[附件]\n')) return ''
  return raw.trim()
}

/**
 * 用本机 OCR 丰富用户文案：图片识别结果写入文本，供任意文本模型阅读。
 * 为什么不用 image_url 多模态：DeepSeek 等文本连接不接受 image_url，会 HTTP 400。
 */
export async function queryEnrichContentWithLocalOcr(
  text: string,
  attachmentPaths: string[] = []
): Promise<string> {
  const paths = attachmentPaths.map((p) => p.trim()).filter(Boolean)
  const userText = text.trim()
  if (!paths.length) return userText

  const imagePaths = paths.filter((p) => queryIsImagePath(p))
  const otherPaths = paths.filter((p) => !queryIsImagePath(p))

  const parts: string[] = []
  if (userText) parts.push(userText)

  if (imagePaths.length) {
    const ocrBlocks = await queryLocalOcrBlocksForAttachments(imagePaths)
    if (ocrBlocks.length) {
      parts.push(ocrBlocks.join('\n\n'))
    }
  }

  const attachLines = [
    ...imagePaths.map((p) => p),
    ...otherPaths.map((p) => p)
  ]
  if (attachLines.length) {
    parts.push(`[附件]\n${attachLines.join('\n')}`)
  }

  if (imagePaths.length) {
    parts.push('（图片文字已由本机系统识别并写入上方，请直接使用识别结果）')
  }

  return parts.join('\n\n')
}

/**
 * 构建发给模型的 HumanMessage：纯文本 + 本机 OCR，不嵌入 image_url。
 */
export async function queryBuildHumanMessage(
  text: string,
  attachmentPaths: string[] = []
): Promise<HumanMessage> {
  const content = await queryEnrichContentWithLocalOcr(text, attachmentPaths)
  return new HumanMessage(content)
}

/**
 * 同步版：已含 OCR 的落盘文案直接包装（历史还原不再跑 OCR）。
 */
export function queryBuildHumanMessageFromStoredContent(content: string): HumanMessage {
  return new HumanMessage(content)
}

/** 从 content 提取纯文本（兼容旧版多模态数组） */
export function queryExtractTextFromContent(content: unknown): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((block) => {
        if (
          block &&
          typeof block === 'object' &&
          'type' in block &&
          (block as { type?: string }).type === 'text' &&
          'text' in block
        ) {
          return String((block as { text?: unknown }).text ?? '')
        }
        return ''
      })
      .join('')
  }
  if (content == null) return ''
  return String(content)
}

const LEGACY_EMBEDDED_HINT = '（上方已内嵌图片像素，请直接识图/OCR，无需 read_file）'

/**
 * 剥离旧版 image_url，避免文本模型 400。
 * 新路径已不再写入 image_url；此函数仅兼容进程内旧 checkpoint。
 */
export function queryProjectMessageWithoutImages(message: BaseMessage): BaseMessage {
  const isHuman = HumanMessage.isInstance(message) || message.getType?.() === 'human'
  if (!isHuman) return message

  const content = message.content
  if (typeof content === 'string' || !Array.isArray(content)) return message

  const hasImage = content.some(
    (block) =>
      block &&
      typeof block === 'object' &&
      'type' in block &&
      (block as { type?: string }).type === 'image_url'
  )
  if (!hasImage) return message

  let text = queryExtractTextFromContent(content)
  if (text.includes(LEGACY_EMBEDDED_HINT)) {
    text = text.split(LEGACY_EMBEDDED_HINT).join('').trim()
  }
  return new HumanMessage({ content: text })
}

export function queryProjectMessagesWithoutImages(messages: BaseMessage[]): BaseMessage[] {
  return messages.map((message) => queryProjectMessageWithoutImages(message))
}

/** @deprecated 保留导出名供测试；现等同 basename 展示 */
export function queryAttachmentImageLabel(filePath: string): string {
  return basename(filePath)
}
