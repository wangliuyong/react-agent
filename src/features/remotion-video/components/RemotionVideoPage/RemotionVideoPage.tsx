import type { CSSProperties } from 'react'
import type { RemotionVideoCategory, RemotionVideoProject } from '../../types'
import {
  REMOTION_VIDEO_CATEGORY_LABEL,
  REMOTION_VIDEO_CATEGORY_TABS,
  REMOTION_VIDEO_STATUS_META
} from '../../constants'
import { REMOTION_VIDEO_SEED_PROJECTS } from '../../data/seed-projects'
import {
  formatRemotionDuration,
  queryRemotionVideoSearch,
  queryRemotionVideoSorted,
  queryRemotionVideosByCategory,
  type RemotionVideoSort
} from '../../utils/query-remotion-video-list'
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
 * 按视频分类 Tab 筛选（歌曲、新闻等），后续可接编辑器路由与渲染队列。
 */
export function RemotionVideoPage(): React.ReactElement {
  const [category, setCategory] = useState<RemotionVideoCategory | 'all'>('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<RemotionVideoSort>('updated_desc')

  const filtered = useMemo(() => {
    const byCategory = queryRemotionVideosByCategory(REMOTION_VIDEO_SEED_PROJECTS, category)
    const bySearch = queryRemotionVideoSearch(byCategory, search)
    return queryRemotionVideoSorted(bySearch, sort)
  }, [category, search, sort])

  const handleOpenProject = (project: RemotionVideoProject): void => {
    message.info(`「${project.title}」编辑器即将接入，当前为列表预览`)
  }

  const handleCreate = (): void => {
    message.info('新建 Remotion 合成即将接入')
  }

  return (
    <FeaturePageShell className={styles.remotionVideoPage}>
      <FeaturePageHeader
        icon={<VideoCameraOutlined />}
        title="Remotion 视频生产"
        badge={REMOTION_VIDEO_SEED_PROJECTS.length}
        description="基于 Remotion 的模板化成片与批量渲染；按业务分类管理合成项目"
        extra={
          <Space wrap>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              新建合成
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => message.success('列表已刷新')}>
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
        {filtered.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="该分类下暂无项目，可切换 Tab 或新建合成"
            className={styles.empty}
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              新建合成
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
    </FeaturePageShell>
  )
}
