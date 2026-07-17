import type { WorkflowCanvas as WorkflowCanvasModel, WorkflowDefinition } from '@shared/types'
import { useWorkflowsStore } from '../../hooks/useWorkflowsStore'
import { WorkflowCard } from '../WorkflowCard'
import { WorkflowDetailModal } from '../WorkflowDetailModal'
import { WorkflowCanvasDrawer } from '../WorkflowCanvasDrawer'
import { useSessionStore } from '@/features/chat'
import { useAppStore } from '@/stores/app-store'
import styles from './WorkflowsPage.module.css'

const { Title, Text } = Typography

type WorkflowKindFilter = 'all' | 'generic' | 'publish'
type WorkflowSort = 'updated_desc' | 'name_asc' | 'name_desc'

function matchWorkflowQuery(wf: WorkflowDefinition, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    wf.title.toLowerCase().includes(q) ||
    wf.description.toLowerCase().includes(q) ||
    wf.id.toLowerCase().includes(q)
  )
}

function sortWorkflows(list: WorkflowDefinition[], sort: WorkflowSort): WorkflowDefinition[] {
  const next = [...list]
  if (sort === 'name_asc') return next.sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'))
  if (sort === 'name_desc') return next.sort((a, b) => b.title.localeCompare(a.title, 'zh-CN'))
  return next.sort((a, b) => b.updatedAt - a.updatedAt)
}

/**
 * 流程市场页：卡片网格（对齐技能市场）+ 点击打开详情弹窗，画布独立抽屉打开。
 */
