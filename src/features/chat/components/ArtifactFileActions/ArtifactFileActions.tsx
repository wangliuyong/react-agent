/**
 * 产物文件操作：在访达/资源管理器中显示；HTML 等可选在系统浏览器中打开。
 */
import styles from './ArtifactFileActions.module.css'

interface ArtifactFileActionsProps {
  filePath: string
  /** 为 true 时显示「在浏览器中打开」（用于 HTML） */
  showBrowserOpen?: boolean
  /** 为 true 时仅展示图标，文字通过 Tooltip 提示 */
  iconOnly?: boolean
  className?: string
}

/** 本地产物通用操作按钮组 */
export function ArtifactFileActions({
  filePath,
  showBrowserOpen = false,
  iconOnly = false,
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

  const revealButton = (
    <Button
      size="small"
      type={iconOnly ? 'text' : 'link'}
      className={iconOnly ? styles.iconBtn : styles.btn}
      icon={<FolderOpenOutlined />}
      loading={busy === 'reveal'}
      onClick={() => void handleReveal()}
      aria-label="打开文件位置"
    >
      {iconOnly ? null : '打开文件位置'}
    </Button>
  )

  const browserButton = (
    <Button
      size="small"
      type={iconOnly ? 'text' : 'link'}
      className={iconOnly ? styles.iconBtn : styles.btn}
      icon={<GlobalOutlined />}
      loading={busy === 'browser'}
      onClick={() => void handleOpenInBrowser()}
      aria-label="在浏览器中打开"
    >
      {iconOnly ? null : '在浏览器中打开'}
    </Button>
  )

  return (
    <div
      className={[styles.wrap, iconOnly ? styles.wrapIconOnly : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      {showBrowserOpen ? (
        iconOnly ? (
          <Tooltip title="在浏览器中打开">{browserButton}</Tooltip>
        ) : (
          browserButton
        )
      ) : null}
      {iconOnly ? <Tooltip title="打开文件位置">{revealButton}</Tooltip> : revealButton}
    </div>
  )
}
