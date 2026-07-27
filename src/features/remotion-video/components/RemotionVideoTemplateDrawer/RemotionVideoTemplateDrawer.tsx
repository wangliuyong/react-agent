import type { HotNewsProps } from '@remotion-starter/compositions/hot-news/types'
import type { RemotionVideoProject, RemotionVideoCategory } from '../../types'
import { REMOTION_VIDEO_CATEGORY_LABEL } from '../../constants'
import { HOT_TOPIC_SOURCE_OPTIONS, type HotTopicSource } from '../../constants/hot-topic-sources'
import {
  queryAspectRatioFromCompositionId,
  queryHotNewsPlayerConfigByAspect,
  queryRemotionTemplatePreview,
  REMOTION_VIDEO_ASPECT_RATIO_OPTIONS,
  type RemotionVideoAspectRatio
} from '../../templates/template-preview-registry'
import { queryHotNewsPropsFromAgent } from '../../utils/query-hot-news-props-from-agent'
import { queryMergedHotNewsProps } from '../../utils/query-merged-hot-news-props'
import { postExportHotNewsVideo } from '../../utils/post-export-hot-news-video'
import { RemotionTemplatePreviewModal } from '../RemotionTemplatePreviewModal/RemotionTemplatePreviewModal'
import styles from './RemotionVideoTemplateDrawer.module.css'

const { Text } = Typography

interface RemotionVideoTemplateDrawerProps {
  open: boolean
  project: RemotionVideoProject | null
  onClose: () => void
}

