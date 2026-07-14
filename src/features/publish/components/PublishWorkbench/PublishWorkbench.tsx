import { usePublishStore } from '../../hooks/usePublishStore'
import {
  buildPublishPlanPrompt,
  createEmptyPlan,
  createEmptySubTask,
  normalizePublishSubTask,
  normalizePublishPlan,
  queryPublishChannelLabel
} from '../../types'
import { useChannelsStore, queryEnabledChannelsFromStore } from '@/features/channels'
import type { PublishPlan, PublishSubTask } from '@shared/types'
import type { PublishChannelId } from '@shared/publish-channels'
import { useSessionStore } from '@/features/chat'
import { useAppStore } from '@/stores/app-store'
import styles from './PublishWorkbench.module.css'

const { Title, Text, Paragraph } = Typography

interface PlanFormValues {
  title: string
  description: string
}

/** 发布计划表单：新建/编辑共用，确定前必须通过必填校验 */
function PlanEditModal({
  open,
  mode,
  initialPlan,
  onCancel,
  onSubmit
}: {
  open: boolean
  mode: 'create' | 'edit'
  initialPlan: PublishPlan | null
  onCancel: () => void
  onSubmit: (plan: PublishPlan) => Promise<void>
}): React.ReactElement {
  const [form] = Form.useForm<PlanFormValues>()
  const [submitting, setSubmitting] = useState(false)

  const handleOk = async (): Promise<void> => {
    if (!initialPlan) return
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      await onSubmit({
        ...initialPlan,
        title: values.title.trim(),
        description: values.description.trim()
      })
    } catch {
      // 校验未通过，保持弹窗打开
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title={mode === 'create' ? '新建发布计划' : '编辑发布计划'}
      open={open}
      onCancel={onCancel}
      onOk={() => void handleOk()}
      confirmLoading={submitting}
      okText={mode === 'create' ? '创建' : '保存'}
      destroyOnHidden
      afterOpenChange={(visible) => {
        if (visible && initialPlan) {
          form.setFieldsValue({
            title: initialPlan.title,
            description: initialPlan.description
          })
        } else {
          form.resetFields()
        }
      }}
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item
          label="标题"
          name="title"
          rules={[
            { required: true, whitespace: true, message: '请填写计划标题' },
            { max: 60, message: '标题不超过 60 字' }
          ]}
        >
          <Input placeholder="例如：小红书每日发布" maxLength={60} showCount />
        </Form.Item>
        <Form.Item label="说明" name="description">
          <Input.TextArea rows={3} placeholder="可选，补充计划用途说明" maxLength={200} showCount />
        </Form.Item>
      </Form>
    </Modal>
  )
}

