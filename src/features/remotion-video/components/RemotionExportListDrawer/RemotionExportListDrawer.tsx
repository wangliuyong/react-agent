/**
 * Remotion 导出列表抽屉：展示导出中 / 成功 / 失败记录，
 * 支持打开所在目录与内联播放成片。
 */
import type { CSSProperties } from 'react'
import type { RemotionExportRecord, RemotionExportStatus } from '@shared/remotion-exports'
import { REMOTION_EXPORT_STATUS_META } from '@shared/remotion-exports'
import { queryFormatAssetSize } from '@shared/agent-assets'
import { queryLocalMediaUrl } from '@/features/chat/api'
import { queryRemotionExports, postRevealExportPath } from '../../api'
import styles from './RemotionExportListDrawer.module.css'

const { Text, Paragraph } = Typography

interface RemotionExportListDrawerProps {
  open: boolean
  onClose: () => void
}

type StatusFilter = RemotionExportStatus | 'all'

const STATUS_FILTER_OPTIONS: { label: string; value: StatusFilter }[] = [
  { label: '全部', value: 'all' },
  { label: '导出中', value: 'exporting' },
  { label: '导出成功', value: 'success' },
  { label: '导出失败', value: 'failed' }
]

function queryUpdatedLabel(ts: number): string {
  return new Date(ts).toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/** 单条导出卡片：状态、进度、路径与操作 */
function ExportListItem({
  record,
  index,
  onView
}: {
  record: RemotionExportRecord
  index: number
  onView: (record: RemotionExportRecord) => void
}): React.ReactElement {
  const [revealBusy, setRevealBusy] = useState(false)
  const statusMeta = REMOTION_EXPORT_STATUS_META[record.status]
  const canView = record.status === 'success'

  const handleReveal = async (): Promise<void> => {
    setRevealBusy(true)
    try {
      const result = await postRevealExportPath(record.outputPath)
      if (!result.ok) {
        message.warning(result.error)
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : '无法打开目录')
    } finally {
      setRevealBusy(false)
    }
  }

  return (
    <article
      className={styles.item}
      style={{ '--item-index': index } as CSSProperties}
      data-status={record.status}
    >
      <div className={styles.itemHead}>
        <div className={styles.itemTitleBlock}>
          <h3 className={styles.itemTitle}>{record.title || record.fileName}</h3>
          <Text type="secondary" className={styles.composition}>
            {record.title
              ? `${record.fileName} · ${record.compositionId}`
              : record.compositionId}
          </Text>
        </div>
        <Tag color={statusMeta.tone} bordered={false}>
          {statusMeta.label}
        </Tag>
      </div>

      {record.status === 'exporting' ? (
        <Progress
          percent={Math.max(0, Math.min(100, record.progressPercent ?? 0))}
          size="small"
          status="active"
          className={styles.progress}
        />
      ) : null}

      {record.status === 'failed' && record.errorMessage ? (
        <Paragraph
          type="danger"
          ellipsis={{ rows: 2, tooltip: record.errorMessage }}
          className={styles.error}
        >
          {record.errorMessage}
        </Paragraph>
      ) : null}

      <div className={styles.meta}>
        <span>更新 {queryUpdatedLabel(record.updatedAt)}</span>
        {record.size != null && record.size > 0 ? (
          <span>{queryFormatAssetSize(record.size)}</span>
        ) : null}
      </div>

      <div className={styles.actions}>
        <Button
          size="small"
          icon={<FolderOpenOutlined />}
          loading={revealBusy}
          onClick={() => void handleReveal()}
        >
          打开目录
        </Button>
        <Button
          size="small"
          type="primary"
          icon={<PlayCircleOutlined />}
          disabled={!canView}
          onClick={() => onView(record)}
        >
          查看视频
        </Button>
      </div>
    </article>
  )
}

/** 成片预览弹窗：经 media:// 加载本地 mp4 */
function ExportVideoPreviewModal({
  record,
  open,
  onClose
}: {
  record: RemotionExportRecord | null
  open: boolean
  onClose: () => void
}): React.ReactElement {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !record) {
      setMediaUrl(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setMediaUrl(null)

    void (async () => {
      const url = await queryLocalMediaUrl(record.outputPath)
      if (!cancelled) {
        setMediaUrl(url)
        setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [open, record?.id, record?.outputPath])

  return (
    <Modal
      title={record?.fileName ?? '查看视频'}
      open={open && Boolean(record)}
      onCancel={onClose}
      footer={null}
      width="min(840px, 92vw)"
      destroyOnHidden
      className={styles.previewModal}
    >
      {loading ? (
        <div className={styles.previewLoading}>
          <Spin />
          <Text type="secondary">正在加载视频…</Text>
        </div>
      ) : mediaUrl ? (
        <video controls autoPlay className={styles.previewVideo} src={mediaUrl} />
      ) : (
        <Empty description="无法加载该视频，文件可能已移动或删除" />
      )}
    </Modal>
  )
}

/**
 * 右侧导出列表抽屉。
 * 打开时拉取列表；存在「导出中」时自动轮询进度。
 */
export function RemotionExportListDrawer({
  open,
  onClose
}: RemotionExportListDrawerProps): React.ReactElement {
  const [records, setRecords] = useState<RemotionExportRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [previewRecord, setPreviewRecord] = useState<RemotionExportRecord | null>(null)

  const loadList = useCallback(async (): Promise<void> => {
    try {
      const list = await queryRemotionExports()
      setRecords(list)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '加载导出列表失败')
    }
  }, [])

  useEffect(() => {
    if (!open) return

    let cancelled = false
    setLoading(true)

    void (async () => {
      await loadList()
      if (!cancelled) setLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [open, loadList])

  // 抽屉打开即轮询；有「导出中」时更频繁，保证进度条与状态同步刷新
  const hasExporting = records.some((item) => item.status === 'exporting')
  useEffect(() => {
    if (!open) return
    const intervalMs = hasExporting ? 1000 : 4000
    const timer = window.setInterval(() => {
      void loadList()
    }, intervalMs)
    return () => window.clearInterval(timer)
  }, [open, hasExporting, loadList])

  // 监听 Remotion 渲染 tool_progress，立即拉一次列表（比纯轮询更跟手）
  useEffect(() => {
    if (!open) return
    return window.api.onAgentEvent((event) => {
      if (event.type !== 'tool_progress') return
      if (event.toolName !== 'remotion_render') return
      void loadList()
    })
  }, [open, loadList])

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return records
    return records.filter((item) => item.status === statusFilter)
  }, [records, statusFilter])

  const counts = useMemo(() => {
    return {
      all: records.length,
      exporting: records.filter((r) => r.status === 'exporting').length,
      success: records.filter((r) => r.status === 'success').length,
      failed: records.filter((r) => r.status === 'failed').length
    }
  }, [records])

  return (
    <>
      <Drawer
        title={
          <div className={styles.titleRow}>
            <span className={styles.drawerTitle}>导出列表</span>
            <Tag color="blue" bordered={false}>
              {counts.all} 条
            </Tag>
          </div>
        }
        placement="right"
        width="min(480px, 94vw)"
        open={open}
        onClose={onClose}
        destroyOnHidden
        closable
        closeIcon={<CloseOutlined />}
        className={styles.drawer}
        extra={
          <Button
            type="text"
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={() => {
              setLoading(true)
              void loadList().finally(() => setLoading(false))
            }}
            aria-label="刷新导出列表"
          />
        }
      >
        <div className={styles.body}>
          <p className={styles.lead}>
            查看 Remotion 导出任务状态；成功后可打开所在目录或直接播放成片。
          </p>

          <Segmented
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as StatusFilter)}
            options={STATUS_FILTER_OPTIONS.map((opt) => ({
              label:
                opt.value === 'all'
                  ? `${opt.label} ${counts.all}`
                  : `${opt.label} ${counts[opt.value]}`,
              value: opt.value
            }))}
            block
            className={styles.filter}
          />

          {loading && records.length === 0 ? (
            <div className={styles.loading}>
              <Spin />
            </div>
          ) : filtered.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                statusFilter === 'all'
                  ? '暂无导出记录，可在模板抽屉中导出视频'
                  : '该状态下暂无记录'
              }
              className={styles.empty}
            />
          ) : (
            <div className={styles.list} role="list">
              {filtered.map((record, index) => (
                <ExportListItem
                  key={record.id}
                  record={record}
                  index={index}
                  onView={setPreviewRecord}
                />
              ))}
            </div>
          )}
        </div>
      </Drawer>

      <ExportVideoPreviewModal
        record={previewRecord}
        open={Boolean(previewRecord)}
        onClose={() => setPreviewRecord(null)}
      />
    </>
  )
}
