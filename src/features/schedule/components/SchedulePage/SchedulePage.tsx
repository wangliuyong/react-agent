import type { CSSProperties } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import type { ScheduledTask, ScheduleActionType, ScheduleRepeat, PublishChannelId } from '@shared/types'
import {
  formatNextRunAt,
  formatScheduleSummary,
  formatScheduledTaskRunCount,
  normalizeScheduleTimesOfDay,
  queryRunInBackground,
  queryScheduleTimesOfDay,
  SCHEDULE_REPEAT_OPTIONS,
  WEEKDAY_OPTIONS
} from '@shared/schedule-utils'
import { useScheduleStore } from '../../hooks/useScheduleStore'
import { createEmptyScheduledTask } from '../../types'
import { usePublishStore } from '@/features/publish'
import { useWorkflowsStore } from '@/features/workflows'
import { useSessionStore } from '@/features/chat'
import { useSettingsStore } from '@/features/settings'
import { useChannelsStore, queryEnabledNotifyChannelsFromStore } from '@/features/channels'
import { useAppStore } from '@/stores/app-store'
import { isBuiltinSeedId } from '@shared/builtin-seeds'
import { DB_THEME } from '@/styles/theme-tokens'
import styles from './SchedulePage.module.css'
import {
  FeaturePageShell,
  FeaturePageHeader,
  FeaturePageToolbar,
  FeatureScrollBody,
  shellStyles
} from '@/components/page-shell'

interface TaskFormValues {
  title: string
  description: string
  repeat: ScheduleRepeat
  runAt?: Dayjs
  weekday?: number
  /** daily / weekly 可配置多个执行时刻 */
  timesOfDay?: Dayjs[]
  actionType: ScheduleActionType
  publishPlanId?: string
  workflowId?: string
  customPrompt?: string
  /** 自定义指令任务成功后自动推送的通知渠道 */
  notifyChannels?: PublishChannelId[]
  /** 后台执行：不跳转聊天、卡片展示 loading */
  runInBackground: boolean
  enabled: boolean
}

/** 顶部统计：运行中 / 执行中 / 已暂停 / 已完成 */
interface ScheduleStats {
  running: number
  executing: number
  paused: number
  completed: number
}

/** 卡片展示用任务状态 */
type TaskDisplayStatus = 'running' | 'executing' | 'paused' | 'completed'

type ScheduleFilter = 'all' | TaskDisplayStatus

/**
 * 解析 HH:mm 为 dayjs。
 * 为什么：未启用 customParseFormat 时 dayjs('09:00','HH:mm') 会得到 Invalid Date，编辑回显空白。
 */
function parseTimeOfDay(hhmm: string | undefined): Dayjs {
  const raw = (hhmm && hhmm.trim()) || '09:00'
  const [hRaw, mRaw] = raw.split(':')
  const hour = Number.parseInt(hRaw ?? '9', 10)
  const minute = Number.parseInt(mRaw ?? '0', 10)
  return dayjs()
    .hour(Number.isFinite(hour) ? hour : 9)
    .minute(Number.isFinite(minute) ? minute : 0)
    .second(0)
    .millisecond(0)
}

/**
 * 实体 → 表单初始值。
 * 为什么：destroyOnHidden 下须在 Form 挂载前备好 initialValues，不能依赖 afterOpenChange + setFieldsValue
 *（preserve={false} 时未挂载的条件字段会被丢弃，导致编辑回显失败）。
 */
function taskToFormValues(task: ScheduledTask): TaskFormValues {
  return {
    title: task.title,
    description: task.description,
    repeat: task.repeat,
    runAt: task.runAt ? dayjs(task.runAt) : undefined,
    weekday: task.weekday ?? 1,
    timesOfDay: queryScheduleTimesOfDay(task).map(parseTimeOfDay),
    actionType: task.actionType,
    publishPlanId: task.publishPlanId,
    workflowId: task.workflowId,
    customPrompt: task.customPrompt,
    notifyChannels: task.notifyChannels ?? [],
    runInBackground: queryRunInBackground(task),
    enabled: task.enabled
  }
}

