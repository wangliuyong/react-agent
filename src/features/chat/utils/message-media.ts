/** 消息内识别出的音视频引用（图片仍走 message-images.ts） */
export interface MessageMediaRef {
  key: string
  kind: 'audio' | 'video'
  src: string
  label: string
}

const AUDIO_EXT_PATTERN = '(?:wav|mp3|m4a|aac|ogg)'
const VIDEO_EXT_PATTERN = '(?:mp4|mov|webm|mkv)'

/** Unix / macOS 绝对路径（允许中文冒号、逗号、反引号后直接跟路径） */
const PATH_PREFIX = '(?:^|[\\s\\n：:,，`])'

const UNIX_AUDIO_RE = new RegExp(
  `${PATH_PREFIX}((?:/[^\\n"'<>|\`]+?)\\.(?:${AUDIO_EXT_PATTERN})(?:\\?[^\\s\\n"'<>|\`]*)?)`,
  'gim'
)
const UNIX_VIDEO_RE = new RegExp(
  `${PATH_PREFIX}((?:/[^\\n"'<>|\`]+?)\\.(?:${VIDEO_EXT_PATTERN})(?:\\?[^\\s\\n"'<>|\`]*)?)`,
  'gim'
)

/** Windows 绝对路径 */
const WIN_AUDIO_RE = new RegExp(
  `${PATH_PREFIX}((?:[A-Za-z]:\\\\[^\\n"'<>|\`]+?)\\.(?:${AUDIO_EXT_PATTERN})(?:\\?[^\\s\\n"'<>|\`]*)?)`,
  'gim'
)
const WIN_VIDEO_RE = new RegExp(
  `${PATH_PREFIX}((?:[A-Za-z]:\\\\[^\\n"'<>|\`]+?)\\.(?:${VIDEO_EXT_PATTERN})(?:\\?[^\\s\\n"'<>|\`]*)?)`,
  'gim'
)

const WORKFLOW_CTX_PREFIX = '@@workflow_ctx@@'

function basename(path: string): string {
  const parts = path.replace(/\\/g, '/').split('/')
  return parts[parts.length - 1] || path
}

function isLocalPath(src: string): boolean {
  return src.startsWith('/') || /^[A-Za-z]:\\/.test(src)
}

function addRef(
  refs: MessageMediaRef[],
  seen: Set<string>,
  src: string,
  kind: 'audio' | 'video'
): void {
  const trimmed = src
    .trim()
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/[，,;；]+$/g, '')
  if (!trimmed || seen.has(trimmed) || !isLocalPath(trimmed)) return
  seen.add(trimmed)
  refs.push({
    key: trimmed,
    kind,
    src: trimmed,
    label: basename(trimmed)
  })
}

function scanPaths(
  content: string,
  refs: MessageMediaRef[],
  seen: Set<string>
): void {
  let m: RegExpExecArray | null

  UNIX_AUDIO_RE.lastIndex = 0
  while ((m = UNIX_AUDIO_RE.exec(content)) !== null) {
    addRef(refs, seen, m[1], 'audio')
  }
  WIN_AUDIO_RE.lastIndex = 0
  while ((m = WIN_AUDIO_RE.exec(content)) !== null) {
    addRef(refs, seen, m[1], 'audio')
  }

  UNIX_VIDEO_RE.lastIndex = 0
  while ((m = UNIX_VIDEO_RE.exec(content)) !== null) {
    addRef(refs, seen, m[1], 'video')
  }
  WIN_VIDEO_RE.lastIndex = 0
  while ((m = WIN_VIDEO_RE.exec(content)) !== null) {
    addRef(refs, seen, m[1], 'video')
  }
}

/**
 * 解码 @@workflow_ctx@@ 前缀，与主进程 tool-result 逻辑对齐。
 */
export function queryDecodeWorkflowCtxMessage(content: string): string {
  if (!content.startsWith(WORKFLOW_CTX_PREFIX)) return content
  try {
    const parsed = JSON.parse(content.slice(WORKFLOW_CTX_PREFIX.length)) as {
      message?: unknown
    }
    return parsed.message != null ? String(parsed.message) : content
  } catch {
    return content
  }
}

/**
 * 从消息正文提取可预览的本地音频/视频路径。
 */
export function extractMessageMedia(content: string): {
  audio: MessageMediaRef[]
  video: MessageMediaRef[]
} {
  const decoded = queryDecodeWorkflowCtxMessage(content)
  const refs: MessageMediaRef[] = []
  const seen = new Set<string>()

  // [附件] 块
  const attachMatch = decoded.match(/\n\[附件\]\n([\s\S]*)$/)
  if (attachMatch) {
    for (const line of attachMatch[1].split('\n')) {
      const trimmed = line.trim()
      if (/\.(wav|mp3|m4a|aac|ogg)$/i.test(trimmed)) {
        addRef(refs, seen, trimmed, 'audio')
      } else if (/\.(mp4|mov|webm|mkv)$/i.test(trimmed)) {
        addRef(refs, seen, trimmed, 'video')
      }
    }
  }

  scanPaths(decoded, refs, seen)

  return {
    audio: refs.filter((r) => r.kind === 'audio'),
    video: refs.filter((r) => r.kind === 'video')
  }
}

/** 展示用：去掉 workflow_ctx 前缀与已识别媒体路径 */
export function stripMediaPathsFromDisplayText(
  content: string,
  audio: MessageMediaRef[],
  video: MessageMediaRef[]
): string {
  let text = queryDecodeWorkflowCtxMessage(content)
  text = text.replace(/\n?\[附件\]\n[\s\S]*$/, '').trim()
  for (const ref of [...audio, ...video]) {
    text = text.split(ref.src).join('').trim()
  }
  text = text.replace(/(?:本地|视频|音频|旁白|成片)?路径[：:]\s*/g, '').trim()
  return text
}

/** 供 Markdown 展示的完整正文（解码 + 去路径） */
export function queryDisplayContent(
  content: string,
  imagePaths: { src: string; kind: string }[] = []
): string {
  const { audio, video } = extractMessageMedia(content)
  let text = stripMediaPathsFromDisplayText(content, audio, video)
  for (const img of imagePaths) {
    if (img.kind === 'local') {
      text = text.split(img.src).join('').trim()
    }
  }
  text = text.replace(/!\[[^\]]*]\([^)]+\)/g, '').trim()
  text = text.replace(/(?:本地|图片|视频|音频|旁白|成片)?路径[：:]\s*/g, '').trim()
  return text
}
