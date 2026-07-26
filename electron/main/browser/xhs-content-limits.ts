/**
 * 小红书创作平台标题/正文字数硬上限。
 * 按平台规则在发布前截断，避免填写后因超限无法发布。
 */
import type { XhsPublishType } from './xhs-dom'

/** 标题最大字数（按字符计，含标点/emoji 码元） */
export const XHS_TITLE_MAX_LENGTH: Record<XhsPublishType, number> = {
  image: 20,
  video: 20,
  audio: 20,
  /** 长文标题略宽于图文 */
  article: 40
}

/**
 * 正文最大字数。
 * 图文/视频/播客描述：官方笔记上限约 1000 字；
 * 长文编辑器容量更大，仍设上限防止 Agent 输出失控。
 */
export const XHS_CONTENT_MAX_LENGTH: Record<XhsPublishType, number> = {
  image: 1000,
  video: 1000,
  audio: 1000,
  article: 10_000
}

export interface ClampXhsPublishTextInput {
  title: string
  content: string
  publishType: XhsPublishType
}

export interface ClampXhsPublishTextResult {
  title: string
  content: string
  titleTruncated: boolean
  contentTruncated: boolean
  titleMax: number
  contentMax: number
}

/**
 * 按发布类型将标题/正文裁剪到平台上限。
 * 计数口径与创作台一致：使用 JS 字符串 length（含空格、换行、#话题）。
 */
export function queryClampXhsPublishText(
  input: ClampXhsPublishTextInput
): ClampXhsPublishTextResult {
  const titleMax = XHS_TITLE_MAX_LENGTH[input.publishType]
  const contentMax = XHS_CONTENT_MAX_LENGTH[input.publishType]
  const rawTitle = String(input.title ?? '')
  const rawContent = String(input.content ?? '')
  const titleTruncated = rawTitle.length > titleMax
  const contentTruncated = rawContent.length > contentMax
  return {
    title: titleTruncated ? rawTitle.slice(0, titleMax) : rawTitle,
    content: contentTruncated ? rawContent.slice(0, contentMax) : rawContent,
    titleTruncated,
    contentTruncated,
    titleMax,
    contentMax
  }
}
