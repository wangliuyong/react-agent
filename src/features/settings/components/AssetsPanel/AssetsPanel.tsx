/**
 * 设置页「资产」面板：浏览、预览、删除 Agent 生成的本地文件，支持一键清空。
 */
import type { CSSProperties } from 'react'
import type { AgentAssetKind, AgentAssetRecord, AgentAssetZone } from '@shared/agent-assets'
import {
  AGENT_ASSET_KIND_LABELS,
  AGENT_ASSET_ZONE_LABELS,
  queryFormatAssetSize
} from '@shared/agent-assets'
import { Image } from 'antd'
import { queryLocalImageDataUrl, queryLocalMediaUrl } from '@/features/chat/api'
import { ArtifactFileActions } from '@/features/chat/components/ArtifactFileActions'
import {
  postClearAgentAssets,
  postDeleteAgentAsset,
  postDeleteAgentAssets,
  queryAgentAssetTextPreview,
  queryAgentAssets
} from '../../api'
import cardStyles from '@/components/entity-card'
import styles from './AssetsPanel.module.css'

const { Text, Title, Paragraph } = Typography

type KindFilter = AgentAssetKind | 'all'
type ZoneFilter = AgentAssetZone | 'all'

const KIND_FILTER_OPTIONS: { label: string; value: KindFilter }[] = [
  { label: '全部', value: 'all' },
  { label: '图片', value: 'image' },
  { label: '视频', value: 'video' },
  { label: '音频', value: 'audio' },
  { label: '网页', value: 'html' },
  { label: '文档', value: 'document' },
  { label: '其他', value: 'other' }
]

const ZONE_FILTER_OPTIONS: { label: string; value: ZoneFilter }[] = [
  { label: '全部分区', value: 'all' },
  { label: '通用产物', value: 'artifacts' },
  { label: '场景素材', value: 'videos/scenes' },
  { label: '视频项目', value: 'videos/projects' }
]

const KIND_ICON: Record<AgentAssetKind, React.ReactNode> = {
  image: <PictureOutlined />,
  video: <VideoCameraOutlined />,
  audio: <SoundOutlined />,
  html: <GlobalOutlined />,
  document: <FileTextOutlined />,
  other: <FileOutlined />
}

function matchAssetQuery(asset: AgentAssetRecord, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    asset.name.toLowerCase().includes(q) ||
    asset.path.toLowerCase().includes(q) ||
    AGENT_ASSET_ZONE_LABELS[asset.zone].toLowerCase().includes(q)
  )
}

function queryMtimeLabel(iso: string): string {
  try {
    return new Date(iso).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return iso
  }
}

