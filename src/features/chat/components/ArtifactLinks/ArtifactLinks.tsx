/**
 * 从消息正文提取本地产物路径（剧本/分镜/成片等），提供「在访达中显示」。
 */
import styles from './ArtifactLinks.module.css'

/**
 * 匹配本地绝对路径。允许路径中含空格（如 macOS 的 Application Support），
 * 以引号/括号/换行作为边界，并以已知产物扩展名结尾。
 */
const PATH_RE =
  /((?:\/|[A-Za-z]:\\)[^"'`）)\]\n]+?\.(?:mp4|mov|mkv|webm|md|json|png|jpg|jpeg|wav))/gi

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
  const lower = filePath.toLowerCase()
  if (lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.webm')) {
    return '成片'
  }
  if (lower.includes('storyboard') || lower.endsWith('.json')) return '分镜/清单'
  if (lower.endsWith('.md')) return '剧本'
  if (/\.(png|jpe?g)$/i.test(lower)) return '素材图'
  if (lower.endsWith('.wav')) return '旁白'
  return '产物'
}

interface ArtifactLinksProps {
  content: string
  /** 已在播放器/画廊中展示的路径，不再显示产物按钮 */
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
  const [busy, setBusy] = useState<string | null>(null)

  if (paths.length === 0) return null

  const handleReveal = async (filePath: string): Promise<void> => {
    setBusy(filePath)
    try {
      const result = await window.api.postRevealPath(filePath)
      if (!result.ok) {
        message.warning(result.error)
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : '无法打开文件位置')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className={styles.wrap}>
      <span className={styles.title}>产物</span>
      <div className={styles.list}>
        {paths.map((p) => (
          <Button
            key={p}
            size="small"
            type="default"
            className={styles.btn}
            icon={<FolderOpenOutlined />}
            loading={busy === p}
            onClick={() => void handleReveal(p)}
            title={p}
          >
            {queryArtifactLabel(p)}
          </Button>
        ))}
      </div>
    </div>
  )
}