/** 将表单值合并回定时任务实体 */
function mergeTaskFormValues(base: ScheduledTask, values: TaskFormValues): ScheduledTask {
  return {
    ...base,
    title: values.title.trim(),
    description: values.description?.trim() ?? '',
    repeat: values.repeat,
    runAt: values.repeat === 'once' ? values.runAt?.valueOf() : base.runAt,
    weekday: values.repeat === 'weekly' ? values.weekday : base.weekday,
    ...(values.repeat !== 'once'
      ? (() => {
        const timesOfDay = normalizeScheduleTimesOfDay(
          (values.timesOfDay ?? []).map((item) => item?.format('HH:mm') ?? '09:00')
        )
        return { timesOfDay, timeOfDay: timesOfDay[0] }
      })()
      : {}),
    actionType: values.actionType,
    publishPlanId: values.actionType === 'publish_plan' ? values.publishPlanId : undefined,
    workflowId: values.actionType === 'workflow' ? values.workflowId : undefined,
    customPrompt: values.actionType === 'custom_prompt' ? values.customPrompt?.trim() : undefined,
    notifyChannels: values.notifyChannels ?? [],
    runInBackground: values.runInBackground,
    enabled: values.enabled
  }
}

/** 汇总各状态任务数量 */
function computeScheduleStats(tasks: ScheduledTask[]): ScheduleStats {
  let running = 0
  let executing = 0
  let paused = 0
  let completed = 0

  for (const task of tasks) {
    const displayStatus = resolveTaskDisplayStatus(task)
    if (displayStatus === 'running') running += 1
    else if (displayStatus === 'executing') executing += 1
    else if (displayStatus === 'paused') paused += 1
    else completed += 1
  }

  return { running, executing, paused, completed }
}

/** 解析卡片状态标签 */
function resolveTaskDisplayStatus(task: ScheduledTask): TaskDisplayStatus {
  if (task.lastRunStatus === 'running') return 'executing'
  if (task.repeat === 'once' && !task.enabled && task.lastRunAt != null) return 'completed'
  if (!task.enabled) return 'paused'
  return 'running'
}

/** 状态标签文案 */
function resolveStatusLabel(status: TaskDisplayStatus): string {
  const map: Record<TaskDisplayStatus, string> = {
    running: '运行中',
    executing: '执行中',
    paused: '已暂停',
    completed: '已完成'
  }
  return map[status]
}

/** 触发方式展示：重复类型 + 调度摘要 */
function formatTriggerMethod(task: ScheduledTask): { main: string; sub: string } {
  const repeatLabel =
    SCHEDULE_REPEAT_OPTIONS.find((o) => o.value === task.repeat)?.label ?? '未配置'
  return {
    main: repeatLabel,
    sub: formatScheduleSummary(task)
  }
}

