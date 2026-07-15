import type { CSSProperties } from 'react'
import { usePublishStore } from '../../hooks/usePublishStore'
import {
  createEmptyPlan,
  createEmptySubTask,
  normalizePublishSubTask,
  normalizePublishPlan,
  normalizePublishPlanWorkflowIds,
  queryPublishChannelLabel,
  queryPublishPlanKindLabel
} from '../../types'
import { useChannelsStore, queryEnabledPublishChannelsFromStore, queryEnabledNotifyChannelsFromStore } from '@/features/channels'
import { useWorkflowsStore } from '@/features/workflows'
import type { PublishPlan, PublishPlanKind, PublishSubTask } from '@shared/types'
import type { PublishChannelId } from '@shared/publish-channels'
import { useSessionStore } from '@/features/chat'
import { useAppStore } from '@/stores/app-store'
import { postRunWorkflow } from '@/features/workflows'
import { DB_THEME } from '@/styles/theme-tokens'
import { isBuiltinSeedId } from '@shared/builtin-seeds'
import styles from './PublishWorkbench.module.css'

const { Title, Text, Paragraph } = Typography

type PlanKindFilter = 'all' | PublishPlanKind

interface PlanFormValues {
  title: string
  description: string
  kind: PublishPlanKind
  /** 有序子流程 id 列表 */
  workflowIds: string[]
  /** 计划结束后汇总通知 */
  notifyChannels: PublishChannelId[]
}

function matchPlanQuery(plan: PublishPlan, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    plan.title.toLowerCase().includes(q) ||
    plan.description.toLowerCase().includes(q) ||
    plan.id.toLowerCase().includes(q)
  )
}

