/** 消息内识别出的图片引用 */
export interface MessageImageRef {
  /** 去重用 key */
  key: string
  /** local 需 IPC 转 data URL；remote 可直接 img src */
  kind: 'local' | 'remote'
  src: string
  label: string
}

const IMAGE_EXT_PATTERN = '(?:jpg|jpeg|png|webp|gif|bmp|svg)'

/** Unix / macOS 绝对路径（支持空格、中文等非 ASCII 路径段） */
const UNIX_PATH_RE = new RegExp(
  `(^|[\\s\\n])((?:/[^\\n"'<>|]+?)\\.(?:${IMAGE_EXT_PATTERN})(?:\\?[^\\s\\n"'<>|]*)?)`,
  'gim'
)

/** Windows 绝对路径（支持空格） */
const WIN_PATH_RE = new RegExp(
  `(^|[\\s\\n])((?:[A-Za-z]:\\\\[^\\n"'<>|]+?)\\.(?:${IMAGE_EXT_PATTERN})(?:\\?[^\\s\\n"'<>|]*)?)`,
  'gim'
)

/** Markdown 图片 */
const MD_IMAGE_RE = /!\[[^\]]*]\(([^)]+)\)/g

/** HTTP(S) 图片直链 */
const REMOTE_IMAGE_RE = new RegExp(
  `(https?://[^\\s\\n]+\\.(?:${IMAGE_EXT_PATTERN})(?:\\?[^\\s\\n]*)?)`,
  'gi'
)

function basename(path: string): string {
  const parts = path.replace(/\\/g, '/').split('/')
  return parts[parts.length - 1] || path
}

function isLocalPath(src: string): boolean {
  return src.startsWith('/') || /^[A-Za-z]:\\/.test(src)
}

function isRemoteImageUrl(src: string): boolean {
  return /^https?:\/\//i.test(src) || src.startsWith('data:image/')
}

function addRef(refs: MessageImageRef[], seen: Set<string>, src: string): void {
  const trimmed = src.trim().replace(/^["']|["']$/g, '')
  if (!trimmed || seen.has(trimmed)) return
  if (!isLocalPath(trimmed) && !isRemoteImageUrl(trimmed)) return
  seen.add(trimmed)
  refs.push({
    key: trimmed,
    kind: isLocalPath(trimmed) ? 'local' : 'remote',
    src: trimmed,
    label: basename(trimmed)
  })
}

/**
 * 从消息正文与用户附件路径中提取可预览的图片列表。
 */
export function extractMessageImages(
  content: string,
  attachmentPaths?: string[]
): MessageImageRef[] {
  const refs: MessageImageRef[] = []
  const seen = new Set<string>()

  for (const p of attachmentPaths ?? []) {
    addRef(refs, seen, p)
  }

  // [附件] 块内的路径行
  const attachMatch = content.match(/\n\[附件\]\n([\s\S]*)$/)
  if (attachMatch) {
    for (const line of attachMatch[1].split('\n')) {
      addRef(refs, seen, line.trim())
    }
  }

  let mdMatch: RegExpExecArray | null
  MD_IMAGE_RE.lastIndex = 0
  while ((mdMatch = MD_IMAGE_RE.exec(content)) !== null) {
    addRef(refs, seen, mdMatch[1])
  }

  let m: RegExpExecArray | null
  REMOTE_IMAGE_RE.lastIndex = 0
  while ((m = REMOTE_IMAGE_RE.exec(content)) !== null) {
    addRef(refs, seen, m[1])
  }

  UNIX_PATH_RE.lastIndex = 0
  while ((m = UNIX_PATH_RE.exec(content)) !== null) {
    addRef(refs, seen, m[2])
  }

  WIN_PATH_RE.lastIndex = 0
  while ((m = WIN_PATH_RE.exec(content)) !== null) {
    addRef(refs, seen, m[2])
  }

  return preferLocalImageRefs(refs)
}

/**
 * 若消息中已有本地下载路径，则不再展示远程来源 URL（CDN 常防盗链导致预览失败）。
 */
function preferLocalImageRefs(refs: MessageImageRef[]): MessageImageRef[] {
  const hasLocal = refs.some((r) => r.kind === 'local')
  if (!hasLocal) return refs
  return refs.filter((r) => r.kind === 'local')
}

/** 展示用：去掉 [附件] 块与已识别本地路径行，保留可读文本 */
export function stripImagePathsFromDisplayText(content: string, refs: MessageImageRef[]): string {
  let text = content.replace(/\n?\[附件\]\n[\s\S]*$/, '').trim()
  for (const ref of refs) {
    if (ref.kind === 'local') {
      text = text.split(ref.src).join('').trim()
    }
  }
  // 清理 markdown 图片语法行
  text = text.replace(/!\[[^\]]*]\([^)]+\)/g, '').trim()
  return text
}