/** 资产预览抽屉内容：按类型分发到图片 / 音视频 / HTML / 文本 */
function AssetPreviewBody({ asset }: { asset: AgentAssetRecord }): React.ReactElement {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [textContent, setTextContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setImageUrl(null)
    setMediaUrl(null)
    setTextContent(null)

    void (async () => {
      if (asset.kind === 'image') {
        const url = await queryLocalImageDataUrl(asset.path)
        if (!cancelled) setImageUrl(url)
      } else if (asset.kind === 'video' || asset.kind === 'audio' || asset.kind === 'html') {
        const url = await queryLocalMediaUrl(asset.path)
        if (!cancelled) setMediaUrl(url)
      } else if (asset.kind === 'document' || asset.kind === 'other') {
        const text = await queryAgentAssetTextPreview(asset.path)
        if (!cancelled) setTextContent(text)
      }
      if (!cancelled) setLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [asset.path, asset.kind])

  if (loading) {
    return (
      <div className={styles.previewLoading}>
        <Spin />
        <Text type="secondary">正在加载预览…</Text>
      </div>
    )
  }

  if (asset.kind === 'image' && imageUrl) {
    return (
      <div className={styles.previewImageWrap}>
        <Image src={imageUrl} alt={asset.name} className={styles.previewImage} />
      </div>
    )
  }

  if (asset.kind === 'video' && mediaUrl) {
    return <video controls className={styles.previewMedia} src={mediaUrl} />
  }

  if (asset.kind === 'audio' && mediaUrl) {
    return <audio controls className={styles.previewAudio} src={mediaUrl} />
  }

  if (asset.kind === 'html' && mediaUrl) {
    return (
      <iframe
        className={styles.previewFrame}
        title={asset.name}
        src={mediaUrl}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    )
  }

  if (textContent != null) {
    return <pre className={styles.previewText}>{textContent}</pre>
  }

  return (
    <div className={styles.previewFallback}>
      <FileOutlined className={styles.previewFallbackIcon} />
      <Text type="secondary">该文件类型暂不支持内联预览，请使用下方操作打开</Text>
    </div>
  )
}

/** 设置页资产管理 */
export function AssetsPanel(): React.ReactElement {
  const [loading, setLoading] = useState(true)
  const [assets, setAssets] = useState<AgentAssetRecord[]>([])
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [kindFilter, setKindFilter] = useState<KindFilter>('all')
  const [zoneFilter, setZoneFilter] = useState<ZoneFilter>('all')
  const [deletingPath, setDeletingPath] = useState<string | null>(null)
  const [batchDeleting, setBatchDeleting] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(() => new Set())

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewAsset, setPreviewAsset] = useState<AgentAssetRecord | null>(null)

  const hydrate = useCallback(async (): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      const list = await queryAgentAssets()
      setAssets(list)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '加载资产列表失败'
      setError(msg)
      message.error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  const filtered = useMemo(() => {
    return assets.filter((a) => {
      if (kindFilter !== 'all' && a.kind !== kindFilter) return false
      if (zoneFilter !== 'all' && a.zone !== zoneFilter) return false
      return matchAssetQuery(a, search)
    })
  }, [assets, kindFilter, zoneFilter, search])

  const totalSize = useMemo(
    () => assets.reduce((sum, a) => sum + a.size, 0),
    [assets]
  )

  const selectedCount = selectedPaths.size

  const selectedInFilteredCount = useMemo(
    () => filtered.filter((asset) => selectedPaths.has(asset.path)).length,
    [filtered, selectedPaths]
  )

  const allFilteredSelected =
    filtered.length > 0 && selectedInFilteredCount === filtered.length

  const someFilteredSelected =
    selectedInFilteredCount > 0 && selectedInFilteredCount < filtered.length

  const selectedTotalSize = useMemo(
    () => assets.filter((asset) => selectedPaths.has(asset.path)).reduce((sum, a) => sum + a.size, 0),
    [assets, selectedPaths]
  )

  const toggleAssetSelected = (path: string, checked: boolean): void => {
    setSelectedPaths((prev) => {
      const next = new Set(prev)
      if (checked) next.add(path)
      else next.delete(path)
      return next
    })
  }

  const handleToggleSelectAllFiltered = (): void => {
    setSelectedPaths((prev) => {
      const next = new Set(prev)
      if (allFilteredSelected) {
        filtered.forEach((asset) => next.delete(asset.path))
      } else {
        filtered.forEach((asset) => next.add(asset.path))
      }
      return next
    })
  }

  const clearSelection = (): void => {
    setSelectedPaths(new Set())
  }

  const openPreview = (asset: AgentAssetRecord): void => {
    setPreviewAsset(asset)
    setPreviewOpen(true)
  }

  const handleDelete = async (asset: AgentAssetRecord): Promise<void> => {
    setDeletingPath(asset.path)
    try {
      await postDeleteAgentAsset(asset.path)
      setAssets((prev) => prev.filter((a) => a.path !== asset.path))
      setSelectedPaths((prev) => {
        if (!prev.has(asset.path)) return prev
        const next = new Set(prev)
        next.delete(asset.path)
        return next
      })
      if (previewAsset?.path === asset.path) {
        setPreviewOpen(false)
        setPreviewAsset(null)
      }
      message.success('已删除')
    } catch (err) {
      message.error(err instanceof Error ? err.message : '删除失败')
    } finally {
      setDeletingPath(null)
    }
  }

  const handleBatchDelete = (): void => {
    const paths = Array.from(selectedPaths)
    if (!paths.length) return

    Modal.confirm({
      title: `删除选中的 ${paths.length} 个文件？`,
      content: (
        <Paragraph>
          将永久删除 <Text strong>{paths.length}</Text> 个文件（共{' '}
          <Text strong>{queryFormatAssetSize(selectedTotalSize)}</Text>
          ），此操作不可撤销。
        </Paragraph>
      ),
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        setBatchDeleting(true)
        try {
          const result = await postDeleteAgentAssets(paths)
          const deleted = new Set(paths)
          setAssets((prev) => prev.filter((asset) => !deleted.has(asset.path)))
          setSelectedPaths(new Set())
          if (previewAsset && deleted.has(previewAsset.path)) {
            setPreviewOpen(false)
            setPreviewAsset(null)
          }
          message.success(`已删除 ${result.deletedCount} 个文件`)
        } catch (err) {
          message.error(err instanceof Error ? err.message : '批量删除失败')
        } finally {
          setBatchDeleting(false)
        }
      }
    })
  }

  const handleClearAll = (): void => {
    Modal.confirm({
      title: '一键清空全部资产？',
      content: (
        <div>
          <Paragraph>
            将永久删除 <Text strong>{assets.length}</Text> 个文件（共{' '}
            <Text strong>{queryFormatAssetSize(totalSize)}</Text>
            ），包括通用产物、场景素材与视频项目。此操作不可撤销。
          </Paragraph>
        </div>
      ),
      okText: '确认清空',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        setClearing(true)
        try {
          const result = await postClearAgentAssets()
          setAssets([])
          setSelectedPaths(new Set())
          setPreviewOpen(false)
          setPreviewAsset(null)
          message.success(`已清空 ${result.deletedCount} 个文件`)
        } catch (err) {
          message.error(err instanceof Error ? err.message : '清空失败')
        } finally {
          setClearing(false)
        }
      }
    })
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <div className={styles.titleRow}>
            <Title level={4} className={styles.title}>
              Agent 资产
            </Title>
            <span className={styles.countBadge}>{assets.length}</span>
          </div>
          <Text type="secondary" className={styles.panelDesc}>
            查看、预览与维护 Agent 生成的全部本地文件 · 占用 {queryFormatAssetSize(totalSize)}
          </Text>
        </div>
        <Space wrap>
          {filtered.length > 0 ? (
            <div className={styles.batchBar}>
              <Checkbox
                checked={allFilteredSelected}
                indeterminate={someFilteredSelected}
                onChange={() => handleToggleSelectAllFiltered()}
              >
                全选当前筛选
              </Checkbox>
              {selectedCount > 0 ? (
                <Space wrap size={8}>
                  <Text type="secondary" className={styles.batchHint}>
                    已选 {selectedCount} 项 · {queryFormatAssetSize(selectedTotalSize)}
                  </Text>
                  <Button type="link" size="small" onClick={clearSelection}>
                    取消选择
                  </Button>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    loading={batchDeleting}
                    onClick={handleBatchDelete}
                  >
                    删除选中
                  </Button>
                </Space>
              ) : null}
            </div>
          ) : null}
          {/* <Button
            danger
            icon={<DeleteOutlined />}
            onClick={handleClearAll}
            loading={clearing}
            disabled={!assets.length}
          >
            一键清空
          </Button> */}
          <Button icon={<ReloadOutlined />} onClick={() => void hydrate()} loading={loading}>
            刷新
          </Button>
        </Space>
      </div>

      {error ? <Alert type="error" showIcon message={error} className={styles.errorAlert} /> : null}

      <div className={styles.toolbar}>

        <Segmented
          value={kindFilter}
          onChange={(v) => setKindFilter(v as KindFilter)}
          options={KIND_FILTER_OPTIONS}
        />
        <Segmented
          value={zoneFilter}
          onChange={(v) => setZoneFilter(v as ZoneFilter)}
          options={ZONE_FILTER_OPTIONS}
        />
        <span className={styles.resultCount}>
          {filtered.length === assets.length
            ? `共 ${assets.length} 项`
            : `筛选 ${filtered.length} / ${assets.length}`}
          {selectedCount > 0 ? ` · 已选 ${selectedCount}` : ''}
        </span>
        <Input
          allowClear
          placeholder="搜索文件名或路径…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
      </div>



      <div className={styles.listScroll}>
        {/* 仅首屏无数据时全区域 Spin；刷新时由顶部按钮展示 loading，避免遮挡筛选栏 */}
        <Spin spinning={loading && assets.length === 0}>
          {filtered.length === 0 ? (
            <Empty
              className={styles.empty}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                loading
                  ? '加载中…'
                  : assets.length === 0
                    ? '暂无 Agent 产出文件'
                    : '没有匹配的资产'
              }
            />
          ) : (
            <div className={cardStyles.grid}>
              {filtered.map((asset, index) => {
                const isSelected = selectedPaths.has(asset.path)
                return (
                  <Card
                    key={asset.path}
                    variant="borderless"
                    hoverable
                    className={`${cardStyles.card} ${cardStyles.cardSelectable}${isSelected ? ` ${cardStyles.cardActive}` : ''}`}
                    style={{ '--card-index': index } as CSSProperties}
                    onClick={() => toggleAssetSelected(asset.path, !isSelected)}
                  >
                    <div className={cardStyles.cardHead}>
                      <div className={styles.assetIdentity}>
                        <Checkbox
                          className={cardStyles.cardCheckbox}
                          checked={isSelected}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => toggleAssetSelected(asset.path, e.target.checked)}
                        />
                        <span className={`${cardStyles.cardIcon} ${styles.assetIcon}`} data-kind={asset.kind}>
                          {KIND_ICON[asset.kind]}
                        </span>
                        <div className={cardStyles.cardTitleBlock}>
                          <Text className={cardStyles.cardTitle} title={asset.name}>
                            {asset.name}
                          </Text>
                          <span className={cardStyles.cardSubtitle}>
                            {queryFormatAssetSize(asset.size)} · {queryMtimeLabel(asset.mtime)}
                          </span>
                        </div>
                      </div>
                      <Tag className={cardStyles.primaryTag}>{AGENT_ASSET_KIND_LABELS[asset.kind]}</Tag>
                    </div>

                    <div className={cardStyles.cardBody}>
                      <div className={cardStyles.tagRow}>
                        <Tag className={cardStyles.mutedTag}>{AGENT_ASSET_ZONE_LABELS[asset.zone]}</Tag>
                      </div>
                      <Text
                        type="secondary"
                        className={`${cardStyles.metaMono} ${styles.assetPath}`}
                        ellipsis={{ tooltip: asset.path }}
                      >
                        {asset.path}
                      </Text>
                    </div>

                    <div className={cardStyles.cardFooter} onClick={(e) => e.stopPropagation()}>
                      <div className={styles.footerActions}>
                        <Tooltip title="预览">
                          <Button
                            type="text"
                            size="small"
                            className={styles.iconAction}
                            icon={<EyeOutlined />}
                            onClick={() => openPreview(asset)}
                            aria-label="预览"
                          />
                        </Tooltip>
                        <ArtifactFileActions
                          filePath={asset.path}
                          showBrowserOpen={asset.kind === 'html'}
                          iconOnly
                          className={styles.fileActions}
                        />
                        <Popconfirm
                          title="删除此文件？"
                          description="删除后无法恢复"
                          okText="删除"
                          okType="danger"
                          cancelText="取消"
                          onConfirm={() => void handleDelete(asset)}
                        >
                          <Tooltip title="删除">
                            <Button
                              type="text"
                              size="small"
                              danger
                              className={`${styles.iconAction} ${styles.iconActionDanger}`}
                              loading={deletingPath === asset.path}
                              icon={<DeleteOutlined />}
                              aria-label="删除"
                            />
                          </Tooltip>
                        </Popconfirm>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </Spin>
      </div>

      <Drawer
        title={previewAsset?.name ?? '资产预览'}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        width={Math.min(720, window.innerWidth - 48)}
        className={styles.previewDrawer}
        destroyOnHidden
        extra={
          previewAsset ? (
            <Space>
              <ArtifactFileActions
                filePath={previewAsset.path}
                showBrowserOpen={previewAsset.kind === 'html'}
              />
              <Popconfirm
                title="删除此文件？"
                okText="删除"
                okType="danger"
                cancelText="取消"
                onConfirm={() => previewAsset && void handleDelete(previewAsset)}
              >
                <Button danger size="small" icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            </Space>
          ) : null
        }
      >
        {previewAsset ? (
          <div className={styles.previewWrap}>
            <div className={styles.previewMeta}>
              <Tag>{AGENT_ASSET_KIND_LABELS[previewAsset.kind]}</Tag>
              <Tag>{AGENT_ASSET_ZONE_LABELS[previewAsset.zone]}</Tag>
              <Text type="secondary">{queryFormatAssetSize(previewAsset.size)}</Text>
              <Text type="secondary">{queryMtimeLabel(previewAsset.mtime)}</Text>
            </div>
            <AssetPreviewBody asset={previewAsset} />
            <Text type="secondary" className={styles.previewPath} copyable>
              {previewAsset.path}
            </Text>
          </div>
        ) : null}
      </Drawer>
    </div>
  )
}
