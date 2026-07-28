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
import {
  DEFAULT_HOT_NEWS_DURATION_SEC,
  HOT_NEWS_DURATION_MAX_SEC,
  HOT_NEWS_DURATION_MIN_SEC
} from '../../utils/query-hot-news-content-budget'
import { queryMergedHotNewsProps } from '../../utils/query-merged-hot-news-props'
import { postEnqueueHotNewsExport } from '../../utils/post-export-hot-news-video'
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
  const [durationSec, setDurationSec] = useState(DEFAULT_HOT_NEWS_DURATION_SEC)
  const playerConfig = useMemo(
    () => queryHotNewsPlayerConfigByAspect(aspectRatio, durationSec),
    [aspectRatio, durationSec]
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
    setDurationSec(DEFAULT_HOT_NEWS_DURATION_SEC)
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
        tickerLinesText,
        durationSec
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
          tickerLinesText,
          durationSec
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
      // 入队后立即返回；成片在后台渲染，结果见导出列表
      await postEnqueueHotNewsExport({
        compositionId: playerConfig.compositionId,
        width: playerConfig.width,
        height: playerConfig.height,
        fps: playerConfig.fps,
        durationInFrames: playerConfig.durationInFrames,
        props,
        title: project.title
      })
      message.success('已加入任务队列，请在导出列表查看导出结果')
    } catch (err) {
      message.error(err instanceof Error ? err.message : '加入导出队列失败')
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

          <Form layout="vertical" className={styles.form}>
            {/* 较短控件四列排放，长文本单独占满一行 */}
            <div className={styles.formShortGrid}>
              <Form.Item label="视频比例">
                <Select
                  value={aspectRatio}
                  onChange={setAspectRatio}
                  options={REMOTION_VIDEO_ASPECT_RATIO_OPTIONS}
                />
              </Form.Item>
              <Form.Item
                label="视频时长（秒）"
                extra={`${HOT_NEWS_DURATION_MIN_SEC}-${HOT_NEWS_DURATION_MAX_SEC} 秒`}
              >
                <InputNumber
                  value={durationSec}
                  min={HOT_NEWS_DURATION_MIN_SEC}
                  max={HOT_NEWS_DURATION_MAX_SEC}
                  step={1}
                  style={{ width: '100%' }}
                  onChange={(value) => {
                    if (value == null || Number.isNaN(value)) return
                    setDurationSec(
                      Math.min(
                        HOT_NEWS_DURATION_MAX_SEC,
                        Math.max(HOT_NEWS_DURATION_MIN_SEC, Math.round(value))
                      )
                    )
                  }}
                />
              </Form.Item>
              <Form.Item label="热点来源">
                <Select
                  value={hotSource}
                  onChange={setHotSource}
                  options={HOT_TOPIC_SOURCE_OPTIONS}
                  placeholder="综合全部来源"
                />
              </Form.Item>
              <Form.Item label="视频分类">
                <Select
                  value={videoCategory}
                  onChange={setVideoCategory}
                  options={categoryOptions}
                />
              </Form.Item>
              <Form.Item label="热点名称" extra="画面中部红色角标">
                <Input
                  value={hotTopicName}
                  onChange={(e) => setHotTopicName(e.target.value)}
                  placeholder="如：芯片、财经"
                  maxLength={8}
                  allowClear
                  showCount
                />
              </Form.Item>
            </div>
            <Form.Item
              label="内容要求 / 素材"
              extra="可写「播 4 条、每条 5 秒」等节奏要求，或粘贴素材；Agent 会先拉热点标题再查详情生成播报文案。"
              className={styles.formFull}
            >
              <Input.TextArea
                className={styles.promptArea}
                value={userBrief}
                onChange={(e) => setUserBrief(e.target.value)}
                placeholder="例如：科技向，播 4 条，每条约 5 秒，需要详细播报"
                autoSize={{ minRows: 4, maxRows: 8 }}
              />
            </Form.Item>
          </Form>

          <div className={styles.actions}>
            <Button icon={<EyeOutlined />} onClick={handleRefreshPreviewOnly}>
              预览模版
            </Button>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              loading={analyzing}
              onClick={() => void handleAnalyzeAndPreview()}
            >
              {analyzing ? '拉取热点并查详情…' : '生成并预览'}
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
              点击「预览模版」或「生成并预览」后，将在弹窗中播放视频
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