/** 发布计划表单：新建/编辑共用，含任务分类 */
function PlanEditModal({
  open,
  mode,
  initialPlan,
  workflows,
  notifyChannelOptions,
  onCancel,
  onSubmit
}: {
  open: boolean
  mode: 'create' | 'edit'
  initialPlan: PublishPlan | null
  workflows: Array<{ id: string; title: string; nodes: unknown[] }>
  notifyChannelOptions: Array<{ value: string; label: string }>
  onCancel: () => void
  onSubmit: (plan: PublishPlan) => Promise<void>
}): React.ReactElement {
  const [form] = Form.useForm<PlanFormValues>()
  const [submitting, setSubmitting] = useState(false)
  /** 打开瞬间先用计划分类，避免子流程字段首帧未挂载导致回显丢失 */
  const kind =
    Form.useWatch('kind', form) ?? initialPlan?.kind ?? ('normal' as PublishPlanKind)

  /**
   * 用 open + initialPlan 回填（与 WorkflowNodeEditModal 一致）。
   * 不用 afterOpenChange：动画时机下条件字段尚未挂载时 setFieldsValue 会丢 workflowIds。
   */
  useEffect(() => {
    if (!open || !initialPlan) {
      if (!open) form.resetFields()
      return
    }
    form.setFieldsValue({
      title: initialPlan.title,
      description: initialPlan.description,
      kind: initialPlan.kind ?? 'normal',
      workflowIds: normalizePublishPlanWorkflowIds(initialPlan),
      notifyChannels: initialPlan.notifyChannels ?? []
    })
  }, [open, initialPlan, form])

  const handleOk = async (): Promise<void> => {
    if (!initialPlan) return
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      const nextKind = values.kind
      await onSubmit({
        ...initialPlan,
        title: values.title.trim(),
        description: values.description.trim(),
        kind: nextKind,
        workflowIds: nextKind === 'workflow' ? values.workflowIds ?? [] : [],
        workflowId: undefined,
        notifyChannels: values.notifyChannels ?? [],
        // 切到流程任务时清空子任务，避免与关联流程混淆
        subTasks: nextKind === 'workflow' ? [] : initialPlan.subTasks
      })
    } catch {
      // 校验未通过
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title={mode === 'create' ? '新建发布任务' : '编辑发布任务'}
      open={open}
      onCancel={onCancel}
      onOk={() => void handleOk()}
      confirmLoading={submitting}
      okText={mode === 'create' ? '创建' : '保存'}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="标题"
          name="title"
          rules={[
            { required: true, whitespace: true, message: '请填写任务标题' },
            { max: 60, message: '标题不超过 60 字' }
          ]}
        >
          <Input placeholder="例如：小红书每日发布" maxLength={60} showCount />
        </Form.Item>
        <Form.Item label="任务分类" name="kind" rules={[{ required: true, message: '请选择分类' }]}>
          <Segmented
            block
            options={[
              { value: 'normal', label: '普通任务' },
              { value: 'workflow', label: '流程任务' }
            ]}
          />
        </Form.Item>
        {/* 子流程字段始终挂载，用 hidden 切换可见，避免条件卸载丢失回显值 */}
        <Form.Item
          label="子流程"
          name="workflowIds"
          hidden={kind !== 'workflow'}
          rules={
            kind === 'workflow'
              ? [
                  {
                    validator: (_, value: string[]) =>
                      Array.isArray(value) && value.length > 0
                        ? Promise.resolve()
                        : Promise.reject(new Error('请至少选择一个子流程'))
                  }
                ]
              : undefined
          }
          extra="可多选；运行时按选择顺序串行执行，子流程之间会暂停确认"
        >
          <Select
            mode="multiple"
            allowClear
            placeholder="选择一个或多个流程（顺序即执行顺序）"
            optionFilterProp="label"
            options={workflows.map((w) => ({
              value: w.id,
              label: `${w.title}（${w.nodes.length} 步）`
            }))}
          />
        </Form.Item>
        {kind !== 'workflow' ? (
          <Form.Item extra="保存后由子任务自动镜像为可执行流程">
            <Text type="secondary">普通任务通过子任务配置渠道与内容说明</Text>
          </Form.Item>
        ) : null}
        <Form.Item
          label="计划结束通知"
          name="notifyChannels"
          extra="全部子任务结束后汇总通知；需在渠道页配置飞书 Webhook 后可选"
        >
          <Select
            mode="multiple"
            allowClear
            placeholder="可选，选择通知渠道"
            options={notifyChannelOptions}
          />
        </Form.Item>
        <Form.Item label="说明" name="description">
          <Input.TextArea rows={3} placeholder="可选，补充用途说明" maxLength={200} showCount />
        </Form.Item>
      </Form>
    </Modal>
  )
}

