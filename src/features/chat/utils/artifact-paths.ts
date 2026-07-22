/**
 * 从聊天消息正文提取本地产物路径，并过滤代码说明里常见的伪路径。
 */

/** 一般扫描用的产物扩展名（不含 js/ts，避免误匹配 import / CDN 说明） */
const SCAN_EXT =
  'html?|mp4|mov|mkv|webm|md|json|txt|css|less|scss|pdf|png|jpg|jpeg|webp|gif|bmp|svg|wav|mp3|m4a|aac|ogg|py|sh|yaml|yml|xml|csv'

/**
 * write_file / 工作流输出等工具明确返回的路径。
 * 允许任意扩展名（含 .js），因为前缀已标明是真实写入结果；路径可含空格。
 */
const EXPLICIT_PATH_RE =
  /(?:已写入|已生成|已保存|写入路径|保存至|保存到|输出路径|文件路径|产物路径|剧本已保存|成片已生成)[：:]\s*((?:\/|[A-Za-z]:\\)[^"'`）)\]\n]+)/gi

const SCAN_PATH_RE = new RegExp(
  `((?:\\/|[A-Za-z]:\\\\)[^"'\\\`）)\\]\\n]+?\\.(?:${SCAN_EXT}))`,
  'gi'
)

/** 真实本机绝对路径常见根（macOS / Linux / Windows） */
const REAL_PATH_ROOT_RE =
  /^\/(?:Users|tmp|var|home|opt|Library|Volumes)\/|^[A-Za-z]:\\/

/** 代码片段里常见的虚拟/模块路径，并非用户磁盘上的产物 */
const VIRTUAL_PATH_RE =
  /^\/(?:node_modules|three|examples|jsm|build|dist|src|assets|static|public|cdn|unpkg|npm)(?:\/|$)/i

/** 去掉路径尾部标点 */
export function queryNormalizeArtifactPath(raw: string): string {
  return raw.trim().replace(/[.,;:：。，；]+$/, '')
}

/**
 * 判断是否为「像真实写入文件」的绝对路径，而非消息正文里的库引用。
 */
export function queryIsPlausibleArtifactPath(filePath: string): boolean {
  const p = queryNormalizeArtifactPath(filePath)
  if (!p) return false
  if (!p.startsWith('/') && !/^[A-Za-z]:\\/.test(p)) return false

  const normalized = p.replace(/\\/g, '/')
  const segments = normalized.split('/').filter(Boolean)
  // 拒绝 /three.module.js 这类根级伪路径
  if (segments.length < 2) return false
  if (VIRTUAL_PATH_RE.test(normalized)) return false
  return REAL_PATH_ROOT_RE.test(normalized)
}

function addArtifactPath(found: string[], raw: string): void {
  const p = queryNormalizeArtifactPath(raw)
  if (!p || found.includes(p)) return
  if (!queryIsPlausibleArtifactPath(p)) return
  found.push(p)
}

/**
 * 从消息正文提取候选产物路径（不含存在性校验，展示层需再过滤）。
 */
export function queryArtifactPaths(content: string): string[] {
  const found: string[] = []
  let match: RegExpExecArray | null

  const explicit = new RegExp(EXPLICIT_PATH_RE.source, EXPLICIT_PATH_RE.flags)
  while ((match = explicit.exec(content)) !== null) {
    addArtifactPath(found, match[1])
  }

  const scan = new RegExp(SCAN_PATH_RE.source, SCAN_PATH_RE.flags)
  while ((match = scan.exec(content)) !== null) {
    addArtifactPath(found, match[1])
  }

  return found
}
