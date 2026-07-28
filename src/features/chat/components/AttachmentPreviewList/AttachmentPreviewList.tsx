import { Image } from 'antd'
import type { ChatAttachment } from '../../hooks/useChatAttachments'
import { queryLocalImageDataUrl, queryLocalMediaUrl } from '../../api'
import styles from './AttachmentPreviewList.module.css'

const { Text } = Typography

interface AttachmentPreviewListProps {
  attachments: ChatAttachment[]
  onRemove: (path: string) => void
  onClear: () => void
}

/**
 * 输入区附件预览：
 * - 文件夹 → 展示完整路径
 * - 图片 / 视频 → 缩略图横滑列表（可多选）
 * - 音频 → 文件名 + 内联播放器
 */
export function AttachmentPreviewList({
  attachments,
  onRemove,
  onClear
}: AttachmentPreviewListProps): React.ReactElement | null {
  const [previewMap, setPreviewMap] = useState<Record<string, string>>({})
  const attachmentKeys = attachments.map((item) => `${item.kind}:${item.path}`).join('\0')

  useEffect(() => {
    if (!attachments.length) {
      setPreviewMap({})
      return
    }

    let cancelled = false
    void (async () => {
      const next: Record<string, string> = {}
      await Promise.all(
        attachments.map(async (item) => {
          if (item.kind === 'image') {
            const url = await queryLocalImageDataUrl(item.path)
            if (url) next[item.path] = url
            return
          }
          if (item.kind === 'video' || item.kind === 'audio') {
            const url = await queryLocalMediaUrl(item.path)
            if (url) next[item.path] = url
          }
        })
      )
      if (!cancelled) setPreviewMap(next)
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 以 attachmentKeys 稳定依赖
  }, [attachmentKeys])

  if (!attachments.length) return null

  const folders = attachments.filter((item) => item.kind === 'folder')
  const visuals = attachments.filter((item) => item.kind === 'image' || item.kind === 'video')
  const audios = attachments.filter((item) => item.kind === 'audio')

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <Text className={styles.count}>已选 {attachments.length} 项附件</Text>
        <Button type="link" size="small" onClick={onClear}>
          清除
        </Button>
      </div>

      {folders.length > 0 ? (
        <div className={styles.folders}>
          {folders.map((item) => (
            <div key={item.path} className={styles.folderRow} title={item.path}>
              <FolderOpenOutlined className={styles.folderIcon} />
              <Text className={styles.folderPath}>{item.path}</Text>
              <Button
                type="text"
                size="small"
                className={styles.removeBtn}
                icon={<CloseOutlined />}
                aria-label={`移除文件夹 ${item.name}`}
                onClick={() => onRemove(item.path)}
              />
            </div>
          ))}
        </div>
      ) : null}

      {visuals.length > 0 ? (
        <div className={styles.mediaStrip}>
          <Image.PreviewGroup>
            {visuals.map((item, index) => {
              const previewUrl = previewMap[item.path]
              return (
                <div
                  key={item.path}
                  className={styles.thumbCard}
                  style={{ animationDelay: `${index * 40}ms` }}
                  title={item.path}
                >
                  <div className={styles.thumbFrame}>
                    {item.kind === 'image' && previewUrl ? (
                      <Image
                        src={previewUrl}
                        alt={item.name}
                        width={72}
                        height={72}
                        className={styles.thumbImg}
                        preview={{ src: previewUrl }}
                      />
                    ) : item.kind === 'video' && previewUrl ? (
                      <>
                        <video
                          className={styles.thumbVideo}
                          src={previewUrl}
                          muted
                          preload="metadata"
                          playsInline
                        />
                        <span className={styles.videoBadge}>
                          <CaretRightOutlined />
                        </span>
                      </>
                    ) : (
                      <span className={styles.placeholder}>
                        {item.kind === 'video' ? <VideoCameraOutlined /> : <PictureOutlined />}
                      </span>
                    )}
                  </div>
                  <span className={styles.thumbLabel}>{item.name}</span>
                  <Button
                    type="text"
                    size="small"
                    className={styles.removeBtn}
                    icon={<CloseOutlined />}
                    aria-label={`移除 ${item.name}`}
                    onClick={() => onRemove(item.path)}
                  />
                </div>
              )
            })}
          </Image.PreviewGroup>
        </div>
      ) : null}

      {audios.length > 0 ? (
        <div className={styles.audios}>
          {audios.map((item) => {
            const previewUrl = previewMap[item.path]
            return (
              <div key={item.path} className={styles.audioRow} title={item.path}>
                <span className={styles.audioIcon}>
                  <SoundOutlined />
                </span>
                <div className={styles.audioMain}>
                  <Text className={styles.audioName}>{item.name}</Text>
                  {previewUrl ? (
                    <audio
                      className={styles.audioPlayer}
                      controls
                      preload="metadata"
                      src={previewUrl}
                    />
                  ) : (
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      加载预览中…
                    </Text>
                  )}
                </div>
                <Button
                  type="text"
                  size="small"
                  icon={<CloseOutlined />}
                  aria-label={`移除音频 ${item.name}`}
                  onClick={() => onRemove(item.path)}
                />
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
