import {
  queryAttachmentBasename,
  queryAttachmentKind,
  type ChatAttachmentKind
} from '../utils/queryAttachmentKind'

/** 聊天输入区单条附件（发送时仍折叠为 path 字符串列表） */
export interface ChatAttachment {
  path: string
  kind: ChatAttachmentKind
  name: string
}

function toAttachment(path: string, hint?: ChatAttachmentKind): ChatAttachment {
  return {
    path,
    kind: queryAttachmentKind(path, hint),
    name: queryAttachmentBasename(path)
  }
}

/**
 * 聊天附件选择与去重状态。
 * 为什么单独抽 hook：预览组件只吃 props，选择副作用与 path 列表编排留在容器侧。
 */
export function useChatAttachments(): {
  attachments: ChatAttachment[]
  paths: string[]
  postAddPaths: (paths: string[], hint?: ChatAttachmentKind) => void
  postRemovePath: (path: string) => void
  postClearAttachments: () => void
} {
  const [attachments, setAttachments] = useState<ChatAttachment[]>([])

  const postAddPaths = useCallback((nextPaths: string[], hint?: ChatAttachmentKind): void => {
    if (!nextPaths.length) return
    setAttachments((prev) => {
      const seen = new Set(prev.map((item) => item.path))
      const merged = [...prev]
      for (const path of nextPaths) {
        const trimmed = path.trim()
        if (!trimmed || seen.has(trimmed)) continue
        seen.add(trimmed)
        merged.push(toAttachment(trimmed, hint))
      }
      return merged
    })
  }, [])

  const postRemovePath = useCallback((path: string): void => {
    setAttachments((prev) => prev.filter((item) => item.path !== path))
  }, [])

  const postClearAttachments = useCallback((): void => {
    setAttachments([])
  }, [])

  const paths = useMemo(() => attachments.map((item) => item.path), [attachments])

  return {
    attachments,
    paths,
    postAddPaths,
    postRemovePath,
    postClearAttachments
  }
}
