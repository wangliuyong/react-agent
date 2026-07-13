import { useMemo, useState } from 'react'
import {
  Button,
  DatePicker,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Segmented,
  Select,
  Space,
  Switch,
  Tag,
  TimePicker,
  Typography,
  message
} from 'antd'
import {
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  ThunderboltOutlined
} from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import type { ScheduledTask, ScheduleRepeat } from '@shared/types'
import {
  formatNextRunAt,
  formatScheduleSummary,
  SCHEDULE_REPEAT_OPTIONS,
  WEEKDAY_OPTIONS
} from '@shared/schedule-utils'
import { useScheduleStore } from '../../hooks/useScheduleStore'
import { usePublishStore } from '@/features/publish'
import { useSessionStore } from '@/features/chat'
import { useAppStore } from '@/stores/app-store'
import styles from './SchedulePage.module.css'

const { Title, Text, Paragraph } = Typography

/** 执行状态对应的展示标签 */
function StatusTag({ status }: { status: ScheduledTask['lastRunStatus'] }): React.ReactElement | null {
  if (!status || status === 'pending') return null
  const map = {
    running: { color: 'processing', label: '执行中' },
    success: { color: 'success', label: '成功' },
    failed: { color: 'error', label: '失败' },
    skipped: { color: 'default', label: '跳过' }
  } as const
  const item = map[status]
  return <Tag color={item.color}>{item.label}</Tag>
}

