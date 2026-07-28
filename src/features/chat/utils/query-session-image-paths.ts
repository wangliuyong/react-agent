/**
 * 从会话历史预判可查看的本地配图路径。
 * 用于助手正文「配图预览」只有「图1」标签、路径藏在先前工具结果时。
 */
import type { ChatMessage } from '@shared/types'
import { extractMessageImages } from './message-images'
import { queryToolArgsRecord } from './agent-status'

/** 工具参数里常见的本地图片路径字段 */
const IMAGE_PATH_ARG_KEYS = ['imagePaths', 'paths', 'images', 'imagePath'] as const

/**
 * 从单条工具参数里提取本地图片绝对路径。
 */
export function queryImagePathsFromToolArgs(args: unknown): string[] {
  const record = queryToolArgsRecord(args)
  if (!record) return []
  const found: string[] = []
  for (const key of IMAGE_PATH_ARG_KEYS) {
    const value = record[key]
    if (typeof value === 'string' && value.startsWith('/')) {
      found.push(value)
      continue
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string' && item.startsWith('/') && /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(item)) {
          found.push(item)
        }
      }
    }
  }
  return found
}

/**
 * 汇总会话中（截止到 beforeMessageId，不含该条）已出现的本地图片路径，保序去重。
 * 扫描：工具正文、助手正文、tool_calls.args.imagePaths。
 */
export function queryCollectSessionImagePaths(
  messages: ChatMessage[],
  opts?: { beforeMessageId?: string }
): string[] {
  const seen = new Set<string>()
  const paths: string[] = []

  const add = (src: string) => {
    if (!src || seen.has(src)) return
    seen.add(src)
    paths.push(src)
  }

  for (const msg of messages) {
    if (opts?.beforeMessageId && msg.id === opts.beforeMessageId) break

    for (const ref of extractMessageImages(msg.content, msg.attachmentPaths)) {
      if (ref.kind === 'local') add(ref.src)
    }

    for (const tc of msg.toolCalls ?? []) {
      for (const p of queryImagePathsFromToolArgs(tc.args)) add(p)
    }
  }

  return paths
}
