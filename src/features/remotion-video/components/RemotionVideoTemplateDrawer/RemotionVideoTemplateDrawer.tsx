import type { HotNewsProps } from '../../types/hot-news-props'
import type { RemotionVideoProject, RemotionVideoCategory } from '../../types'
import { REMOTION_VIDEO_CATEGORY_LABEL } from '../../constants'
import { HOT_TOPIC_SOURCE_OPTIONS, queryHasHotTopicSource, type HotTopicSource } from '../../constants/hot-topic-sources'
import {
  queryAspectRatioFromCompositionId,
  queryHotNewsPlayerConfigByAspect,
  queryIsHotNewsTemplateSkill,
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
import { postApplyRemotionTemplateSkill } from '../../api'
import { postCreateSession } from '@/features/chat/api'
import { RemotionTemplatePreviewModal } from '../RemotionTemplatePreviewModal/RemotionTemplatePreviewModal'
import styles from './RemotionVideoTemplateDrawer.module.css'

const { Text } = Typography

interface RemotionVideoTemplateDrawerProps {
  open: boolean
  project: RemotionVideoProject | null
  onClose: () => void
}

/** 点击模板卡片：配置内容 → 拼装技能模版 → Studio 预览 / 导出队列 */
export function RemotionVideoTemplateDrawer({
  open,
  project,
  onClose
}: RemotionVideoTemplateDrawerProps): React.ReactElement {
  const supportsPreview = Boolean(project?.hasTemplateCode)
  /** 新闻类模版必须指定信息来源（拉热点 / 生成文案依赖来源） */
  const requiresInfoSource = Boolean(
    project && (project.category === 'news' || queryIsHotNewsTemplateSkill(project.id))
  )

  const [aspectRatio, setAspectRatio] = useState<RemotionVideoAspectRatio>('16:9')
  const [durationSec, setDurationSec] = useState(DEFAULT_HOT_NEWS_DURATION_SEC)
  const playerConfig = useMemo(
    () => queryHotNewsPlayerConfigByAspect(aspectRatio, durationSec),
    [aspectRatio, durationSec]
  )

  const [userBrief, setUserBrief] = useState('')
  const [hotTopicName, setHotTopicName] = useState('')
  const [tickerLinesText, setTickerLinesText] = useState('')
  /** 新闻类默认不预选，强制用户选择信息来源 */
  const [hotSource, setHotSource] = useState<HotTopicSource | 'all' | null>(null)
  const [videoCategory, setVideoCategory] = useState<RemotionVideoCategory>('news')
  const [previewProps, setPreviewProps] = useState<HotNewsProps | null>(null)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [studioUrl, setStudioUrl] = useState<string | null>(null)
  const [studioStatus, setStudioStatus] = useState<string>('')
  const [analyzing, setAnalyzing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [applying, setApplying] = useState(false)

  useEffect(() => {
    if (!open) return
    setUserBrief('')
    setHotTopicName('')
    setTickerLinesText('')
    setHotSource(null)
    setVideoCategory(project?.category ?? 'news')
    setAspectRatio(
      project
        ? queryAspectRatioFromCompositionId(project.compositionId, project.previewKind)
        : '16:9'
    )
    setDurationSec(DEFAULT_HOT_NEWS_DURATION_SEC)
    setPreviewProps(null)
    setPreviewModalOpen(false)
    setStudioUrl(null)
    setStudioStatus('')
  }, [open, project?.id, project?.category])

  const displayProps = useMemo(() => {
    if (!previewProps) return null
    return queryMergedHotNewsProps(previewProps, { hotTopicName, tickerLinesText })
  }, [previewProps, hotTopicName, tickerLinesText])

  /** 新闻类：未选信息来源时拦截并提示 */
  const queryEnsureInfoSource = (): boolean => {
    if (!requiresInfoSource) return true
    if (queryHasHotTopicSource(hotSource)) return true
    message.warning('新闻类模版必须选择信息来源')
    return false
  }

  /** 拼装技能 template + props，打开 Studio */
  const postApplyAndOpenStudio = async (props: HotNewsProps): Promise<void> => {
    if (!project) return
    setApplying(true)
    setStudioStatus('正在拼装技能模版…')
    try {
      const session = await postCreateSession('chat')
      const result = await postApplyRemotionTemplateSkill({
        sessionId: session.id,
        skillId: project.id,
        compositionId: playerConfig.compositionId,
        props: props as unknown as Record<string, unknown>,
        width: playerConfig.width,
        height: playerConfig.height,
        fps: playerConfig.fps,
        durationInFrames: playerConfig.durationInFrames,
        openStudio: true
      })
      if (!result.ok) {
        throw new Error(result.message)
      }
      setStudioUrl(result.studioUrl ?? null)
      setStudioStatus(result.message)
      setPreviewModalOpen(true)
      message.success(result.studioUrl ? '已拼装并打开 Studio' : '模版已拼装')
    } finally {
      setApplying(false)
    }
  }

  const handlePreviewDefault = async (): Promise<void> => {
    if (!project || !supportsPreview) return
    // 无 Agent 数据时：仅拼装模版默认 props（技能内 default-props）
    setApplying(true)
    setStudioStatus('正在拼装模版默认画面…')
    try {
      const session = await postCreateSession('chat')
      const result = await postApplyRemotionTemplateSkill({
        sessionId: session.id,
        skillId: project.id,
        compositionId: playerConfig.compositionId,
        width: playerConfig.width,
        height: playerConfig.height,
        fps: playerConfig.fps,
        durationInFrames: playerConfig.durationInFrames,
        openStudio: true
      })
      if (!result.ok) throw new Error(result.message)
      setStudioUrl(result.studioUrl ?? null)
      setStudioStatus(result.message)
      setPreviewModalOpen(true)
      message.success('已用模版默认数据打开 Studio')
    } catch (err) {
      message.error(err instanceof Error ? err.message : '拼装预览失败')
    } finally {
      setApplying(false)
    }
  }

  const handleAnalyzeAndPreview = async (): Promise<void> => {
    if (!project || !supportsPreview) return
    if (!queryEnsureInfoSource()) return
    if (!queryIsHotNewsTemplateSkill(project.id)) {
      message.info('当前模版请先完善内容后再预览，或使用「预览模版」查看占位画面')
      await handlePreviewDefault()
      return
    }
    if (!queryHasHotTopicSource(hotSource)) return
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
      const merged = queryMergedHotNewsProps(props, { hotTopicName, tickerLinesText })
      setPreviewProps(merged)
      if (!tickerLinesText.trim() && merged.tickerLines?.length) {
        setTickerLinesText(merged.tickerLines.join('\n'))
      }
      await postApplyAndOpenStudio(merged)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '生成预览失败')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleExport = async (): Promise<void> => {
    if (!project || !supportsPreview) return
    if (!queryEnsureInfoSource()) return
    let props = displayProps
    if (!props && queryIsHotNewsTemplateSkill(project.id)) {
      if (!queryHasHotTopicSource(hotSource)) return
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
      await postEnqueueHotNewsExport({
        skillId: project.id,
        compositionId: playerConfig.compositionId,
        width: playerConfig.width,
        height: playerConfig.height,
        fps: playerConfig.fps,
        durationInFrames: playerConfig.durationInFrames,
        props: props ?? undefined,
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

  const busy = analyzing || applying

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
          <p className={styles.lead}>
            {project.description}
            <br />
            模版源码来自技能 <code>{project.id}</code>，拼装后经 Remotion Studio 预览。
          </p>

          <Form layout="vertical" className={styles.form}>
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
              {requiresInfoSource ? (
                <Form.Item
                  label="信息来源"
                  required
                  extra="新闻类模版必选；生成并预览 / 导出前须指定来源"
                >
                  <Select
                    value={hotSource ?? undefined}
                    onChange={setHotSource}
                    options={HOT_TOPIC_SOURCE_OPTIONS}
                    placeholder="请选择信息来源"
                    allowClear={false}
                  />
                </Form.Item>
              ) : null}
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
              extra="可写节奏要求或粘贴素材；Agent 处理后与技能模版拼装再预览。"
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
            <Button
              icon={<EyeOutlined />}
              loading={applying && !analyzing}
              onClick={() => void handlePreviewDefault()}
            >
              预览模版
            </Button>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              loading={busy}
              onClick={() => void handleAnalyzeAndPreview()}
            >
              {analyzing ? '拉取热点并拼装…' : applying ? '拼装中…' : '生成并预览'}
            </Button>
            <Button
              icon={<PlaySquareOutlined />}
              disabled={!studioUrl}
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
              点击「生成并预览」：Agent 处理数据后拼装技能模版并打开 Studio
            </Text>
          )}
        </div>
      ) : null}

      <RemotionTemplatePreviewModal
        open={previewModalOpen}
        title={project ? `${project.title} · Studio` : '视频预览'}
        config={playerConfig}
        studioUrl={studioUrl}
        statusText={studioStatus}
        onClose={() => setPreviewModalOpen(false)}
      />
    </Drawer>
  )
}