/** 定时任务工作台：配置调度规则并关联发布计划或自定义指令 */
export function SchedulePage(): React.ReactElement {
  const tasks = useScheduleStore((s) => s.tasks)
  const activeTaskId = useScheduleStore((s) => s.activeTaskId)
  const setActive = useScheduleStore((s) => s.setActive)
  const createTask = useScheduleStore((s) => s.createTask)
  const saveTask = useScheduleStore((s) => s.saveTask)
  const removeTask = useScheduleStore((s) => s.removeTask)
  const toggleEnabled = useScheduleStore((s) => s.toggleEnabled)
  const runNow = useScheduleStore((s) => s.runNow)

  const plans = usePublishStore((s) => s.plans)
  const hydrateSessions = useSessionStore((s) => s.hydrate)
  const setActiveSession = useSessionStore((s) => s.setActive)
  const setView = useAppStore((s) => s.setView)

  const [editing, setEditing] = useState<ScheduledTask | null>(null)

  const active = useMemo(
    () => tasks.find((t) => t.id === activeTaskId) ?? null,
    [tasks, activeTaskId]
  )

  /** 距现在最近的启用任务，用于顶部「下一次」高亮 */
  const nextUpcoming = useMemo(() => {
    const enabled = tasks.filter((t) => t.enabled && t.nextRunAt)
    if (!enabled.length) return null
    return enabled.reduce((a, b) =>
      (a.nextRunAt ?? Infinity) < (b.nextRunAt ?? Infinity) ? a : b
    )
  }, [tasks])

  const enabledCount = tasks.filter((t) => t.enabled).length

  const openEdit = (task: ScheduledTask): void => {
    setEditing({ ...task })
  }

  const handleSaveEdit = async (): Promise<void> => {
    if (!editing) return
    if (editing.actionType === 'publish_plan' && !editing.publishPlanId) {
      message.warning('请选择关联的发布计划')
      return
    }
    if (editing.actionType === 'custom_prompt' && !editing.customPrompt?.trim()) {
      message.warning('请填写自定义指令')
      return
    }
    await saveTask(editing)
    setEditing(null)
    message.success('已保存')
  }

  const handleRunNow = async (task: ScheduledTask): Promise<void> => {
    const result = await runNow(task.id)
    if (!result) {
      message.error('执行失败，请检查任务配置')
      return
    }
    await hydrateSessions()
    setView('chat')
    if (result.lastSessionId) {
      setActiveSession(result.lastSessionId)
    }
    message.success('已在主聊天窗口开始执行')
  }

  const planTitle = (planId?: string): string =>
    plans.find((p) => p.id === planId)?.title ?? '未选择'

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <div className={styles.headerIcon}>
            <ClockCircleOutlined />
          </div>
          <div>
            <Title level={3} className={styles.headerTitle}>
              定时任务
            </Title>
            <div className={styles.headerDesc}>到点自动创建会话并驱动 Agent 执行</div>
          </div>
        </div>
        <Space>
          <div className={styles.statPill}>
            <span className={styles.statValue}>{enabledCount}</span>
            <span className={styles.statLabel}>启用中</span>
          </div>
          {nextUpcoming ? (
            <div className={styles.nextPill}>
              <ThunderboltOutlined />
              <span>
                下次 · {nextUpcoming.title} · {formatNextRunAt(nextUpcoming.nextRunAt)}
              </span>
            </div>
          ) : null}
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={async () => {
              const task = await createTask()
              openEdit(task)
            }}
          >
            新建定时任务
          </Button>
        </Space>
      </header>

      <div className={styles.body}>
        <aside className={styles.sidebar}>
          {tasks.length === 0 ? (
            <Empty description="暂无定时任务" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            tasks.map((t) => (
              <button
                key={t.id}
                type="button"
                className={styles.taskItem}
                data-active={t.id === activeTaskId}
                data-next={t.id === nextUpcoming?.id}
                onClick={() => setActive(t.id)}
              >
                <div className={styles.taskItemTop}>
                  <span className={styles.taskTitle}>{t.title}</span>
                  <Switch
                    size="small"
                    checked={t.enabled}
                    onClick={(_, e) => e.stopPropagation()}
                    onChange={(v) => void toggleEnabled(t.id, v)}
                  />
                </div>
                <div className={styles.taskMeta}>{formatScheduleSummary(t)}</div>
                <div className={styles.taskMetaRow}>
                  <StatusTag status={t.lastRunStatus} />
                  {t.enabled && t.nextRunAt ? (
                    <span className={styles.nextHint}>{formatNextRunAt(t.nextRunAt)}</span>
                  ) : (
                    <span className={styles.nextHintMuted}>已暂停</span>
                  )}
                </div>
              </button>
            ))
          )}
        </aside>

        <main className={styles.main}>
          {!active ? (
            <Empty description="选择或新建一个定时任务" />
          ) : (
            <>
              <div className={styles.detailHeader}>
                <div>
                  <Title level={4} style={{ margin: 0 }}>
                    {active.title}
                  </Title>
                  <Text type="secondary">
                    {formatScheduleSummary(active)}
                    {active.enabled && active.nextRunAt
                      ? ` · ${formatNextRunAt(active.nextRunAt)}`
                      : ''}
                  </Text>
                </div>
                <Space>
                  <Button icon={<EditOutlined />} onClick={() => openEdit(active)}>
                    编辑
                  </Button>
                  <Button
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    onClick={() => void handleRunNow(active)}
                  >
                    立即执行
                  </Button>
                  <Popconfirm
                    title="确定删除该定时任务？"
                    onConfirm={async () => {
                      await removeTask(active.id)
                      message.success('已删除')
                    }}
                  >
                    <Button danger type="link" icon={<DeleteOutlined />}>
                      删除
                    </Button>
                  </Popconfirm>
                </Space>
              </div>

              <div className={styles.detailGrid}>
                <section className={styles.detailCard}>
                  <div className={styles.cardLabel}>调度规则</div>
                  <div className={styles.cardValue}>{formatScheduleSummary(active)}</div>
                  <div className={styles.cardSub}>
                    {active.enabled ? '已启用，主进程后台轮询触发' : '已暂停，不会自动执行'}
                  </div>
                </section>

                <section className={styles.detailCard}>
                  <div className={styles.cardLabel}>执行动作</div>
                  <div className={styles.cardValue}>
                    {active.actionType === 'publish_plan' ? '关联发布计划' : '自定义指令'}
                  </div>
                  <div className={styles.cardSub}>
                    {active.actionType === 'publish_plan'
                      ? planTitle(active.publishPlanId)
                      : (active.customPrompt?.slice(0, 48) || '未填写') +
                        (active.customPrompt && active.customPrompt.length > 48 ? '…' : '')}
                  </div>
                </section>

                <section className={styles.detailCard}>
                  <div className={styles.cardLabel}>最近执行</div>
                  <div className={styles.cardValue}>
                    {active.lastRunAt
                      ? new Date(active.lastRunAt).toLocaleString('zh-CN')
                      : '尚未执行'}
                  </div>
                  <div className={styles.cardSub}>
                    <StatusTag status={active.lastRunStatus} />
                    {active.lastSessionId ? (
                      <Button
                        type="link"
                        size="small"
                        style={{ padding: 0, height: 'auto' }}
                        onClick={async () => {
                          await hydrateSessions()
                          setActiveSession(active.lastSessionId!)
                          setView('chat')
                        }}
                      >
                        查看会话
                      </Button>
                    ) : null}
                  </div>
                </section>
              </div>

              {active.description ? (
                <Paragraph type="secondary" className={styles.description}>
                  {active.description}
                </Paragraph>
              ) : null}

              <div className={styles.timeline}>
                <div className={styles.timelineTrack} />
                <div className={styles.timelineNode} data-active={active.enabled}>
                  <div className={styles.timelineDot} />
                  <div className={styles.timelineContent}>
                    <span className={styles.timelineTitle}>下一次触发</span>
                    <span className={styles.timelineTime}>
                      {active.enabled && active.nextRunAt
                        ? new Date(active.nextRunAt).toLocaleString('zh-CN')
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      <Modal
        title="编辑定时任务"
        open={Boolean(editing)}
        onCancel={() => setEditing(null)}
        onOk={() => void handleSaveEdit()}
        width={560}
        destroyOnClose
      >
        {editing ? (
          <Form layout="vertical" className={styles.form}>
            <Form.Item label="标题" required>
              <Input
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              />
            </Form.Item>
            <Form.Item label="说明">
              <Input.TextArea
                rows={2}
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              />
            </Form.Item>
            <Form.Item label="重复规则">
              <Segmented
                block
                options={SCHEDULE_REPEAT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                value={editing.repeat}
                onChange={(v) => setEditing({ ...editing, repeat: v as ScheduleRepeat })}
              />
            </Form.Item>
            {editing.repeat === 'once' ? (
              <Form.Item label="执行时间" required>
                <DatePicker
                  showTime
                  style={{ width: '100%' }}
                  value={editing.runAt ? dayjs(editing.runAt) : null}
                  onChange={(d: Dayjs | null) =>
                    setEditing({ ...editing, runAt: d?.valueOf() })
                  }
                />
              </Form.Item>
            ) : (
              <>
                {editing.repeat === 'weekly' ? (
                  <Form.Item label="星期" required>
                    <Select
                      options={WEEKDAY_OPTIONS}
                      value={editing.weekday ?? 1}
                      onChange={(v) => setEditing({ ...editing, weekday: v })}
                    />
                  </Form.Item>
                ) : null}
                <Form.Item label="时刻" required>
                  <TimePicker
                    format="HH:mm"
                    style={{ width: '100%' }}
                    value={dayjs(editing.timeOfDay, 'HH:mm')}
                    onChange={(d: Dayjs | null) =>
                      setEditing({
                        ...editing,
                        timeOfDay: d ? d.format('HH:mm') : '09:00'
                      })
                    }
                  />
                </Form.Item>
              </>
            )}
            <Form.Item label="执行动作">
              <Segmented
                block
                options={[
                  { value: 'publish_plan', label: '发布计划' },
                  { value: 'custom_prompt', label: '自定义指令' }
                ]}
                value={editing.actionType}
                onChange={(v) =>
                  setEditing({
                    ...editing,
                    actionType: v as ScheduledTask['actionType']
                  })
                }
              />
            </Form.Item>
            {editing.actionType === 'publish_plan' ? (
              <Form.Item label="关联发布计划" required>
                <Select
                  placeholder="选择发布计划"
                  options={plans.map((p) => ({
                    value: p.id,
                    label: `${p.title}（${p.subTasks.length} 子任务）`
                  }))}
                  value={editing.publishPlanId}
                  onChange={(v) => setEditing({ ...editing, publishPlanId: v })}
                />
              </Form.Item>
            ) : (
              <Form.Item label="Agent 指令" required>
                <Input.TextArea
                  rows={5}
                  placeholder="到点时发送给 Agent 的完整指令…"
                  value={editing.customPrompt}
                  onChange={(e) => setEditing({ ...editing, customPrompt: e.target.value })}
                />
              </Form.Item>
            )}
            <Form.Item label="启用">
              <Switch
                checked={editing.enabled}
                onChange={(v) => setEditing({ ...editing, enabled: v })}
              />
            </Form.Item>
          </Form>
        ) : null}
      </Modal>
    </div>
  )
}
