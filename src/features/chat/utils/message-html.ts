/** 消息内识别出的本地 HTML 文件引用 */
export interface MessageHtmlRef {
  key: string
  src: string
  label: string
}

const HTML_EXT_PATTERN = 'html?'

/** Unix / macOS 绝对路径（允许中文冒号、逗号、反引号后直接跟路径） */
const PATH_PREFIX = '(?:^|[\\s\\n：:,，`])'

const UNIX_HTML_RE = new RegExp(
  `${PATH_PREFIX}((?:/[^\\n"'<>|\`]+?)\\.(?:${HTML_EXT_PATTERN})(?:\\?[^\\s\\n"'<>|\`]*)?)`,
  'gim'
)

/** Windows 绝对路径 */
const WIN_HTML_RE = new RegExp(
  `${PATH_PREFIX}((?:[A-Za-z]:\\\\[^\\n"'<>|\`]+?)\\.(?:${HTML_EXT_PATTERN})(?:\\?[^\\s\\n"'<>|\`]*)?)`,
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

function isHtmlPath(src: string): boolean {
  return /\.html?$/i.test(src)
}

function addRef(refs: MessageHtmlRef[], seen: Set<string>, src: string): void {
  const trimmed = src
    .trim()
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/[，,;；]+$/g, '')
  if (!trimmed || seen.has(trimmed) || !isLocalPath(trimmed) || !isHtmlPath(trimmed)) return
  seen.add(trimmed)
  refs.push({
    key: trimmed,
    src: trimmed,
    label: basename(trimmed)
  })
}

function scanPaths(content: string, refs: MessageHtmlRef[], seen: Set<string>): void {
  let m: RegExpExecArray | null

  UNIX_HTML_RE.lastIndex = 0
  while ((m = UNIX_HTML_RE.exec(content)) !== null) {
    addRef(refs, seen, m[1])
  }
  WIN_HTML_RE.lastIndex = 0
  while ((m = WIN_HTML_RE.exec(content)) !== null) {
    addRef(refs, seen, m[1])
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
 * 从消息正文提取可在聊天内 iframe 预览的本地 HTML 路径。
 */
export function extractMessageHtml(content: string): MessageHtmlRef[] {
  const decoded = queryDecodeWorkflowCtxMessage(content)
  const refs: MessageHtmlRef[] = []
  const seen = new Set<string>()

  const attachMatch = decoded.match(/\n\[附件\]\n([\s\S]*)$/)
  if (attachMatch) {
    for (const line of attachMatch[1].split('\n')) {
      const trimmed = line.trim()
      if (isHtmlPath(trimmed)) {
        addRef(refs, seen, trimmed)
      }
    }
  }

  scanPaths(decoded, refs, seen)
  return refs
}

/** 展示用：去掉已识别 HTML 路径 */
export function stripHtmlPathsFromDisplayText(content: string, htmlRefs: MessageHtmlRef[]): string {
  let text = queryDecodeWorkflowCtxMessage(content)
  for (const ref of htmlRefs) {
    text = text.split(ref.src).join('').trim()
  }
  text = text.replace(/(?:本地|HTML|网页|页面)?路径[：:]\s*/g, '').trim()
  return text
}
