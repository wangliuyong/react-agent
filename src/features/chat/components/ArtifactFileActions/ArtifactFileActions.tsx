/**
 * 产物文件操作：在访达/资源管理器中显示；HTML 等可选在系统浏览器中打开。
 */
import styles from './ArtifactFileActions.module.css'

interface ArtifactFileActionsProps {
  filePath: string
  /** 为 true 时显示「在浏览器中打开」（用于 HTML） */
  showBrowserOpen?: boolean
  className?: string
}

/** 本地产物通用操作按钮组 */
export function ArtifactFileActions({
  filePath,
  showBrowserOpen = false,
  className
}: ArtifactFileActionsProps): React.ReactElement {
  const [busy, setBusy] = useState<'reveal' | 'browser' | null>(null)

  const handleReveal = async (): Promise<void> => {
    setBusy('reveal')
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

  const handleOpenInBrowser = async (): Promise<void> => {
    setBusy('browser')
    try {
      const result = await window.api.postOpenLocalFile(filePath)
      if (!result.ok) {
        message.warning(result.error)
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : '无法在浏览器中打开')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className={[styles.wrap, className].filter(Boolean).join(' ')}>
      {showBrowserOpen ? (
        <Button
          size="small"
          type="link"
          className={styles.btn}
          icon={<GlobalOutlined />}
          loading={busy === 'browser'}
          onClick={() => void handleOpenInBrowser()}
        >
          在浏览器中打开
        </Button>
      ) : null}
      <Button
        size="small"
        type="link"
        className={styles.btn}
        icon={<FolderOpenOutlined />}
        loading={busy === 'reveal'}
        onClick={() => void handleReveal()}
      >
        打开文件位置
      </Button>
    </div>
  )
}
