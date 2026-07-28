import type { RemotionTemplatePlayerConfig } from '../../templates/template-preview-registry'
import { RemotionTemplatePlayer } from '../RemotionTemplatePlayer/RemotionTemplatePlayer'
import styles from './RemotionTemplatePreviewModal.module.css'

interface RemotionTemplatePreviewModalProps {
  open: boolean
  title?: string
  config: RemotionTemplatePlayerConfig
  studioUrl?: string | null
  statusText?: string
  /** 是否正在从 Studio 直渲导出 */
  exporting?: boolean
  /** 导出当前 Studio 工程（与抽屉「导出视频」同一路径） */
  onExport?: () => void
  onClose: () => void
}

/**
 * 模版 Studio 预览弹窗（技能拼装后打开）。
 * zIndex 高于右侧配置抽屉；可直接导出已启动 Studio 的工程。
 */
export function RemotionTemplatePreviewModal({
  open,
  title = '视频预览',
  config,
  studioUrl,
  statusText,
  exporting = false,
  onExport,
  onClose
}: RemotionTemplatePreviewModalProps): React.ReactElement {
  const isVertical = config.height > config.width
  const canExport = Boolean(studioUrl && onExport)

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onClose}
      footer={
        <div className={styles.footer}>
          <Typography.Text type="secondary" className={styles.footerHint}>
            {studioUrl
              ? '确认 Studio 画面无误后，可直接导出当前工程'
              : '请先拼装并启动 Studio'}
          </Typography.Text>
          <Space>
            <Button onClick={onClose}>关闭</Button>
            {studioUrl ? (
              <Button
                icon={<PlayCircleOutlined />}
                onClick={() => void window.api.postOpenExternal(studioUrl)}
              >
                打开 Studio
              </Button>
            ) : null}
            <Button
              type="primary"
              danger
              icon={<ExportOutlined />}
              loading={exporting}
              disabled={!canExport}
              onClick={() => onExport?.()}
            >
              {exporting ? '正在导出…' : '导出视频'}
            </Button>
          </Space>
        </div>
      }
      centered
      destroyOnHidden
      width={isVertical ? 'min(440px, 94vw)' : 'min(960px, 94vw)'}
      zIndex={1300}
      className={styles.modal}
      styles={{
        body: { padding: '16px 20px 12px' }
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