/** 点击模板卡片：右侧抽屉内配置热点来源、分类、文案并预览 / 导出 */
export function RemotionVideoTemplateDrawer({
  open,
  project,
  onClose
}: RemotionVideoTemplateDrawerProps): React.ReactElement {
  const supportsPreview = project
    ? Boolean(queryRemotionTemplatePreview(project.compositionId))
    : false

  const [aspectRatio, setAspectRatio] = useState<RemotionVideoAspectRatio>('16:9')
  const playerConfig = useMemo(
    () => queryHotNewsPlayerConfigByAspect(aspectRatio),
    [aspectRatio]
  )

  const [userBrief, setUserBrief] = useState('')
  const [hotTopicName, setHotTopicName] = useState('')
  const [tickerLinesText, setTickerLinesText] = useState('')
  const [hotSource, setHotSource] = useState<HotTopicSource | 'all'>('all')
  const [videoCategory, setVideoCategory] = useState<RemotionVideoCategory>('news')
  const [previewProps, setPreviewProps] = useState<HotNewsProps | null>(null)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!open) return
    setUserBrief('')
    setHotTopicName('')
    setTickerLinesText('')
    setHotSource('all')
    setVideoCategory(project?.category ?? 'news')
    setAspectRatio(
      project ? queryAspectRatioFromCompositionId(project.compositionId) : '16:9'
    )
    setPreviewProps(null)
    setPreviewModalOpen(false)
  }, [open, project?.id, project?.category])

  const displayProps = useMemo(() => {
    const base = previewProps ?? playerConfig.defaultProps
    if (!base) return null
    return queryMergedHotNewsProps(base, { hotTopicName, tickerLinesText })
  }, [previewProps, playerConfig.defaultProps, hotTopicName, tickerLinesText])

  const handleRefreshPreviewOnly = (): void => {
    if (!supportsPreview) return
    if (!previewProps) {
      setPreviewProps(playerConfig.defaultProps)
    }
    setPreviewModalOpen(true)
    message.success('已应用热点名称与滚动快讯')
  }

  const handleAnalyzeAndPreview = async (): Promise<void> => {
    if (!project || !supportsPreview) return
    setAnalyzing(true)
    try {
      const props = await queryHotNewsPropsFromAgent({
        userBrief,
        hotSource,
        newsCategory: videoCategory,
        compositionId: playerConfig.compositionId,
        hotTopicName,
        tickerLinesText
      })
      setPreviewProps(props)
      if (!tickerLinesText.trim() && props.tickerLines?.length) {
        setTickerLinesText(props.tickerLines.join('\n'))
      }
      setPreviewModalOpen(true)
      message.success('已根据输入生成模板预览')
    } catch (err) {
      message.error(err instanceof Error ? err.message : '生成预览失败')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleExport = async (): Promise<void> => {
    if (!project || !supportsPreview) return
    let props = displayProps
    if (!props) {
      setAnalyzing(true)
      try {
        const raw = await queryHotNewsPropsFromAgent({
          userBrief,
          hotSource,
          newsCategory: videoCategory,
          compositionId: playerConfig.compositionId,
          hotTopicName,
          tickerLinesText
        })
        props = queryMergedHotNewsProps(raw, { hotTopicName, tickerLinesText })
        if (!tickerLinesText.trim() && props.tickerLines?.length) {
          setTickerLinesText(props.tickerLines.join('\n'))
        }
        setPreviewProps(props)
      } catch (err) {
        message.error(err instanceof Error ? err.message : '请先完成内容分析')
        setAnalyzing(false)
        return
      }
      setAnalyzing(false)
    }

    setExporting(true)
    try {
      const path = await postExportHotNewsVideo({
        compositionId: playerConfig.compositionId,
        width: playerConfig.width,
        height: playerConfig.height,
        fps: playerConfig.fps,
        durationInFrames: playerConfig.durationInFrames,
        props
      })
      message.success(`导出成功：${path}`)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '导出失败')
    } finally {
      setExporting(false)
    }
  }

  const categoryOptions = (
    Object.entries(REMOTION_VIDEO_CATEGORY_LABEL) as [RemotionVideoCategory, string][]
  ).map(([value, label]) => ({ value, label }))

  return (
    <Drawer
      title={
        <div className={styles.titleRow}>
          <span className={styles.drawerTitle}>{project?.title ?? '模板'}</span>
          {project ? (
            <Tag color="blue">{REMOTION_VIDEO_CATEGORY_LABEL[project.category]}</Tag>
          ) : null}
        </div>
      }
      placement="right"
      width="min(920px, 92vw)"
      open={open && Boolean(project && supportsPreview)}
      onClose={onClose}
      destroyOnHidden
      closable
      closeIcon={<CloseOutlined />}
      className={styles.drawer}
    >
      {project && supportsPreview ? (
        <div className={styles.body}>
          <p className={styles.lead}>{project.description}</p>

          <div className={styles.formGrid}>
            <div>
              <span className={styles.label}>视频比例</span>
              <Select
                value={aspectRatio}
                onChange={setAspectRatio}
                options={REMOTION_VIDEO_ASPECT_RATIO_OPTIONS}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <span className={styles.label}>热点来源</span>
              <Select
                value={hotSource}
                onChange={setHotSource}
                options={HOT_TOPIC_SOURCE_OPTIONS}
                style={{ width: '100%' }}
                placeholder="不选则综合全部来源"
              />
            </div>
            <div>
              <span className={styles.label}>视频分类</span>
              <Select
                value={videoCategory}
                onChange={setVideoCategory}
                options={categoryOptions}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <span className={styles.label}>热点名称</span>
              <Input
                value={hotTopicName}
                onChange={(e) => setHotTopicName(e.target.value)}
                placeholder="如：芯片、财经（显示在画面中部红色角标）"
                maxLength={8}
                allowClear
              />
            </div>
            <div className={styles.formGridFull}>
              <span className={styles.label}>LIVE 滚动快讯</span>
              <Input.TextArea
                value={tickerLinesText}
                onChange={(e) => setTickerLinesText(e.target.value)}
                placeholder="每行一条；留空时由 Agent 在「生成并预览」时根据正文自动生成"
                autoSize={{ minRows: 3, maxRows: 8 }}
              />
            </div>
            <div className={styles.formGridFull}>
              <span className={styles.label}>内容要求 / 素材</span>
              <Input.TextArea
                value={userBrief}
                onChange={(e) => setUserBrief(e.target.value)}
                placeholder="可粘贴新闻要点、口播稿，或描述想突出的热点角度；留空则由 Agent 按所选来源自动选题"
                autoSize={{ minRows: 4, maxRows: 8 }}
              />
            </div>
          </div>

          <div className={styles.actions}>
            <Button icon={<EyeOutlined />} onClick={handleRefreshPreviewOnly}>
              应用并预览
            </Button>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              loading={analyzing}
              onClick={() => void handleAnalyzeAndPreview()}
            >
              生成并预览
            </Button>
            <Button
              icon={<PlaySquareOutlined />}
              disabled={!displayProps}
              onClick={() => setPreviewModalOpen(true)}
            >
              打开预览
            </Button>
            <Button
              icon={<ExportOutlined />}
              loading={exporting}
              onClick={() => void handleExport()}
            >
              导出视频
            </Button>
          </div>

          {displayProps ? (
            <pre className={styles.jsonPreview}>{JSON.stringify(displayProps, null, 2)}</pre>
          ) : (
            <Text type="secondary" className={styles.hint}>
              点击「应用并预览」或「生成并预览」后，将在弹窗中播放视频
            </Text>
          )}
        </div>
      ) : null}

      {displayProps ? (
        <RemotionTemplatePreviewModal
          open={previewModalOpen}
          title={project ? `${project.title} · 预览` : '视频预览'}
          config={playerConfig}
          displayProps={displayProps}
          onClose={() => setPreviewModalOpen(false)}
        />
      ) : null}
    </Drawer>
  )
}
