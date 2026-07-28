import { queryDecodeWorkflowCtxMessage } from './workflow-ctx'

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

/**
 * 路径前允许空白、中英文冒号/逗号、反引号。
 * `(?!//)`：避免把 `https://cdn/...jpg` 里的 `//cdn/...jpg` 误判为本地绝对路径。
 */
const PATH_PREFIX = '(?:^|[\\s\\n：:,，`])(?!\\/\\/)'

/** Unix / macOS 绝对路径（支持 Application Support 等含空格路径） */
const UNIX_PATH_RE = new RegExp(
  `${PATH_PREFIX}((?:/[^\\n"'<>|\`]+?)\\.(?:${IMAGE_EXT_PATTERN})(?:\\?[^\\s\\n"'<>|\`]*)?)`,
  'gim'
)

/** Windows 绝对路径（支持空格） */
const WIN_PATH_RE = new RegExp(
  `${PATH_PREFIX}((?:[A-Za-z]:\\\\[^\\n"'<>|\`]+?)\\.(?:${IMAGE_EXT_PATTERN})(?:\\?[^\\s\\n"'<>|\`]*)?)`,
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

/** 真实本地绝对路径；拒绝协议相对 URL（//cdn/...） */
function isLocalPath(src: string): boolean {
  if (!src || src.startsWith('//')) return false
  return src.startsWith('/') || /^[A-Za-z]:[\\/]/.test(src)
}

function isRemoteImageUrl(src: string): boolean {
  return /^https?:\/\//i.test(src) || src.startsWith('data:image/')
}

function addRef(refs: MessageImageRef[], seen: Set<string>, src: string): void {
  // 去掉 markdown / 工具结果里常见的包裹符号
  const trimmed = src
    .trim()
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/[，,;；]+$/g, '')
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
 * 会先解码 @@workflow_ctx@@，与音视频/HTML 提取保持一致。
 */
export function extractMessageImages(
  content: string,
  attachmentPaths?: string[]
): MessageImageRef[] {
  const decoded = queryDecodeWorkflowCtxMessage(content)
  const refs: MessageImageRef[] = []
  const seen = new Set<string>()

  for (const p of attachmentPaths ?? []) {
    addRef(refs, seen, p)
  }

  // [附件] 块内的路径行
  const attachMatch = decoded.match(/\n\[附件\]\n([\s\S]*)$/)
  if (attachMatch) {
    for (const line of attachMatch[1].split('\n')) {
      addRef(refs, seen, line.trim())
    }
  }

  let mdMatch: RegExpExecArray | null
  MD_IMAGE_RE.lastIndex = 0
  while ((mdMatch = MD_IMAGE_RE.exec(decoded)) !== null) {
    addRef(refs, seen, mdMatch[1])
  }

  let m: RegExpExecArray | null
  REMOTE_IMAGE_RE.lastIndex = 0
  while ((m = REMOTE_IMAGE_RE.exec(decoded)) !== null) {
    addRef(refs, seen, m[1])
  }

  UNIX_PATH_RE.lastIndex = 0
  while ((m = UNIX_PATH_RE.exec(decoded)) !== null) {
    addRef(refs, seen, m[1])
  }

  WIN_PATH_RE.lastIndex = 0
  while ((m = WIN_PATH_RE.exec(decoded)) !== null) {
    addRef(refs, seen, m[1])
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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** 去掉已写成 Markdown 图片后残留的同路径裸露副本（反引号或纯文本） */
function queryRemoveBarePathCopies(text: string, src: string): string {
  const escaped = escapeRegExp(src)
  return text
    .replace(new RegExp(`\`${escaped}\``, 'g'), '')
    .replace(new RegExp(`(?<!\\]\\()${escaped}`, 'g'), '')
}

/**
 * 表格行内：把路径列里的本地图挪到「预览」列，路径列仅保留短文件名 + 来源标注。
 * 为什么：原先直接删路径会留下空反引号，预览列只剩「图1」文案。
 */
function queryEmbedPathInTableRow(text: string, ref: MessageImageRef): string | null {
  const escaped = escapeRegExp(ref.src)
  const tableRowRe = new RegExp(
    `(\\|\\s*)([^|\\n]+?)(\\s*\\|\\s*)[\`']?${escaped}[\`']?([^|\\n]*)`,
    'g'
  )
  if (!tableRowRe.test(text)) return null
  tableRowRe.lastIndex = 0
  return text.replace(tableRowRe, (_match, pipeStart, previewCell, midPipe, rest) => {
    const label = String(previewCell).trim() || ref.label
    // 保留单元格尾部空格，避免与行末 `|` 粘连
    const restNorm = String(rest)
      .replace(/^\s*[←<-]+/, ' ←')
      .replace(/^\s+(?=←)/, ' ')
    const pathCell = restNorm.trim()
      ? `\`${ref.label}\`${restNorm.startsWith(' ') ? restNorm : ` ${restNorm}`}`
      : `\`${ref.label}\``
    return `${pipeStart}![${label}](${ref.src})${midPipe}${pathCell}`
  })
}

/**
 * 将已识别本地图片嵌入为 Markdown 图片语法，供正文内联预览。
 * - 表格（路径列）：预览列放缩略图，路径列保留短名
 * - 表格（仅「图N」标签）：按序号预判填入上下文本地路径，便于查看
 * - 其它：裸路径 / 反引号路径 → `![label](src)`
 * 远程 Markdown 图片原样保留；[附件] 块仍剥离（由画廊展示）。
 */
export function queryEmbedImagesInDisplayText(
  content: string,
  refs: MessageImageRef[]
): string {
  let text = content.replace(/\n?\[附件\]\n[\s\S]*$/, '').trim()

  for (const ref of refs) {
    if (ref.kind !== 'local') continue

    if (text.includes(`](${ref.src})`)) {
      text = queryRemoveBarePathCopies(text, ref.src)
      continue
    }

    const tableEmbedded = queryEmbedPathInTableRow(text, ref)
    if (tableEmbedded != null) {
      text = tableEmbedded
      continue
    }

    const escaped = escapeRegExp(ref.src)
    text = text.replace(new RegExp(`[\\\`']?${escaped}[\\\`']?`, 'g'), `![${ref.label}](${ref.src})`)
  }

  // 配图预览表常见「图1 / 图2-3」无路径：用上下文 refs 按序号补缩略图
  text = queryFillFigureLabelPreview(text, refs)

  // 路径已变成图片后，清掉空的「图片路径：」标签
  text = text.replace(/(?:本地|图片)?路径[：:]\s*(?=!\[)/g, '')
  text = text.replace(/(?:本地|图片)?路径[：:]\s*$/gm, '')
  return text.replace(/\n{3,}/g, '\n\n').trim()
}

/**
 * 解析「图1」「图2-3」标签，得到 1-based 下标列表（含区间）。
 */
export function queryParseFigureLabelIndexes(label: string): number[] {
  const m = String(label ?? '')
    .trim()
    .match(/^图\s*(\d+)(?:\s*[-–—~～到至]\s*(\d+))?$/u)
  if (!m) return []
  const start = Number(m[1])
  const end = m[2] != null ? Number(m[2]) : start
  if (!Number.isFinite(start) || start < 1) return []
  if (!Number.isFinite(end) || end < start) return [start]
  const indexes: number[] = []
  for (let i = start; i <= end; i++) indexes.push(i)
  return indexes
}

/**
 * 表格「图片/预览」列只有图号、没有路径时：按序号把本地 refs 填成 Markdown 图。
 * 用于发布失败后的「配图预览」等场景，让用户能直接查看对应本地文件。
 */
export function queryFillFigureLabelPreview(
  text: string,
  refs: MessageImageRef[]
): string {
  const localRefs = refs.filter((r) => r.kind === 'local')
  if (!localRefs.length) return text

  return text.replace(
    /^(\|\s*)([^|\n]+?)(\s*\|\s*)([^|\n]*)(\s*\|?\s*)$/gm,
    (full, pipeStart: string, previewCell: string, midPipe: string, contentCell: string, tail: string) => {
      const label = String(previewCell).trim()
      // 已是 markdown 图片或非图号标签则跳过
      if (label.includes('![') || label.includes('/')) return full
      const indexes = queryParseFigureLabelIndexes(label)
      if (!indexes.length) return full

      const parts: string[] = []
      for (const idx of indexes) {
        const ref = localRefs[idx - 1]
        if (!ref) continue
        parts.push(`![图${idx}](${ref.src})`)
      }
      if (!parts.length) return full
      return `${pipeStart}${parts.join(' ')}${midPipe}${contentCell}${tail}`
    }
  )
}

/** 展示正文里已内联的图片 src（用于画廊去重，避免表格缩略图与底部画廊重复） */
export function queryInlinedImageSrcs(displayText: string): Set<string> {
  const srcs = new Set<string>()
  const re = /!\[[^\]]*]\(([^)]+)\)/g
  let match: RegExpExecArray | null
  while ((match = re.exec(displayText)) !== null) {
    const src = match[1].trim()
    if (src) srcs.add(src)
  }
  return srcs
}

/**
 * 展示用：去掉 [附件] 块与已识别本地路径行，保留可读文本。
 * 注意：聊天主展示已改走 queryEmbedImagesInDisplayText；本函数供需彻底剥离路径的场景。
 */
export function stripImagePathsFromDisplayText(content: string, refs: MessageImageRef[]): string {
  let text = content.replace(/\n?\[附件\]\n[\s\S]*$/, '').trim()
  for (const ref of refs) {
    if (ref.kind === 'local') {
      text = text.split(ref.src).join('').trim()
    }
  }
  // 清理 markdown 图片语法行与「本地路径：」空标签
  text = text.replace(/!\[[^\]]*]\([^)]+\)/g, '').trim()
  text = text.replace(/(?:本地|图片)?路径[：:]\s*/g, '').trim()
  return text
}