/** 下次执行绝对时间 */
function formatNextRunAbsolute(nextRunAt?: number): string {
  if (nextRunAt == null) return '未安排'
  return new Date(nextRunAt).toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/** 定时任务表单：新建/编辑共用，确定前必须通过必填校验 */
function TaskEditModal({
  open,
  mode,
  initialTask,
  plans,
  workflows,
  notifyChannelOptions,
  onCancel,
  onSubmit
}: {
  open: boolean
  mode: 'create' | 'edit'
  initialTask: ScheduledTask | null
  plans: Array<{ id: string; title: string; subTasks: unknown[] }>
  workflows: Array<{ id: string; title: string; nodes: unknown[] }>
  notifyChannelOptions: Array<{ value: string; label: string }>
  onCancel: () => void
  onSubmit: (task: ScheduledTask) => Promise<void>
}): React.ReactElement {
  const [form] = Form.useForm<TaskFormValues>()
  const [submitting, setSubmitting] = useState(false)
  // 挂载首帧 useWatch 可能尚未同步，回退到 initialTask 以保证条件字段立刻渲染
  const repeat = Form.useWatch('repeat', form) ?? initialTask?.repeat
  const actionType = Form.useWatch('actionType', form) ?? initialTask?.actionType

  const handleOk = async (): Promise<void> => {
    if (!initialTask) return
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      await onSubmit(mergeTaskFormValues(initialTask, values))
    } catch {
      // 校验未通过，保持弹窗打开
    } finally {
      setSubmitting(false)
    }
  }

  const formInitialValues = initialTask ? taskToFormValues(initialTask) : undefined
  // 打开时强制重挂载，确保 initialValues 生效（对齐渠道/技能编辑表单）
  const formKey = open && initialTask ? `${mode}-${initialTask.id}` : 'closed'

  return (
    <Modal
      title={mode === 'create' ? '新建定时任务' : '编辑定时任务'}
      open={open}
      onCancel={onCancel}
      onOk={() => void handleOk()}
      confirmLoading={submitting}
      okText={mode === 'create' ? '创建' : '保存'}
      width={560}
      destroyOnHidden
    >
      <Form
        key={formKey}
        form={form}
        layout="vertical"
        className={styles.form}
        preserve={false}
        initialValues={formInitialValues}
      >
        <Form.Item
          label="标题"
          name="title"
          rules={[
            { required: true, whitespace: true, message: '请填写任务标题' },
            { max: 60, message: '标题不超过 60 字' }
          ]}
        >
          <Input placeholder="例如：每日小红书发布" maxLength={60} showCount />
        </Form.Item>
        <Form.Item label="说明" name="description">
          <Input.TextArea rows={2} placeholder="可选" maxLength={200} showCount />
        </Form.Item>
        <Form.Item label="重复规则" name="repeat" rules={[{ required: true, message: '请选择重复规则' }]}>
          <Segmented
            block
            options={SCHEDULE_REPEAT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
        </Form.Item>
        {repeat === 'once' ? (
          <Form.Item
            label="执行时间"
            name="runAt"
            rules={[{ required: true, message: '请选择执行时间' }]}
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        ) : (
          <>
            {repeat === 'weekly' ? (
              <Form.Item
                label="星期"
                name="weekday"
                rules={[{ required: true, message: '请选择星期' }]}
              >
                <Select options={WEEKDAY_OPTIONS} />
              </Form.Item>
            ) : null}
            <Form.List
              name="timesOfDay"
              rules={[
                {
                  validator: async (_, value: Dayjs[] | undefined) => {
                    if (!value || value.length === 0) {
                      return Promise.reject(new Error('请至少添加一个时刻'))
                    }
                  }
                }
              ]}
            >
              {(fields, { add, remove }) => (
                <div className={styles.timesOfDayList}>
                  <div className={styles.timesOfDayListWrap}>

                    {fields.map((field) => (
                      <Space key={field.key} align="baseline" className={styles.timesOfDayRow}>
                        <Form.Item
                          {...field}
                          label={fields.length > 1 ? `时刻 ${field.name + 1}` : '时刻'}
                          rules={[{ required: true, message: '请选择时刻' }]}
                          className={styles.timesOfDayItem}
                        >
                          <TimePicker format="HH:mm" style={{ width: '100%' }} />
                        </Form.Item>
                        {fields.length > 1 ? (
                          <Button
                            type="text"
                            danger
                            icon={<MinusCircleOutlined />}
                            aria-label="删除时刻"
                            onClick={() => remove(field.name)}
                          />
                        ) : null}
                      </Space>
                    ))}
                  </div>

                  <Button
                    type="dashed"
                    block
                    icon={<PlusOutlined />}
                    onClick={() => add(parseTimeOfDay('09:00'))}
                  >
                    添加时刻
                  </Button>
                </div>
              )}
            </Form.List>
          </>
        )}
        <Form.Item label="执行动作" name="actionType" rules={[{ required: true, message: '请选择执行动作' }]}>
          <Select
            options={[
              { value: 'publish_plan', label: '发布计划（编排引擎）' },
              { value: 'workflow', label: '工作流' },
              { value: 'custom_prompt', label: '自定义指令' }
            ]}
          />
        </Form.Item>
        {actionType === 'publish_plan' ? (
          <Form.Item
            label="关联发布计划"
            name="publishPlanId"
            rules={[{ required: true, message: '请选择关联的发布计划' }]}
          >
            <Select
              placeholder="选择发布计划"
              options={plans.map((p) => ({
                value: p.id,
                label: `${p.title}（${p.subTasks.length} 子任务）`
              }))}
            />
          </Form.Item>
        ) : null}
        {actionType === 'workflow' ? (
          <Form.Item
            label="关联工作流"
            name="workflowId"
            rules={[{ required: true, message: '请选择工作流' }]}
          >
            <Select
              placeholder="选择流程"
              options={workflows.map((w) => ({
                value: w.id,
                label: `${w.title}（${w.nodes.length} 步）`
              }))}
            />
          </Form.Item>
        ) : null}
        {actionType === 'custom_prompt' ? (
          <Form.Item
            label="Agent 指令"
            name="customPrompt"
            rules={[
              { required: true, whitespace: true, message: '请填写 Agent 指令' },
              { min: 10, message: '指令至少 10 个字符' }
            ]}
          >
            <Input.TextArea rows={5} placeholder="到点时发送给 Agent 的完整指令…" />
          </Form.Item>
        ) : null}
        <Form.Item
          label="完成后通知"
          name="notifyChannels"
          extra="任务成功后自动将执行结果转为飞书富文本推送；需在渠道页配置飞书 Webhook"
        >
          <Select
            mode="multiple"
            allowClear
            placeholder="可选，选择通知渠道"
            options={notifyChannelOptions}
          />
        </Form.Item>
        <Form.Item
          label="后台执行"
          name="runInBackground"
          valuePropName="checked"
          extra="开启后任务在后台运行，执行期间卡片显示加载状态，不会跳转到聊天窗口"
        >
          <Switch />
        </Form.Item>
        <Form.Item label="启用" name="enabled" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  )
}

/** 单条任务卡片 */
function TaskCard({
  task,
  index,
  planTitle,
  modelLabel,
  onToggle,
  onRunNow,
  onViewSession,
  onEdit,
  onDelete
}: {
  task: ScheduledTask
  index: number
  planTitle: string
  modelLabel: string
  onToggle: (enabled: boolean) => void
  onRunNow: () => void
  onViewSession: () => void
  onEdit: () => void
  onDelete: () => void
}): React.ReactElement {
  const displayStatus = resolveTaskDisplayStatus(task)
  const trigger = formatTriggerMethod(task)
  const isExecuting = displayStatus === 'executing'

  const bodyText =
    task.description?.trim() ||
    (task.actionType === 'custom_prompt'
      ? task.customPrompt?.trim()
      : task.actionType === 'workflow'
        ? `关联工作流：${planTitle}`
        : `关联发布计划：${planTitle}`) ||
    '暂无说明'

  const actionMain =
    task.actionType === 'publish_plan'
      ? '发布计划'
      : task.actionType === 'workflow'
        ? '工作流'
        : 'Agent 指令'
  const actionSub =
    task.actionType === 'custom_prompt'
      ? (task.customPrompt?.slice(0, 36) ?? '') +
      (task.customPrompt && task.customPrompt.length > 36 ? '…' : '')
      : planTitle

  return (
    <article
      className={`${styles.taskCard}${isExecuting ? ` ${styles.taskCardExecuting}` : ''}`}
      style={{ '--card-index': index } as CSSProperties}
    >
      {isExecuting ? (
        <div className={styles.executingOverlay} aria-live="polite" aria-busy="true">
          <Spin size="small" />
          <span className={styles.executingLabel}>执行中…</span>
        </div>
      ) : null}
      <div className={styles.taskCardHeader}>
        <div className={styles.taskCardTitleRow}>
          <span className={styles.taskCardTitle}>{task.title || '未命名任务'}</span>
          {isBuiltinSeedId(task.id) ? (
            <Tag color={DB_THEME.primary} className={styles.builtinTag}>
              内置
            </Tag>
          ) : null}
          <span className={styles.statusBadge} data-status={displayStatus}>
            {resolveStatusLabel(displayStatus)}
          </span>
        </div>
      </div>

      <div className={styles.taskDescription}>
        <Tooltip title={bodyText}>
          <p className={styles.taskDescriptionPrompt}>{bodyText}</p>
        </Tooltip>

      </div>

      <div className={styles.infoGrid}>
        <div className={styles.infoCell}>
          <span className={styles.infoLabel}>触发方式</span>
          <span className={styles.infoValue}>{trigger.main}</span>
          <span className={styles.infoSub}>{trigger.sub}</span>
        </div>
        <div className={styles.infoCell}>
          <span className={styles.infoLabel}>下次执行</span>
          <span className={styles.infoValue}>
            {task.enabled && task.nextRunAt ? formatNextRunAbsolute(task.nextRunAt) : '未安排'}
          </span>
          {task.enabled && task.nextRunAt ? (
            <span className={styles.infoSub}>{formatNextRunAt(task.nextRunAt)}</span>
          ) : null}
        </div>
        <div className={styles.infoCell}>
          <span className={styles.infoLabel}>执行动作</span>
          <span className={styles.infoValue}>{actionMain}</span>
          <span className={styles.infoSub} title={actionSub}>
            {actionSub}
          </span>
        </div>
        <div className={styles.infoCell}>
          <span className={styles.infoLabel}>执行次数</span>
          <span className={styles.infoValue}>{formatScheduledTaskRunCount(task)}</span>
          {task.lastRunAt ? (
            <span className={styles.infoSub}>
              上次 {new Date(task.lastRunAt).toLocaleString('zh-CN')}
            </span>
          ) : null}
        </div>
      </div>

      <div className={styles.taskCardFooter}>
        <span className={styles.footerHint}>{modelLabel}</span>
        <div className={styles.footerActions}>
          <Tooltip title={task.enabled ? '暂停' : '启用'}>
            <button
              type="button"
              className={styles.actionBtn}
              disabled={isExecuting || displayStatus === 'completed'}
              onClick={() => onToggle(!task.enabled)}
            >
              {task.enabled ? <PauseOutlined /> : <CaretRightOutlined />}
            </button>
          </Tooltip>
          <Tooltip title="立即执行">
            <button
              type="button"
              className={styles.actionBtn}
              disabled={isExecuting}
              onClick={onRunNow}
            >
              <StepForwardOutlined />
            </button>
          </Tooltip>
          <Tooltip title={task.lastSessionId ? '查看会话' : '暂无执行记录'}>
            <button
              type="button"
              className={styles.actionBtn}
              disabled={!task.lastSessionId}
              onClick={onViewSession}
            >
              <UnorderedListOutlined />
            </button>
          </Tooltip>
          <Tooltip title="编辑">
            <button type="button" className={styles.actionBtn} onClick={onEdit}>
              <EditOutlined />
            </button>
          </Tooltip>
          <Popconfirm title="确定删除该定时任务？" onConfirm={onDelete}>
            <Tooltip title="删除">
              <button type="button" className={styles.actionBtn} data-danger="true">
                <DeleteOutlined />
              </button>
            </Tooltip>
          </Popconfirm>
        </div>
      </div>
    </article>
  )
}

/** 定时任务工作台：卡片列表 + 主题色 */
export function SchedulePage(): React.ReactElement {
  const tasks = useScheduleStore((s) => s.tasks)
  const hydrate = useScheduleStore((s) => s.hydrate)
  const saveTask = useScheduleStore((s) => s.saveTask)
  const removeTask = useScheduleStore((s) => s.removeTask)
  const toggleEnabled = useScheduleStore((s) => s.toggleEnabled)
  const runNow = useScheduleStore((s) => s.runNow)
  const addBuiltinTasks = useScheduleStore((s) => s.addBuiltinTasks)

  const plans = usePublishStore((s) => s.plans)
  const workflows = useWorkflowsStore((s) => s.workflows)
  const hydrateWorkflows = useWorkflowsStore((s) => s.hydrate)
  const hydrateSessions = useSessionStore((s) => s.hydrate)
  const setActiveSession = useSessionStore((s) => s.setActive)
  const beginExternalRun = useSessionStore((s) => s.beginExternalRun)
  const setView = useAppStore((s) => s.setView)
  const settings = useSettingsStore((s) => s.settings)
  const channels = useChannelsStore((s) => s.channels)
  const enabledNotifyChannels = useMemo(
    () => queryEnabledNotifyChannelsFromStore(channels),
    [channels]
  )
  const notifyChannelOptions = useMemo(
    () =>
      enabledNotifyChannels.map((ch) => ({
        value: ch.id,
        label: ch.label
      })),
    [enabledNotifyChannels]
  )

  const [taskModal, setTaskModal] = useState<{
    mode: 'create' | 'edit'
    task: ScheduledTask
  } | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<ScheduleFilter>('all')
  const [search, setSearch] = useState('')

  const stats = useMemo(() => computeScheduleStats(tasks), [tasks])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return tasks.filter((task) => {
      if (filter !== 'all' && resolveTaskDisplayStatus(task) !== filter) return false
      if (!q) return true
      return (
        task.title.toLowerCase().includes(q) ||
        task.description.toLowerCase().includes(q) ||
        (task.customPrompt?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [tasks, filter, search])

  const modelLabel = useMemo(() => {
    const model = settings.model?.trim()
    return model ? `使用模型 ${model}` : '使用当前默认模型'
  }, [settings.model])

  const resolveActionTitle = useCallback(
    (task: ScheduledTask): string => {
      if (task.actionType === 'workflow') {
        return workflows.find((w) => w.id === task.workflowId)?.title ?? '未选择流程'
      }
      if (task.actionType === 'publish_plan') {
        return plans.find((p) => p.id === task.publishPlanId)?.title ?? '未选择'
      }
      return '自定义指令'
    },
    [plans, workflows]
  )

  useEffect(() => {
    void hydrate()
    void hydrateWorkflows()
  }, [hydrate, hydrateWorkflows])

  const handleRefresh = async (): Promise<void> => {
    setRefreshing(true)
    try {
      await hydrate()
      await hydrateWorkflows()
    } finally {
      setRefreshing(false)
    }
  }

  const handleRunNow = async (task: ScheduledTask): Promise<void> => {
    const result = await runNow(task.id)
    if (!result) {
      message.error('执行失败，请检查任务配置')
      return
    }

    if (queryRunInBackground(task)) {
      message.success('任务已在后台执行')
      return
    }

    await hydrateSessions()
    setView('chat')
    if (result.lastSessionId) {
      beginExternalRun(result.lastSessionId)
      setActiveSession(result.lastSessionId)
    }
    message.success('已在主聊天窗口开始执行')
  }

  const handleViewSession = async (sessionId: string): Promise<void> => {
    await hydrateSessions()
    setActiveSession(sessionId)
    setView('chat')
  }

  return (
    <FeaturePageShell>
      <FeaturePageHeader
        icon={<ClockCircleOutlined />}
        title="定时任务"
        badge={tasks.length}
        description={`到点执行发布计划、工作流或自定义指令；运行中 ${stats.running} · 执行中 ${stats.executing}`}
        extra={
          <Space wrap>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => void handleRefresh()}
              loading={refreshing}
            >
              刷新
            </Button>
            <Button
              onClick={async () => {
                await addBuiltinTasks()
                message.success('已导入内置定时任务')
              }}
            >
              导入示例
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setTaskModal({ mode: 'create', task: createEmptyScheduledTask() })
              }}
            >
              添加任务
            </Button>
          </Space>
        }
      />

      <FeaturePageToolbar>
        <Segmented
          value={filter}
          onChange={(v) => setFilter(v as ScheduleFilter)}
          options={[
            { label: '全部', value: 'all' },
            { label: '运行中', value: 'running' },
            { label: '执行中', value: 'executing' },
            { label: '已暂停', value: 'paused' },
            { label: '已完成', value: 'completed' }
          ]}
        />
        <div className={shellStyles.toolbarRight}>
          <span className={shellStyles.resultCount}>{filtered.length} 项</span>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索任务..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </FeaturePageToolbar>

      <FeatureScrollBody>
        {filtered.length === 0 ? (
          <Empty
            description={tasks.length === 0 ? '暂无定时任务' : '暂无匹配的任务'}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            className={styles.empty}
          >
            {tasks.length === 0 ? (
              <Space>
                <Button
                  onClick={async () => {
                    await addBuiltinTasks()
                    message.success('已导入内置定时任务')
                  }}
                >
                  导入示例
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setTaskModal({ mode: 'create', task: createEmptyScheduledTask() })
                  }}
                >
                  添加任务
                </Button>
              </Space>
            ) : null}
          </Empty>
        ) : (
          <div className={styles.taskList}>
            {filtered.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                planTitle={resolveActionTitle(task)}
                modelLabel={modelLabel}
                onToggle={(enabled) => void toggleEnabled(task.id, enabled)}
                onRunNow={() => void handleRunNow(task)}
                onViewSession={() => {
                  if (task.lastSessionId) void handleViewSession(task.lastSessionId)
                }}
                onEdit={() => setTaskModal({ mode: 'edit', task: { ...task } })}
                onDelete={async () => {
                  await removeTask(task.id)
                  message.success('已删除')
                }}
              />
            ))}
          </div>
        )}
      </FeatureScrollBody>

      <TaskEditModal
        open={Boolean(taskModal)}
        mode={taskModal?.mode ?? 'create'}
        initialTask={taskModal?.task ?? null}
        plans={plans}
        workflows={workflows}
        notifyChannelOptions={notifyChannelOptions}
        onCancel={() => setTaskModal(null)}
        onSubmit={async (task) => {
          const isCreate = taskModal?.mode === 'create'
          await saveTask(task)
          setTaskModal(null)
          message.success(isCreate ? '已创建定时任务' : '已保存')
        }}
      />
    </FeaturePageShell>
  )
}
