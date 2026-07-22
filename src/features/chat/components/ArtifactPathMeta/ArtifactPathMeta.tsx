/**
 * 产物文件信息：文件名 + 完整路径（可复制）+ 操作按钮。
 */
import { ArtifactFileActions } from '../ArtifactFileActions'
import styles from './ArtifactPathMeta.module.css'

interface ArtifactPathMetaProps {
  filePath: string
  /** 为 true 时显示「在浏览器中打开」 */
  showBrowserOpen?: boolean
  className?: string
}

function queryFileName(filePath: string): string {
  const parts = filePath.replace(/\\/g, '/').split('/')
  return parts[parts.length - 1] || filePath
}

/** 展示产物文件名、绝对路径与打开操作 */
export function ArtifactPathMeta({
  filePath,
  showBrowserOpen = false,
  className
}: ArtifactPathMetaProps): React.ReactElement {
  return (
    <div className={[styles.wrap, className].filter(Boolean).join(' ')}>
      <div className={styles.topRow}>
        <span className={styles.fileName}>{queryFileName(filePath)}</span>
        <ArtifactFileActions filePath={filePath} showBrowserOpen={showBrowserOpen} />
      </div>
      <Typography.Text copyable className={styles.path} title={filePath}>
        {filePath}
      </Typography.Text>
    </div>
  )
}
