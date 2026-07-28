import type { HotNewsProps } from '../../types/hot-news-props'
import type { RemotionVideoProject } from '../../types'
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
import {
  postApplyRemotionTemplateSkill,
  postRenderRemotionStudioExport
} from '../../api'
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
  /** 视频分类：可选预设中文名，也支持用户自由输入 */
  const [videoCategory, setVideoCategory] = useState('新闻')
  const [previewProps, setPreviewProps] = useState<HotNewsProps | null>(null)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  /** 已启动 Studio 的会话：导出走该会话工程直渲，不再新建 Agent */
  const [studioSessionId, setStudioSessionId] = useState<string | null>(null)
  const [studioProjectDir, setStudioProjectDir] = useState<string | null>(null)
  const [studioUrl, setStudioUrl] = useState<string | null>(null)
  const [studioStatus, setStudioStatus] = useState<string>('')
  const [analyzing, setAnalyzing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [applying, setApplying] = useState(false)

  /** Studio 已就绪：可直接导出当前工程画面 */
  const studioReady = Boolean(studioSessionId && studioUrl)

  useEffect(() => {
    if (!open) return
    setUserBrief('')
    setHotTopicName('')
    setTickerLinesText('')
    setHotSource(null)
    setVideoCategory(
      project?.category
        ? REMOTION_VIDEO_CATEGORY_LABEL[project.category]
        : '新闻'
    )
    setAspectRatio(
      project
        ? queryAspectRatioFromCompositionId(project.compositionId, project.previewKind)
        : '16:9'
    )
    setDurationSec(DEFAULT_HOT_NEWS_DURATION_SEC)
    setPreviewProps(null)
    setPreviewModalOpen(false)
    setStudioSessionId(null)
    setStudioProjectDir(null)
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

  /** 记录 Studio 会话上下文，供「导出视频」直渲同一工程 */
  const postRememberStudioContext = (input: {
    sessionId: string
    projectDir?: string
    studioUrl?: string | null
    status: string
  }): void => {
    setStudioSessionId(input.sessionId)
    setStudioProjectDir(input.projectDir ?? null)
    setStudioUrl(input.studioUrl ?? null)
    setStudioStatus(input.status)
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
      postRememberStudioContext({
        sessionId: session.id,
        projectDir: result.projectDir,
        studioUrl: result.studioUrl,
        status: result.message
      })
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
      postRememberStudioContext({
        sessionId: session.id,
        projectDir: result.projectDir,
        studioUrl: result.studioUrl,
        status: result.message
      })
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
        newsCategory: videoCategory.trim() || '新闻',
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

  /**
   * 导出视频：直接渲染已启动 Studio 的会话工程。
   * 不新建 Agent、不重拼装；与预览所见为同一份 Composition。
   */
  const handleExport = async (): Promise<void> => {
    if (!project || !supportsPreview) return
    if (!studioSessionId || !studioUrl) {
      message.warning('请先「生成并预览」或「预览模版」启动 Studio，再导出当前画面')
      return
    }

    setExporting(true)
    setStudioStatus('正在从 Studio 工程导出 mp4…')
    try {
      const result = await postRenderRemotionStudioExport({
        sessionId: studioSessionId,
        compositionId: playerConfig.compositionId,
        projectDir: studioProjectDir ?? undefined,
        outputFileName: `studio-${project.id}-${Date.now()}.mp4`,
        quality: 'standard',
        title: project.title
      })
      if (!result.ok) {
        throw new Error(result.message)
      }
      // 成片后主进程已关闭 Studio：清空本地就绪态
      setStudioSessionId(null)
      setStudioProjectDir(null)
      setStudioUrl(null)
      setStudioStatus(result.message)
      setPreviewModalOpen(false)
      message.success('已从当前 Studio 导出，请在导出列表查看成片')
    } catch (err) {
      message.error(err instanceof Error ? err.message : '导出失败')
    } finally {
      setExporting(false)
    }
  }

  /** AutoComplete 预设：值为中文标签，便于用户直输与 Agent 理解 */
  const categoryOptions = Object.values(REMOTION_VIDEO_CATEGORY_LABEL).map((label) => ({
    value: label
  }))

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
              <Form.Item
                label="视频分类"
                extra="可从列表选择，也可直接输入自定义分类（如：财经快讯）"
              >
                <AutoComplete
                  value={videoCategory}
                  onChange={setVideoCategory}
                  options={categoryOptions}
                  placeholder="选择或输入分类，如：新闻、财经快讯"
                  allowClear
                  filterOption={(input, option) =>
                    String(option?.value ?? '')
                      .toLowerCase()
                      .includes(input.trim().toLowerCase())
                  }
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
            {studioReady ? (
              <span className={styles.studioLive} aria-live="polite">
                <span className={styles.studioLiveDot} />
                Studio 已就绪 · 导出将渲染当前预览工程
              </span>
            ) : (
              <span className={styles.studioIdle}>先预览启动 Studio，再导出当前画面</span>
            )}
            <div className={styles.actionButtons}>
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
              <Tooltip
                title={
                  studioReady
                    ? '直接渲染已启动 Studio 的工程，所见即所得'
                    : '请先启动 Studio 后再导出'
                }
              >
                <Button
                  type={studioReady ? 'primary' : 'default'}
                  danger={studioReady}
                  icon={<ExportOutlined />}
                  loading={exporting}
                  disabled={!studioReady && !exporting}
                  onClick={() => void handleExport()}
                >
                  {exporting ? '正在导出…' : '导出视频'}
                </Button>
              </Tooltip>
            </div>
          </div>

          {displayProps ? (
            <pre className={styles.jsonPreview}>{JSON.stringify(displayProps, null, 2)}</pre>
          ) : (
            <Text type="secondary" className={styles.hint}>
              点击「生成并预览」：Agent 处理数据后拼装技能模版并打开 Studio；确认画面后点「导出视频」直渲该工程。
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
        exporting={exporting}
        onExport={() => void handleExport()}
        onClose={() => setPreviewModalOpen(false)}
      />
    </Drawer>
  )
}
