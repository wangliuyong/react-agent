/**
 * 从消息正文提取本地产物路径（剧本/分镜/成片/HTML 等），提供「打开文件位置」。
 */
import { queryArtifactPaths } from '../../utils/artifact-paths'
import { queryLocalPathExists } from '../../api'
import { ArtifactPathMeta } from '../ArtifactPathMeta'
import styles from './ArtifactLinks.module.css'

export { queryArtifactPaths } from '../../utils/artifact-paths'

interface ArtifactLinksProps {
  content: string
  /** 已在播放器/画廊中展示的路径，不再重复显示产物按钮 */
  excludePaths?: string[]
}

/** 展示组件：检测消息中的本地产物路径并提供打开文件位置（仅展示磁盘上存在的文件） */
export function ArtifactLinks({
  content,
  excludePaths = []
}: ArtifactLinksProps): React.ReactElement | null {
  const candidates = useMemo(() => {
    const exclude = new Set(excludePaths)
    return queryArtifactPaths(content).filter((p) => !exclude.has(p))
  }, [content, excludePaths])

  const [existingPaths, setExistingPaths] = useState<string[]>([])
  const candidateKey = candidates.join('\0')

  useEffect(() => {
    if (!candidates.length) {
      setExistingPaths([])
      return
    }

    let cancelled = false
    void (async () => {
      const checks = await Promise.all(
        candidates.map(async (p) => ((await queryLocalPathExists(p)) ? p : null))
      )
      if (!cancelled) {
        setExistingPaths(checks.filter((p): p is string => Boolean(p)))
      }
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 以 candidateKey 稳定依赖
  }, [candidateKey])

  if (existingPaths.length === 0) return null

  return (
    <div className={styles.wrap}>
      <span className={styles.title}>产物</span>
      <div className={styles.list}>
        {existingPaths.map((p) => (
          <div key={p} className={styles.item}>
            <ArtifactPathMeta
              filePath={p}
              showBrowserOpen={/\.html?$/i.test(p)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