/** 发布工作台：普通任务 / 流程任务分类 + 卡片详情 */
export function PublishWorkbench(): React.ReactElement {
  const plans = usePublishStore((s) => s.plans)
  const savePlan = usePublishStore((s) => s.savePlan)
  const removePlan = usePublishStore((s) => s.removePlan)
  const addBuiltinPlans = usePublishStore((s) => s.addBuiltinPlans)

  const workflows = useWorkflowsStore((s) => s.workflows)
  const hydrateWorkflows = useWorkflowsStore((s) => s.hydrate)

  const beginExternalRun = useSessionStore((s) => s.beginExternalRun)
  const hydrateSessions = useSessionStore((s) => s.hydrate)
  const setView = useAppStore((s) => s.setView)
  const channels = useChannelsStore((s) => s.channels)
  const enabledChannels = useMemo(
    () => queryEnabledPublishChannelsFromStore(channels),
    [channels]
  )
  const enabledNotifyChannels = useMemo(
    () => queryEnabledNotifyChannelsFromStore(channels),
    [channels]
  )
  const notifyChannelOptions = useMemo(
    () => enabledNotifyChannels.map((c) => ({ value: c.id, label: c.label })),
    [enabledNotifyChannels]
  )

  const [kindFilter, setKindFilter] = useState<PlanKindFilter>('all')
  const [search, setSearch] = useState('')
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailPlanId, setDetailPlanId] = useState<string | null>(null)

  const [planModal, setPlanModal] = useState<{
    mode: 'create' | 'edit'
    plan: PublishPlan
  } | null>(null)
  const [subModal, setSubModal] = useState<{
    mode: 'create' | 'edit'
    draft: PublishSubTask
  } | null>(null)

  useEffect(() => {
    void hydrateWorkflows()
  }, [hydrateWorkflows])

  const filtered = useMemo(() => {
    let list = plans
    if (kindFilter !== 'all') {
      list = list.filter((p) => (p.kind ?? 'normal') === kindFilter)
    }
    return list.filter((p) => matchPlanQuery(p, search))
  }, [plans, kindFilter, search])

  const detailPlan = useMemo(() => {
    const plan = plans.find((p) => p.id === detailPlanId) ?? null
    return plan ? normalizePublishPlan(plan) : null
  }, [plans, detailPlanId])

  const linkedWorkflows = useMemo(() => {
    if (!detailPlan || detailPlan.kind !== 'workflow') return []
    return normalizePublishPlanWorkflowIds(detailPlan).map((id, index) => {
      const wf = workflows.find((w) => w.id === id)
      return {
        id,
        index,
        title: wf?.title ?? `未知流程（${id.slice(0, 8)}…）`,
        description: wf?.description ?? '',
        stepCount: wf?.nodes.length ?? 0,
        templateKind: wf?.templateKind,
        missing: !wf
      }
    })
  }, [detailPlan, workflows])

  const openDetail = (id: string): void => {
    setDetailPlanId(id)
    setDetailOpen(true)
  }

  const removeSubTask = async (subId: string): Promise<void> => {
    if (!detailPlan) return
    const next = {
      ...detailPlan,
      subTasks: detailPlan.subTasks.filter((s) => s.id !== subId),
      updatedAt: Date.now()
    }
    await savePlan(next)
    if (subModal?.draft.id === subId) setSubModal(null)
    message.success('已删除子任务')
  }

  /** 从流程任务中移除某一个子流程引用 */
  const removeLinkedWorkflow = async (workflowId: string): Promise<void> => {
    if (!detailPlan || detailPlan.kind !== 'workflow') return
    const nextIds = normalizePublishPlanWorkflowIds(detailPlan).filter((id) => id !== workflowId)
    await savePlan({
      ...detailPlan,
      workflowIds: nextIds,
      updatedAt: Date.now()
    })
    message.success('已移除子流程')
  }

  const runPlan = async (plan: PublishPlan): Promise<void> => {
    const kind = plan.kind ?? 'normal'
    try {
      await savePlan(plan)
      if (kind === 'workflow') {
        if (!normalizePublishPlanWorkflowIds(plan).length) {
          message.warning('请先关联至少一个子流程')
          return
        }
      } else if (!plan.subTasks.length) {
        message.warning('请先添加子任务')
        return
      }
      // 普通 / 流程任务均以计划 id 运行（保存时已同步组合或镜像工作流）
      const { sessionId } = await postRunWorkflow(plan.id)
      await hydrateSessions()
      beginExternalRun(sessionId)
      setView('chat')
      message.success(
        kind === 'workflow'
          ? '已按子流程顺序在主聊天窗口执行'
          : '已按子任务编排在主聊天窗口执行'
      )
    } catch (err) {
      message.error(err instanceof Error ? err.message : '启动发布失败')
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <div className={styles.headerIcon}>
            <SendOutlined />
          </div>
          <div>
            <div className={styles.titleRow}>
              <Title level={3} className={styles.headerTitle}>
                发布
              </Title>
              <span className={styles.countBadge}>{plans.length}</span>
            </div>
            <Text type="secondary" className={styles.desc}>
              普通任务用子任务编排；流程任务可挂多个子流程并按序执行
            </Text>
          </div>
        </div>
        <Space wrap>
          <Button
            onClick={async () => {
              await addBuiltinPlans()
              message.success('已导入内置发布任务')
            }}
          >
            导入示例
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setPlanModal({ mode: 'create', plan: createEmptyPlan('normal') })
            }}
          >
            新建任务
          </Button>
        </Space>
      </header>

      <div className={styles.toolbar}>
        <Segmented
          value={kindFilter}
          onChange={(v) => setKindFilter(v as PlanKindFilter)}
          options={[
            { label: '全部', value: 'all' },
            { label: '普通任务', value: 'normal' },
            { label: '流程任务', value: 'workflow' }
          ]}
        />
        <div className={styles.toolbarRight}>
          <span className={styles.resultCount}>{filtered.length} 项</span>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索任务..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      <div className={styles.body}>
        {filtered.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={plans.length === 0 ? '暂无发布任务' : '暂无匹配的任务'}
            className={styles.empty}
          >
            {plans.length === 0 ? (
              <Space>
                <Button
                  onClick={async () => {
                    await addBuiltinPlans()
                    message.success('已导入内置发布任务')
                  }}
                >
                  导入示例
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setPlanModal({ mode: 'create', plan: createEmptyPlan('normal') })}
                >
                  新建任务
                </Button>
              </Space>
            ) : null}
          </Empty>
        ) : (
          <div className={styles.grid}>
            {filtered.map((plan, index) => {
              const kind = plan.kind ?? 'normal'
              return (
                <Card
                  key={plan.id}
                  variant="borderless"
                  hoverable
                  className={styles.card}
                  style={{ '--card-index': index } as CSSProperties}
                  onClick={() => openDetail(plan.id)}
                >
                  <div className={styles.cardHead}>
                    <div className={styles.cardTitleRow}>
                      <span className={styles.cardTitle}>{plan.title}</span>
                      {isBuiltinSeedId(plan.id) ? (
                        <Tag color={DB_THEME.primary}>内置</Tag>
                      ) : null}
                      {kind === 'workflow' ? (
                        <Tag color={DB_THEME.primary}>流程</Tag>
                      ) : (
                        <Tag>普通</Tag>
                      )}
                    </div>
                    <p className={styles.cardDesc}>
                      {plan.description?.trim() ||
                        (kind === 'workflow'
                          ? '流程任务，点击查看关联流程并运行。'
                          : '普通任务，点击管理子任务与渠道。')}
                    </p>
                  </div>
                  <div className={styles.cardFooter}>
                    <span className={styles.cardAuthor}>
                      @{queryPublishPlanKindLabel(kind)}
                    </span>
                    <span className={styles.cardUsage}>
                      {kind === 'workflow'
                        ? `${normalizePublishPlanWorkflowIds(plan).length} 个子流程`
                        : `${plan.subTasks.length} 子任务`}
                    </span>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <Modal
        title={detailPlan?.title ?? '任务详情'}
        open={detailOpen}
        onCancel={() => {
          setDetailOpen(false)
          setSubModal(null)
        }}
        footer={null}
        width={800}
        destroyOnHidden
        className={styles.detailModal}
      >
        {!detailPlan ? (
          <Empty description="未找到任务详情" />
        ) : (
          <div className={styles.detailBody}>
            <div className={styles.detailHeader}>
              <div>
                <code className={styles.detailId}>{detailPlan.id}</code>
                <div className={styles.detailTags}>
                  {detailPlan.kind === 'workflow' ? (
                    <Tag color={DB_THEME.primary}>流程任务</Tag>
                  ) : (
                    <Tag>普通任务</Tag>
                  )}
                  {detailPlan.kind === 'workflow' ? (
                    <Tag color="processing">{linkedWorkflows.length} 个子流程</Tag>
                  ) : (
                    <Tag color="processing">{detailPlan.subTasks.length} 个子任务</Tag>
                  )}
                  {(detailPlan.notifyChannels ?? []).map((ch) => (
                    <Tag key={`plan-notify-${ch}`} color="cyan">
                      通知·{queryPublishChannelLabel(ch)}
                    </Tag>
                  ))}
                </div>
              </div>
              <Space wrap>
                <Button
                  icon={<EditOutlined />}
                  onClick={() =>
                    setPlanModal({ mode: 'edit', plan: normalizePublishPlan(detailPlan) })
                  }
                >
                  编辑
                </Button>
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={() => void runPlan(detailPlan)}
                >
                  运行
                </Button>
                <Popconfirm
                  title="确定删除该发布任务？"
                  onConfirm={async () => {
                    await removePlan(detailPlan.id)
                    setDetailOpen(false)
                    setDetailPlanId(null)
                    message.success('已删除')
                  }}
                >
                  <Button danger icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>
              </Space>
            </div>

            {detailPlan.description?.trim() ? (
              <p className={styles.description}>{detailPlan.description}</p>
            ) : null}

            {detailPlan.kind === 'workflow' ? (
              <div>
                <h3 className={styles.sectionLabel}>子流程（按序执行）</h3>
                {linkedWorkflows.length === 0 ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="尚未关联子流程，请点击编辑多选"
                  />
                ) : (
                  <div className={styles.subList}>
                    {linkedWorkflows.map((item) => (
                      <div key={item.id} className={styles.subCard}>
                        <div className={styles.subIndex}>{item.index + 1}</div>
                        <div className={styles.subBody}>
                          <div className={styles.subTitleRow}>
                            <span className={styles.subTitle}>{item.title}</span>
                            <Popconfirm
                              title="从本任务移除此子流程？"
                              description="不会删除流程本身，仅取消关联"
                              onConfirm={() => void removeLinkedWorkflow(item.id)}
                            >
                              <Button type="link" size="small" danger>
                                移除
                              </Button>
                            </Popconfirm>
                          </div>
                          <Space size={6} wrap>
                            {item.missing ? <Tag color="error">流程不存在</Tag> : null}
                            <Tag>{item.stepCount} 步</Tag>
                            {item.templateKind ? (
                              <Tag>
                                {item.templateKind === 'publish' ? '发布模板' : '通用'}
                              </Tag>
                            ) : null}
                          </Space>
                          <Paragraph type="secondary" className={styles.subPrompt}>
                            {item.description || '无流程说明'}
                          </Paragraph>
                        </div>
                      </div>
                    ))}
                    <Button
                      block
                      icon={<EditOutlined />}
                      onClick={() =>
                        setPlanModal({
                          mode: 'edit',
                          plan: normalizePublishPlan(detailPlan)
                        })
                      }
                    >
                      编辑子流程列表
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h3 className={styles.sectionLabel}>子任务</h3>
                <div className={styles.subList}>
                  {detailPlan.subTasks.map((sub, index) => (
                    <div key={sub.id} className={styles.subCard}>
                      <div className={styles.subIndex}>{index + 1}</div>
                      <div className={styles.subBody}>
                        <div className={styles.subTitleRow}>
                          <span className={styles.subTitle}>{sub.title}</span>
                          <Space size={0}>
                            <Button
                              type="link"
                              size="small"
                              onClick={() =>
                                setSubModal({
                                  mode: 'edit',
                                  draft: normalizePublishSubTask(sub)
                                })
                              }
                            >
                              编辑
                            </Button>
                            <Popconfirm
                              title="确定删除该子任务？"
                              onConfirm={() => void removeSubTask(sub.id)}
                            >
                              <Button type="link" size="small" danger>
                                删除
                              </Button>
                            </Popconfirm>
                          </Space>
                        </div>
                        <Space size={6} wrap>
                          {sub.channels.map((ch) => (
                            <Tag key={ch}>{queryPublishChannelLabel(ch)}</Tag>
                          ))}
                          {(sub.notifyChannels ?? []).map((ch) => (
                            <Tag key={`notify-${ch}`} color="cyan">
                              通知·{queryPublishChannelLabel(ch)}
                            </Tag>
                          ))}
                          {sub.topic ? <Tag>{sub.topic}</Tag> : null}
                          <Tag color={sub.autoPublish !== false ? 'processing' : 'default'}>
                            {sub.autoPublish !== false ? '自动发布' : '停在待发布'}
                          </Tag>
                        </Space>
                        <Paragraph type="secondary" className={styles.subPrompt}>
                          {sub.contentPrompt || '未填写内容说明'}
                        </Paragraph>
                      </div>
                    </div>
                  ))}
                  <Button
                    block
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setSubModal({ mode: 'create', draft: createEmptySubTask() })
                    }}
                  >
                    添加子任务
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <PlanEditModal
        open={Boolean(planModal)}
        mode={planModal?.mode ?? 'create'}
        initialPlan={planModal?.plan ?? null}
        workflows={workflows}
        notifyChannelOptions={notifyChannelOptions}
        onCancel={() => setPlanModal(null)}
        onSubmit={async (plan) => {
          const isCreate = planModal?.mode === 'create'
          await savePlan(plan)
          setPlanModal(null)
          if (isCreate) {
            openDetail(plan.id)
          }
          message.success(isCreate ? '已创建发布任务' : '已保存')
        }}
      />

      <Modal
        title={subModal?.mode === 'create' ? '新建子任务' : '编辑子任务'}
        open={Boolean(subModal) && Boolean(detailPlan) && detailPlan?.kind !== 'workflow'}
        onCancel={() => setSubModal(null)}
        onOk={async () => {
          if (!detailPlan || !subModal) return
          const { mode, draft } = subModal
          if (!draft.channels.length) {
            message.warning('请至少选择一个发布渠道')
            return
          }
          const subTasks =
            mode === 'create'
              ? [...detailPlan.subTasks, draft]
              : detailPlan.subTasks.map((s) => (s.id === draft.id ? draft : s))
          await savePlan({
            ...detailPlan,
            subTasks,
            updatedAt: Date.now()
          })
          setSubModal(null)
          message.success(mode === 'create' ? '已添加子任务' : '已保存')
        }}
        okText={subModal?.mode === 'create' ? '添加' : '保存'}
        destroyOnHidden
        zIndex={1100}
      >
        {subModal ? (
          <Form layout="vertical">
            <Form.Item label="标题">
              <Input
                value={subModal.draft.title}
                onChange={(e) =>
                  setSubModal({ ...subModal, draft: { ...subModal.draft, title: e.target.value } })
                }
              />
            </Form.Item>
            <Form.Item label="发布渠道" required>
              <Select
                mode="multiple"
                value={subModal.draft.channels}
                onChange={(chs: PublishChannelId[]) =>
                  setSubModal({ ...subModal, draft: { ...subModal.draft, channels: chs } })
                }
                placeholder="选择发布渠道，可多选"
                options={enabledChannels.map((c) => ({
                  value: c.id,
                  label: c.label
                }))}
              />
            </Form.Item>
            <Form.Item
              label="本任务结束通知"
              extra="可选；在本子任务发布完成后额外通知，与计划结束通知可叠加"
            >
              <Select
                mode="multiple"
                allowClear
                value={subModal.draft.notifyChannels ?? []}
                onChange={(chs: PublishChannelId[]) =>
                  setSubModal({
                    ...subModal,
                    draft: { ...subModal.draft, notifyChannels: chs }
                  })
                }
                placeholder="可选，选择通知渠道"
                options={notifyChannelOptions}
              />
            </Form.Item>
            <Form.Item label="主题">
              <Input
                value={subModal.draft.topic}
                onChange={(e) =>
                  setSubModal({ ...subModal, draft: { ...subModal.draft, topic: e.target.value } })
                }
              />
            </Form.Item>
            <Form.Item label="内容说明">
              <Input.TextArea
                rows={4}
                value={subModal.draft.contentPrompt}
                onChange={(e) =>
                  setSubModal({
                    ...subModal,
                    draft: { ...subModal.draft, contentPrompt: e.target.value }
                  })
                }
              />
            </Form.Item>
            <Form.Item
              label="自动发布"
              extra="开启后填好内容会自动点发布；关闭则停在待发布。未登录时仍会暂停等人扫码；流程画布上的「等待确认」节点仍会暂停。"
            >
              <Switch
                checked={subModal.draft.autoPublish !== false}
                onChange={(checked) =>
                  setSubModal({
                    ...subModal,
                    draft: { ...subModal.draft, autoPublish: checked }
                  })
                }
              />
            </Form.Item>
          </Form>
        ) : null}
      </Modal>
    </div>
  )
}
