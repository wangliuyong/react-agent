/**
 * 外部链接校验：供主进程 IPC 与渲染进程 Markdown 打开链接共用。
 */

/**
 * 去掉链接尾部常见中英文标点（GFM 自动链接/模型输出易把句号带进 URL）。
 */
export function queryStripTrailingUrlPunctuation(raw: string): string {
  return String(raw ?? '')
    .trim()
    .replace(/[.,;:!?：。，；、）\]}>»"']+$/g, '')
}

/**
 * 是否为可交给 shell.openExternal 的 http(s) URL。
 * 要求：可解析、协议为 http/https、hostname 非空。
 */
export function queryIsSafeExternalHttpUrl(raw: string): boolean {
  const cleaned = queryStripTrailingUrlPunctuation(raw)
  if (!cleaned) return false
  let url: URL
  try {
    url = new URL(cleaned)
  } catch {
    return false
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false
  if (!url.hostname) return false
  return true
}

/**
 * 规范化可打开的外部 http(s) URL；非法则返回 null。
 */
export function queryNormalizeExternalHttpUrl(raw: string): string | null {
  const cleaned = queryStripTrailingUrlPunctuation(raw)
  if (!queryIsSafeExternalHttpUrl(cleaned)) return null
  try {
    return new URL(cleaned).href
  } catch {
    return null
  }
}
