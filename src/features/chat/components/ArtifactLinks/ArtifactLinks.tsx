/**
 * 从消息正文提取本地产物路径（剧本/分镜/成片/HTML 等），提供「打开文件位置」。
 */
import { ArtifactFileActions } from '../ArtifactFileActions'
import styles from './ArtifactLinks.module.css'

/**
 * 匹配本地绝对路径。允许路径中含空格（如 macOS 的 Application Support），
 * 以引号/括号/换行作为边界，并以已知产物扩展名结尾。
 */
const PATH_RE =
  /((?:\/|[A-Za-z]:\\)[^"'`）)\]\n]+?\.(?:html?|mp4|mov|mkv|webm|md|json|txt|css|less|scss|js|mjs|cjs|ts|tsx|jsx|vue|py|sh|yaml|yml|xml|csv|pdf|png|jpg|jpeg|webp|gif|bmp|svg|wav|mp3|m4a|aac|ogg))/gi

export function queryArtifactPaths(content: string): string[] {
  const found: string[] = []
  let match: RegExpExecArray | null
  const re = new RegExp(PATH_RE.source, PATH_RE.flags)
  while ((match = re.exec(content)) !== null) {
    const p = match[1]?.trim().replace(/[.,;:：。，；]+$/, '')
    if (p && !found.includes(p)) found.push(p)
  }
  return found
}

function queryArtifactLabel(filePath: string): string {
  const parts = filePath.replace(/\\/g, '/').split('/')
  return parts[parts.length - 1] || filePath
}

interface ArtifactLinksProps {
  content: string
  /** 已在播放器/画廊中展示的路径，不再重复显示产物按钮 */
  excludePaths?: string[]
}

/** 展示组件：检测消息中的本地产物路径并提供打开文件位置 */
export function ArtifactLinks({
  content,
  excludePaths = []
}: ArtifactLinksProps): React.ReactElement | null {
  const paths = useMemo(() => {
    const exclude = new Set(excludePaths)
    return queryArtifactPaths(content).filter((p) => !exclude.has(p))
  }, [content, excludePaths])

  if (paths.length === 0) return null

  return (
    <div className={styles.wrap}>
      <span className={styles.title}>产物</span>
      <div className={styles.list}>
        {paths.map((p) => (
          <div key={p} className={styles.item} title={p}>
            <span className={styles.fileName}>{queryArtifactLabel(p)}</span>
            <ArtifactFileActions filePath={p} />
          </div>
        ))}
      </div>
    </div>
  )
}
