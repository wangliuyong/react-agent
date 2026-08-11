import { useCallback, type ClipboardEvent, type DragEvent } from 'react'
import { message } from 'antd'
import { postSaveChatUpload } from '../api'
import {
  queryClipboardAttachments,
  type ClipboardBlobItem
} from '../utils/queryClipboardAttachments'

function queryReadFileAsBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      // data URL → 纯 base64，供主进程解码
      const comma = result.indexOf(',')
      resolve(comma >= 0 ? result.slice(comma + 1) : result)
    }
    reader.onerror = () => reject(reader.error ?? new Error('读取附件失败'))
    reader.readAsDataURL(file)
  })
}

async function postPersistBlob(item: ClipboardBlobItem): Promise<string | null> {
  try {
    const base64 = await queryReadFileAsBase64(item.file)
    const result = await postSaveChatUpload({
      name: item.name,
      mimeType: item.mimeType,
      base64
    })
    if (!result.ok) {
      message.warning(result.error)
      return null
    }
    return result.path
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    message.warning(`保存附件失败：${msg}`)
    return null
  }
}

export interface UseChatPasteDropOptions {
  disabled?: boolean
  /** 将本地路径加入附件预览 */
  postAddPaths: (paths: string[]) => void
}

/**
 * 聊天输入区粘贴 / 拖入附件。
 * 为什么单独 hook：ChatInput 只负责编排；解析与落盘副作用集中于此。
 */
export function useChatPasteDrop(options: UseChatPasteDropOptions): {
  onPaste: (e: ClipboardEvent<HTMLElement>) => void
  onDrop: (e: DragEvent<HTMLElement>) => void
  onDragOver: (e: DragEvent<HTMLElement>) => void
} {
  const { disabled, postAddPaths } = options

  const postHandleDataTransfer = useCallback(
    async (data: DataTransfer | null): Promise<void> => {
      if (disabled) return
      const { items, skipped } = queryClipboardAttachments(data)
      if (!items.length) {
        if (skipped > 0) {
          message.warning('仅支持图片 / 视频 / 音频附件')
        }
        return
      }

      const localPaths = items
        .filter((item): item is { kind: 'localPath'; path: string } => item.kind === 'localPath')
        .map((item) => item.path)
      const blobs = items.filter((item): item is ClipboardBlobItem => item.kind === 'blob')

      const uploaded: string[] = []
      for (const blob of blobs) {
        const path = await postPersistBlob(blob)
        if (path) uploaded.push(path)
      }

      const all = [...localPaths, ...uploaded]
      if (all.length) {
        postAddPaths(all)
        message.success(`已添加 ${all.length} 个附件`)
      } else if (skipped > 0 || blobs.length > 0) {
        message.warning('未能添加附件')
      }
    },
    [disabled, postAddPaths]
  )

  const onPaste = useCallback(
    (e: ClipboardEvent<HTMLElement>): void => {
      if (disabled) return
      const { items } = queryClipboardAttachments(e.clipboardData)
      // 仅当剪贴板含文件/图片时拦截，避免挡住普通文本粘贴
      if (!items.length) return
      e.preventDefault()
      void postHandleDataTransfer(e.clipboardData)
    },
    [disabled, postHandleDataTransfer]
  )

  const onDrop = useCallback(
    (e: DragEvent<HTMLElement>): void => {
      if (disabled) return
      e.preventDefault()
      e.stopPropagation()
      void postHandleDataTransfer(e.dataTransfer)
    },
    [disabled, postHandleDataTransfer]
  )

  const onDragOver = useCallback(
    (e: DragEvent<HTMLElement>): void => {
      if (disabled) return
      // 必须 preventDefault，浏览器才会允许 drop
      e.preventDefault()
      e.stopPropagation()
    },
    [disabled]
  )

  return { onPaste, onDrop, onDragOver }
}
