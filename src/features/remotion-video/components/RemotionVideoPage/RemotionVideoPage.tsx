import type { CSSProperties } from 'react'
import type { RemotionVideoCategory, RemotionVideoProject } from '../../types'
import {
  REMOTION_VIDEO_CATEGORY_LABEL,
  REMOTION_VIDEO_CATEGORY_TABS,
  REMOTION_VIDEO_STATUS_META
} from '../../constants'
import { queryRemotionVideoTemplates } from '../../api'
import {
  formatRemotionDuration,
  queryRemotionVideoSearch,
  queryRemotionVideoSorted,
  queryRemotionVideosByCategory,
  type RemotionVideoSort
} from '../../utils/query-remotion-video-list'
import { RemotionVideoTemplateDrawer } from '../RemotionVideoTemplateDrawer/RemotionVideoTemplateDrawer'
import { RemotionExportListDrawer } from '../RemotionExportListDrawer/RemotionExportListDrawer'
import {
  FeaturePageShell,
  FeaturePageHeader,
  FeaturePageToolbar,
  FeatureScrollBody,
  shellStyles
} from '@/components/page-shell'
import styles from './RemotionVideoPage.module.css'

/** 单条项目卡片：胶片风缩略图 + 状态与分类 */
function RemotionVideoProjectCard({
  project,
  index,
  onOpen
}: {
  project: RemotionVideoProject
  index: number
  onOpen: (project: RemotionVideoProject) => void
}): React.ReactElement {
  const statusMeta = REMOTION_VIDEO_STATUS_META[project.status]
  const updatedLabel = new Date(project.updatedAt).toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <button
      type="button"
      className={styles.projectCard}
      style={
        {
          '--card-index': index,
          '--card-accent': project.accent
        } as CSSProperties
      }
      onClick={() => onOpen(project)}
    >
      <div className={styles.thumb} aria-hidden>
        <div className={styles.thumbGrid} />
        <div className={styles.thumbScan} />
        <div className={styles.thumbMeta}>
          <span className={styles.compositionId}>{project.compositionId}</span>
          <span className={styles.duration}>{formatRemotionDuration(project.durationSec)}</span>
        </div>
      </div>
      <div className={styles.body}>
        <div className={styles.head}>
          <h3 className={styles.title}>{project.title}</h3>
          <Tag color={statusMeta.tone} bordered={false}>
            {statusMeta.label}
          </Tag>
        </div>
        <p className={styles.desc}>{project.description}</p>
        <div className={styles.foot}>
          <Tag className={styles.categoryTag} color="blue">
            {REMOTION_VIDEO_CATEGORY_LABEL[project.category]}
          </Tag>
          <span className={styles.updated}>更新 {updatedLabel}</span>
        </div>
      </div>
    </button>
  )
}

/**
 * Remotion 视频生产 — 列表页。
 * 模版来自内置技能市场（remotion-template-*），不写死在代码中。
 */
export function RemotionVideoPage(): React.ReactElement {
  const [category, setCategory] = useState<RemotionVideoCategory | 'all'>('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<RemotionVideoSort>('updated_desc')
  const [projects, setProjects] = useState<RemotionVideoProject[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerProject, setDrawerProject] = useState<RemotionVideoProject | null>(null)
  const [exportListOpen, setExportListOpen] = useState(false)

  const loadTemplates = useCallback(async (): Promise<void> => {
    try {
      const list = await queryRemotionVideoTemplates()
      setProjects(list)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '加载 Remotion 模版失败')
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void (async () => {
      await loadTemplates()
      if (!cancelled) setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [loadTemplates])

  const filtered = useMemo(() => {
    const byCategory = queryRemotionVideosByCategory(projects, category)
    const bySearch = queryRemotionVideoSearch(byCategory, search)
    return queryRemotionVideoSorted(bySearch, sort)
  }, [projects, category, search, sort])

  const handleOpenProject = (project: RemotionVideoProject): void => {
    if (project.hasTemplateCode) {
      setDrawerProject(project)
      return
    }
    message.info(
      `「${project.title}」技能 ${project.id} 尚未包含 template/ 源码，请先在技能中补充 Composition`
    )
  }

  const handleCreate = (): void => {
    message.info('新建 Remotion 合成即将接入；也可在技能市场安装 remotion-template-* 模版')
  }

  const handleRefresh = (): void => {
    setLoading(true)
    void loadTemplates()
      .then(() => message.success('模版列表已从内置技能刷新'))
      .finally(() => setLoading(false))
  }

  return (
    <FeaturePageShell className={styles.remotionVideoPage}>
      <FeaturePageHeader
        icon={<VideoCameraOutlined />}
        title="Remotion 视频生产"
        badge={projects.length}
        description="模版来自技能市场内置 remotion-template-* 技能；按业务分类管理合成与导出"
        extra={
          <Space wrap>
            <Button icon={<UnorderedListOutlined />} onClick={() => setExportListOpen(true)}>
              导出列表
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              新建合成
            </Button>
            <Button icon={<ReloadOutlined />} loading={loading} onClick={handleRefresh}>
              刷新
            </Button>
          </Space>
        }
      />

      <FeaturePageToolbar>
        <Segmented
          value={category}
          onChange={(v) => setCategory(v as RemotionVideoCategory | 'all')}
          options={REMOTION_VIDEO_CATEGORY_TABS.map((tab) => ({
            label: tab.label,
            value: tab.key
          }))}
        />
        <div className={shellStyles.toolbarRight}>
          <span className={shellStyles.resultCount}>{filtered.length} 项</span>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索标题或 Composition…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          <Select
            value={sort}
            onChange={setSort}
            className={styles.sortSelect}
            options={[
              { label: '最近更新', value: 'updated_desc' },
              { label: '名称 A→Z', value: 'title_asc' },
              { label: '时长最短', value: 'duration_asc' }
            ]}
          />
        </div>
      </FeaturePageToolbar>

      <FeatureScrollBody>
        {loading && projects.length === 0 ? (
          <div className={styles.empty}>
            {/* tip 仅在嵌套/全屏模式生效，文案与 Spin 并列展示 */}
            <Spin />
            <Typography.Text type="secondary">正在从内置技能加载模版…</Typography.Text>
          </div>
        ) : filtered.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无模版技能。请确认 resources/skills 下存在 remotion-template-* 内置技能"
            className={styles.empty}
          >
            <Button type="primary" icon={<ReloadOutlined />} onClick={handleRefresh}>
              重新加载
            </Button>
          </Empty>
        ) : (
          <div className={styles.grid} role="list">
            {filtered.map((project, index) => (
              <RemotionVideoProjectCard
                key={project.id}
                project={project}
                index={index}
                onOpen={handleOpenProject}
              />
            ))}
          </div>
        )}
      </FeatureScrollBody>

      <RemotionVideoTemplateDrawer
        open={Boolean(drawerProject)}
        project={drawerProject}
        onClose={() => setDrawerProject(null)}
      />
      <RemotionExportListDrawer open={exportListOpen} onClose={() => setExportListOpen(false)} />
    </FeaturePageShell>
  )
}