/** 发布工作台：计划编辑；执行进度在主聊天窗口查看 */
export function PublishWorkbench(): React.ReactElement {
  const plans = usePublishStore((s) => s.plans)
  const activePlanId = usePublishStore((s) => s.activePlanId)
  const setActive = usePublishStore((s) => s.setActive)
  const savePlan = usePublishStore((s) => s.savePlan)
  const removePlan = usePublishStore((s) => s.removePlan)
  const addDemoPlan = usePublishStore((s) => s.addDemoPlan)

  const createSession = useSessionStore((s) => s.createSession)
  const sendMessage = useSessionStore((s) => s.sendMessage)
  const setView = useAppStore((s) => s.setView)
  const channels = useChannelsStore((s) => s.channels)
  const enabledChannels = useMemo(
    () => queryEnabledChannelsFromStore(channels),
    [channels]
  )

  const [planModal, setPlanModal] = useState<{
    mode: 'create' | 'edit'
    plan: PublishPlan
  } | null>(null)
  /** 子任务弹窗：create 为草稿，确认后才写入 plan.subTasks */
  const [subModal, setSubModal] = useState<{
    mode: 'create' | 'edit'
    draft: PublishSubTask
  } | null>(null)

  const active = useMemo(() => {
    const plan = plans.find((p) => p.id === activePlanId) ?? null
    return plan ? normalizePublishPlan(plan) : null
  }, [plans, activePlanId])

  /** 从当前计划中移除指定子任务 */
  const removeSubTask = async (subId: string): Promise<void> => {
    if (!active) return
    const next = {
      ...active,
      subTasks: active.subTasks.filter((s) => s.id !== subId),
      updatedAt: Date.now()
    }
    await savePlan(next)
    // 若正在编辑被删子任务，关闭弹窗
    if (subModal?.draft.id === subId) setSubModal(null)
    message.success('已删除子任务')
  }

  const runPlan = async (plan: PublishPlan): Promise<void> => {
    if (!plan.subTasks.length) {
      message.warning('请先添加子任务')
      return
    }
    await createSession('publish')
    setView('chat')
    // 串行：把所有子任务合成一条指令，由 Agent 按清单执行（渠道由 buildPublishPlanPrompt 路由）
    const prompt = buildPublishPlanPrompt(plan)
    await sendMessage(prompt)
    message.success('已在主聊天窗口开始执行')
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <div className={styles.headerIcon}>
            <SendOutlined />
          </div>
          <div className={styles.headerContent}>
            <Title level={3} className={styles.headerTitle}>
              发布工作台
            </Title>
            <div className={styles.headerDesc}>多账号 / 多渠道 / 串行执行</div>
            <Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 0, fontSize: 12 }}>
              发布计划只负责编辑，执行进度在主聊天窗口查看
            </Paragraph>
          </div>
        </div>
        <Space>
          <Button
            onClick={async () => {
              await addDemoPlan()
              message.success('已添加示例计划')
            }}
          >
            导入示例
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              // 仅打开弹窗草稿，校验通过后再落盘
              setPlanModal({ mode: 'create', plan: createEmptyPlan() })
            }}
          >
            新建发布计划
          </Button>
        </Space>
      </header>

      <div className={styles.body}>
        <aside className={styles.sidebar}>
          {plans.length === 0 ? (
            <Empty description="暂无计划" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            plans.map((p) => (
              <button
                key={p.id}
                type="button"
                className={styles.planItem}
                data-active={p.id === activePlanId}
                onClick={() => setActive(p.id)}
              >
                <div className={styles.planTitle}>{p.title}</div>
                <div className={styles.planMeta}>{p.subTasks.length} 个子任务</div>
              </button>
            ))
          )}
        </aside>

        <main className={styles.main}>
          {!active ? (
            <Empty description="选择或新建一个发布计划" />
          ) : (
            <>
              <div className={styles.planHeader}>
                <div>
                  <Title level={5} style={{ margin: 0 }}>
                    {active.title}
                  </Title>
                  <Text type="secondary">
                    {active.description || '未填写说明'} · {active.subTasks.length} 个子任务
                  </Text>
                </div>
                <Space>
                  <Button type="link" size='small' onClick={() => setPlanModal({ mode: 'edit', plan: { ...active } })}>
                    编辑
                  </Button>
                  <Button
                    type="link"
                    size='small'
                    // icon={<PlayCircleOutlined />}
                    onClick={() => void runPlan(active)}
                  >
                    运行
                  </Button>
                  <Button
                    danger
                    type="link"
                    size='small'
                    onClick={async () => {
                      await removePlan(active.id)
                      message.success('已删除')
                    }}
                  >
                    删除
                  </Button>
                </Space>
              </div>

              <div className={styles.subList}>
                {active.subTasks.map((sub, index) => (
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
                              setSubModal({ mode: 'edit', draft: normalizePublishSubTask(sub) })
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
                        {sub.topic ? <Tag>{sub.topic}</Tag> : null}
                        {sub.autoPublish ? <Tag>自动发布</Tag> : <Tag>待确认发布</Tag>}
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
                    // 仅打开草稿弹窗，确认后再落盘
                    setSubModal({ mode: 'create', draft: createEmptySubTask() })
                  }}
                >
                  添加子任务
                </Button>
              </div>
            </>
          )}
        </main>
      </div>

      <PlanEditModal
        open={Boolean(planModal)}
        mode={planModal?.mode ?? 'create'}
        initialPlan={planModal?.plan ?? null}
        onCancel={() => setPlanModal(null)}
        onSubmit={async (plan) => {
          const isCreate = planModal?.mode === 'create'
          await savePlan(plan)
          setPlanModal(null)
          message.success(isCreate ? '已创建发布计划' : '已保存')
        }}
      />

      <Modal
        title={subModal?.mode === 'create' ? '新建子任务' : '编辑子任务'}
        open={Boolean(subModal) && Boolean(active)}
        onCancel={() => setSubModal(null)}
        onOk={async () => {
          if (!active || !subModal) return
          const { mode, draft } = subModal
          if (!draft.channels.length) {
            message.warning('请至少选择一个发布渠道')
            return
          }
          const subTasks =
            mode === 'create'
              ? [...active.subTasks, draft]
              : active.subTasks.map((s) => (s.id === draft.id ? draft : s))
          const next = {
            ...active,
            subTasks,
            updatedAt: Date.now()
          }
          await savePlan(next)
          setSubModal(null)
          message.success(mode === 'create' ? '已添加子任务' : '已保存')
        }}
        okText={subModal?.mode === 'create' ? '添加' : '保存'}
        destroyOnHidden
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
            <Form.Item label="渠道" required>
              <Select
                mode="multiple"
                value={subModal.draft.channels}
                onChange={(channels: PublishChannelId[]) =>
                  setSubModal({ ...subModal, draft: { ...subModal.draft, channels } })
                }
                placeholder="选择发布渠道，可多选"
                options={enabledChannels.map((c) => ({
                  value: c.id,
                  label: c.label
                }))}
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
            <Form.Item label="自动发布">
              <Switch
                checked={subModal.draft.autoPublish}
                onChange={(v) =>
                  setSubModal({ ...subModal, draft: { ...subModal.draft, autoPublish: v } })
                }
              />
            </Form.Item>
          </Form>
        ) : null}
      </Modal>
    </div>
  )
}
