/**
 * AI 视频项目管理页：画布卡片列表 + 新增。
 */

import { useEffect, useState, type CSSProperties } from 'react'
import type { AiVideoProject } from '@shared/ai-video'
import { useAppStore } from '@/stores/app-store'
import { useAiVideoStore, postBindAiVideoEvents } from '../../hooks/useAiVideoStore'
import {
  FeaturePageShell,
  FeaturePageHeader,
  FeaturePageToolbar,
  FeatureScrollBody,
  shellStyles
} from '@/components/page-shell'
import styles from './AiVideoPage.module.css'

function ProjectCard({
  project,
  index,
  onOpen,
  onDelete
}: {
  project: AiVideoProject
  index: number
  onOpen: (p: AiVideoProject) => void
  onDelete: (id: string) => void
}): React.ReactElement {
  const [thumb, setThumb] = useState<string | null>(null)
  const updatedLabel = new Date(project.updatedAt).toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  useEffect(() => {
    let cancelled = false
    if (!project.thumbnailPath) {
      setThumb(null)
      return
    }
    void window.api.queryLocalImageDataUrl(project.thumbnailPath).then((url) => {
      if (!cancelled) setThumb(url)
    })
    return () => {
      cancelled = true
    }
  }, [project.thumbnailPath])

  return (
    <div
      className={styles.projectCard}
      style={{ '--card-index': index } as CSSProperties}
    >
      <button type="button" className={styles.cardMain} onClick={() => onOpen(project)}>
        <div className={styles.thumb} aria-hidden>
          {thumb ? (
            <img src={thumb} alt="" className={styles.thumbImg} />
          ) : (
            <div className={styles.thumbPlaceholder}>
              <VideoCameraOutlined />
            </div>
          )}
        </div>
        <div className={styles.body}>
          <h3 className={styles.title}>{project.title}</h3>
          <div className={styles.foot}>
            <Tag bordered={false}>{project.canvas.nodes.length} 节点</Tag>
            <span className={styles.updated}>更新 {updatedLabel}</span>
          </div>
        </div>
      </button>
      <Popconfirm
        title="删除此画布？"
        description="将删除画布配置与本地生成产物"
        okText="删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        onConfirm={(e) => {
          e?.stopPropagation()
          onDelete(project.id)
        }}
      >
        <Button
          type="text"
          danger
          size="small"
          className={styles.deleteBtn}
          icon={<DeleteOutlined />}
          onClick={(e) => e.stopPropagation()}
        />
      </Popconfirm>
    </div>
  )
}

export function AiVideoPage(): React.ReactElement {
  const setView = useAppStore((s) => s.setView)
  const projects = useAiVideoStore((s) => s.projects)
  const loaded = useAiVideoStore((s) => s.loaded)
  const hydrate = useAiVideoStore((s) => s.hydrate)
  const postCreate = useAiVideoStore((s) => s.postCreate)
  const postOpen = useAiVideoStore((s) => s.postOpen)
  const postDelete = useAiVideoStore((s) => s.postDelete)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    postBindAiVideoEvents()
    void hydrate()
  }, [hydrate])

  const handleCreate = async (): Promise<void> => {
    setCreating(true)
    try {
      const project = await postCreate()
      message.success('已创建画布')
      setView('ai-video-canvas')
      void postOpen(project.id)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '创建失败')
    } finally {
      setCreating(false)
    }
  }

  const handleOpen = async (project: AiVideoProject): Promise<void> => {
    await postOpen(project.id)
    setView('ai-video-canvas')
  }

  const handleDelete = async (id: string): Promise<void> => {
    try {
      await postDelete(id)
      message.success('已删除')
    } catch {
      message.error('删除失败')
    }
  }

  return (
    <FeaturePageShell>
      <FeaturePageHeader
        icon={<VideoCameraOutlined />}
        title="AI 视频"
        badge="ComfyUI"
        badgeVariant="muted"
        description="无限画布编排编剧→定妆/场景/道具→分镜→视频→成片，节点调用远程 ComfyUI 工作流"
        extra={
          <Button type="primary" icon={<PlusOutlined />} loading={creating} onClick={() => void handleCreate()}>
            新增画布
          </Button>
        }
      />
      <FeaturePageToolbar>
        <span className={shellStyles.resultCount}>
          {loaded ? `${projects.length} 个项目` : '加载中…'}
        </span>
        <div className={shellStyles.toolbarRight}>
          <Button icon={<ReloadOutlined />} onClick={() => void hydrate()}>
            刷新
          </Button>
        </div>
      </FeaturePageToolbar>
      <FeatureScrollBody>
        {!loaded ? (
          <div className={styles.empty}>
            <Spin />
          </div>
        ) : projects.length === 0 ? (
          <div className={styles.empty}>
            <Empty description="还没有画布，点击右上角新增" />
          </div>
        ) : (
          <div className={styles.grid}>
            {projects.map((p, i) => (
              <ProjectCard
                key={p.id}
                project={p}
                index={i}
                onOpen={(proj) => void handleOpen(proj)}
                onDelete={(id) => void handleDelete(id)}
              />
            ))}
          </div>
        )}
      </FeatureScrollBody>
    </FeaturePageShell>
  )
}
