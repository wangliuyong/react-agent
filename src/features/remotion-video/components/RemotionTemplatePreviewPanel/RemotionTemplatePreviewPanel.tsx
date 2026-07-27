import type { RemotionVideoProject } from '../../types'
import { RemotionTemplatePlayer } from '../RemotionTemplatePlayer/RemotionTemplatePlayer'
import { queryRemotionTemplatePreview } from '../../templates/template-preview-registry'
import styles from './RemotionTemplatePreviewPanel.module.css'

interface RemotionTemplatePreviewPanelProps {
  project: RemotionVideoProject
  onClose: () => void
}

/** 模板预览区：展示 Player + 项目摘要 */
export function RemotionTemplatePreviewPanel({
  project,
  onClose
}: RemotionTemplatePreviewPanelProps): React.ReactElement | null {
  const config = queryRemotionTemplatePreview(project.compositionId)
  if (!config) return null

  return (
    <section className={styles.panel} aria-label="模板预览">
      <div className={styles.head}>
        <div>
          <h2 className={styles.title}>{project.title}</h2>
          <p className={styles.desc}>{project.description}</p>
        </div>
        <Button type="text" icon={<CloseOutlined />} onClick={onClose} aria-label="关闭预览" />
      </div>
      <RemotionTemplatePlayer config={config} />
      <p className={styles.hint}>
        渲染导出请通过 Agent 调用 <code>remotion_init_project</code> 与{' '}
        <code>remotion_render</code>，compositionId 使用 <code>{project.compositionId}</code>。
      </p>
    </section>
  )
}
