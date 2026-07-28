import type { RemotionTemplatePlayerConfig } from '../../templates/template-preview-registry'
import { RemotionTemplatePlayer } from '../RemotionTemplatePlayer/RemotionTemplatePlayer'
import styles from './RemotionTemplatePreviewModal.module.css'

interface RemotionTemplatePreviewModalProps {
  open: boolean
  title?: string
  config: RemotionTemplatePlayerConfig
  studioUrl?: string | null
  statusText?: string
  onClose: () => void
}

/**
 * 模版 Studio 预览弹窗（技能拼装后打开）。
 * zIndex 高于右侧配置抽屉。
 */
export function RemotionTemplatePreviewModal({
  open,
  title = '视频预览',
  config,
  studioUrl,
  statusText,
  onClose
}: RemotionTemplatePreviewModalProps): React.ReactElement {
  const isVertical = config.height > config.width

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      destroyOnHidden
      width={isVertical ? 'min(440px, 94vw)' : 'min(960px, 94vw)'}
      zIndex={1300}
      className={styles.modal}
      styles={{
        body: { padding: '16px 20px 20px' }
      }}
    >
      <RemotionTemplatePlayer
        studioUrl={studioUrl}
        statusText={statusText}
        compositionId={config.compositionId}
        width={config.width}
        height={config.height}
        fps={config.fps}
        durationInFrames={config.durationInFrames}
        variant="modal"
      />
    </Modal>
  )
}
