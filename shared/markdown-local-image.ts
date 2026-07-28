/**
 * 聊天 Markdown 本地图片目的地格式化。
 * CommonMark：含空格的本地绝对路径必须写成 `![alt](</path with space.jpg>)`，
 * 否则 remark 会在首个空格截断，界面只显示源码文本而无预览。
 */

/** 去掉目的地尖括号与常见包裹符号，得到真实路径 / URL */
export function queryNormalizeMarkdownImageSrc(src: string): string {
  const trimmed = String(src ?? '')
    .trim()
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/[，,;；]+$/g, '')
  if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
    return trimmed.slice(1, -1).trim()
  }
  return trimmed
}

function queryIsLocalAbsPath(src: string): boolean {
  if (!src || src.startsWith('//')) return false
  return src.startsWith('/') || /^[A-Za-z]:[\\/]/.test(src)
}

/**
 * 生成本地（或远程）Markdown 图片语法。
 * 本地绝对路径含空格/括号时自动加 `<>`。
 */
export function queryFormatMarkdownImage(alt: string, src: string): string {
  const path = queryNormalizeMarkdownImageSrc(src)
  const safeAlt = String(alt ?? '').replace(/[\[\]]/g, '')
  const needsBracket = queryIsLocalAbsPath(path) && /[\s()<>]/.test(path)
  const dest = needsBracket ? `<${path}>` : path
  return `![${safeAlt}](${dest})`
}