export function WorkflowsPage(): React.ReactElement {
  const workflows = useWorkflowsStore((s) => s.workflows)
  const loading = useWorkflowsStore((s) => s.loading)
  const running = useWorkflowsStore((s) => s.running)
  const hydrate = useWorkflowsStore((s) => s.hydrate)
  const createDraft = useWorkflowsStore((s) => s.createDraft)
  const saveWorkflow = useWorkflowsStore((s) => s.saveWorkflow)
  const removeWorkflow = useWorkflowsStore((s) => s.removeWorkflow)
  const runWorkflow = useWorkflowsStore((s) => s.runWorkflow)

  const beginExternalRun = useSessionStore((s) => s.beginExternalRun)
  const hydrateSessions = useSessionStore((s) => s.hydrate)
  const setView = useAppStore((s) => s.setView)

  const [kind, setKind] = useState<WorkflowKindFilter>('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<WorkflowSort>('updated_desc')

  const [detailOpen, setDetailOpen] = useState(false)
  const [canvasDrawerOpen, setCanvasDrawerOpen] = useState(false)
  const [draft, setDraft] = useState<WorkflowDefinition | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  const filtered = useMemo(() => {
    let list = workflows
    if (kind === 'generic') list = list.filter((w) => w.templateKind === 'generic')
    if (kind === 'publish') list = list.filter((w) => w.templateKind === 'publish')
    list = list.filter((w) => matchWorkflowQuery(w, search))
    return sortWorkflows(list, sort)
  }, [workflows, kind, search, sort])

  const cloneDraft = (wf: WorkflowDefinition): WorkflowDefinition => ({
    ...wf,
    nodes: [...wf.nodes],
    canvas: wf.canvas
      ? {
          positions: { ...wf.canvas.positions },
          edges: [...wf.canvas.edges]
        }
      : undefined
  })

  /** 点击卡片：打开流程详情弹窗（对齐技能市场） */
  const openDetail = (id: string): void => {
    const wf = workflows.find((w) => w.id === id)
    if (!wf) return
    setDraft(cloneDraft(wf))
    setDetailOpen(true)
  }

  const closeDetail = (): void => {
    setDetailOpen(false)
    setCanvasDrawerOpen(false)
    setDraft(null)
  }

  const openCanvasDrawer = (): void => {
    if (!draft) return
    setCanvasDrawerOpen(true)
  }

  const closeCanvasDrawer = (): void => {
    setCanvasDrawerOpen(false)
  }

  const patchDraft = (
    patch: Partial<
      Pick<WorkflowDefinition, 'title' | 'description' | 'templateKind' | 'nodes' | 'canvas'>
    >
  ): void => {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev))
  }

  const handleCanvasChange = (next: {
    nodes: WorkflowDefinition['nodes']
    canvas: WorkflowCanvasModel
  }): void => {
    patchDraft({ nodes: next.nodes, canvas: next.canvas })
  }

  const handleCreate = async (): Promise<void> => {
    try {
      const created = await createDraft()
      setDraft(cloneDraft(created))
      setDetailOpen(true)
      message.success('已创建，可在弹窗中完善信息并编排画布')
    } catch (err) {
      message.error(err instanceof Error ? err.message : '创建失败')
    }
  }

  const handleSave = async (): Promise<void> => {
    if (!draft) return
    if (!draft.title.trim()) {
      message.warning('请填写流程标题')
      return
    }
    setSaving(true)
    try {
      const saved = await saveWorkflow(draft)
      setDraft(cloneDraft(saved))
      message.success('流程已保存')
      closeDetail()
    } catch (err) {
      message.error(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    try {
      await removeWorkflow(id)
      if (draft?.id === id) closeDetail()
      message.success('已删除')
    } catch (err) {
      message.error(err instanceof Error ? err.message : '删除失败')
    }
  }

  const handleRun = async (workflowId?: string): Promise<void> => {
    const id = workflowId ?? draft?.id
    if (!id) return

    setSaving(true)
    try {
      let targetId = id
      // 抽屉内运行：先落盘当前草稿
      if (draft && draft.id === id) {
        if (!draft.nodes.length) {
          message.warning('请先添加步骤再运行')
          return
        }
        if (!draft.title.trim()) {
          message.warning('请填写流程标题')
          return
        }
        const saved = await saveWorkflow(draft)
        setDraft(cloneDraft(saved))
        targetId = saved.id
      } else {
        const wf = workflows.find((w) => w.id === id)
        if (!wf?.nodes.length) {
          message.warning('请先添加步骤再运行')
          return
        }
      }

      const sessionId = await runWorkflow(targetId)
      await hydrateSessions()
      beginExternalRun(sessionId)
      closeDetail()
      setView('chat')
      message.success('流程已启动，已跳转到会话')
    } catch (err) {
      message.error(err instanceof Error ? err.message : '启动失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <div className={styles.headerIcon}>
            <AppstoreOutlined />
          </div>
          <div>
            <div className={styles.titleRow}>
              <Title level={3} className={styles.title}>
                流程
              </Title>
              <span className={styles.countBadge}>{workflows.length}</span>
            </div>
            <Text type="secondary" className={styles.desc}>
              卡片浏览流程，点击查看详情；在画布中拖拽连线编排并运行
            </Text>
          </div>
        </div>
        <Space wrap>
          <Button
            icon={<ReloadOutlined />}
            onClick={async () => {
              await hydrate()
              message.success('已刷新')
            }}
          >
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => void handleCreate()}>
            新建流程
          </Button>
        </Space>
      </header>

      <div className={styles.toolbar}>
        <Segmented
          value={kind}
          onChange={(v) => setKind(v as WorkflowKindFilter)}
          options={[
            { label: '全部', value: 'all' },
            { label: '通用', value: 'generic' },
            { label: '发布', value: 'publish' }
          ]}
        />
        <div className={styles.toolbarRight}>
          <span className={styles.resultCount}>{filtered.length} 项</span>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索流程..."
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
              { label: '名称 A→Z', value: 'name_asc' },
              { label: '名称 Z→A', value: 'name_desc' }
            ]}
          />
        </div>
      </div>

      <div className={styles.body}>
        <Spin spinning={loading && workflows.length === 0}>
          {filtered.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={workflows.length === 0 ? '暂无流程' : '暂无匹配的流程'}
              className={styles.empty}
            >
              {workflows.length === 0 ? (
                <Button type="primary" icon={<PlusOutlined />} onClick={() => void handleCreate()}>
                  新建流程
                </Button>
              ) : null}
            </Empty>
          ) : (
            <div className={styles.grid}>
              {filtered.map((wf, index) => (
                <WorkflowCard key={wf.id} workflow={wf} index={index} onOpen={openDetail} />
              ))}
            </div>
          )}
        </Spin>
      </div>

      <WorkflowDetailModal
        open={detailOpen}
        draft={draft}
        saving={saving}
        running={running}
        onClose={closeDetail}
        onPatch={patchDraft}
        onOpenCanvas={openCanvasDrawer}
        onSave={() => void handleSave()}
        onRun={() => void handleRun()}
        onDelete={(id) => void handleDelete(id)}
      />

      <WorkflowCanvasDrawer
        open={canvasDrawerOpen}
        draft={draft}
        saving={saving}
        running={running}
        onClose={closeCanvasDrawer}
        onCanvasChange={handleCanvasChange}
        onSave={() => void handleSave()}
        onRun={() => void handleRun()}
      />
    </div>
  )
}
