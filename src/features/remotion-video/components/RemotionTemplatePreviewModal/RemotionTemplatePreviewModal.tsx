import type { HotNewsProps } from '@remotion-starter/compositions/hot-news/types'
import type { RemotionTemplatePlayerConfig } from '../../templates/template-preview-registry'
import { RemotionTemplatePlayer } from '../RemotionTemplatePlayer/RemotionTemplatePlayer'
import styles from './RemotionTemplatePreviewModal.module.css'

interface RemotionTemplatePreviewModalProps {
  open: boolean
  title?: string
  config: RemotionTemplatePlayerConfig
  displayProps: HotNewsProps
  onClose: () => void
}

/**
 * 模板视频预览弹窗。
 * zIndex 高于右侧配置抽屉，避免 Player 被遮挡。
 */
export function RemotionTemplatePreviewModal({
  open,
  title = '视频预览',
  config,
  displayProps,
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
      destroyOnClose
      width={isVertical ? 'min(440px, 94vw)' : 'min(960px, 94vw)'}
      zIndex={1300}
      className={styles.modal}
      styles={{
        body: { padding: '16px 20px 20px' }
      }}
    >
      <RemotionTemplatePlayer
        config={config}
        inputPropsOverride={displayProps}
        variant="modal"
      />
    </Modal>
  )
}
