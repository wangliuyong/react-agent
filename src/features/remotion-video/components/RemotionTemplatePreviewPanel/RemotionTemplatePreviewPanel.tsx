import type { RemotionVideoProject } from '../../types'
import { queryHotNewsPlayerConfigByAspect } from '../../templates/template-preview-registry'
import styles from './RemotionTemplatePreviewPanel.module.css'

interface RemotionTemplatePreviewPanelProps {
  project: RemotionVideoProject
  onClose: () => void
}

/** 模板预览区：引导使用技能拼装 + Studio（不再内嵌写死 Player） */
export function RemotionTemplatePreviewPanel({
  project,
  onClose
}: RemotionTemplatePreviewPanelProps): React.ReactElement | null {
  if (!project.hasTemplateCode) return null
  const config = queryHotNewsPlayerConfigByAspect(
    project.previewKind === 'hot-news-vertical' ? '9:16' : '16:9',
    project.durationSec
  )

  return (
    <section className={styles.panel} aria-label="模板预览">
      <div className={styles.head}>
        <div>
          <h2 className={styles.title}>{project.title}</h2>
          <p className={styles.desc}>{project.description}</p>
        </div>
        <Button type="text" icon={<CloseOutlined />} onClick={onClose} aria-label="关闭预览" />
      </div>
      <p className={styles.hint}>
        模版源码在技能 <code>{project.id}</code> 的 <code>template/</code> 中。请通过抽屉「生成并预览」调用{' '}
        <code>remotion_apply_template_skill</code> 拼装后打开 Studio；compositionId 使用{' '}
        <code>{config.compositionId}</code>。
      </p>
    </section>
  )
}
