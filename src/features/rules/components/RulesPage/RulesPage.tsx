import type { CSSProperties } from 'react'
import type { AgentRule, AgentRuleUpsertInput } from '@shared/types'
import { SkillMarkdown } from '@/features/skills/components/SkillMarkdown'
import { useRulesStore } from '../../hooks/useRulesStore'
import {
  createEmptyRule,
  isValidRuleId,
  ruleToInput,
  slugifyRuleId
} from '../../types'
import styles from './RulesPage.module.css'

const { Title, Text } = Typography

type RuleFilter = 'all' | 'enabled' | 'disabled'

function matchRuleQuery(rule: AgentRule, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    rule.name.toLowerCase().includes(q) ||
    rule.description.toLowerCase().includes(q) ||
    rule.id.toLowerCase().includes(q) ||
    rule.content.toLowerCase().includes(q)
  )
}

function RuleStatusTag({ enabled }: { enabled: boolean }): React.ReactElement {
  if (!enabled) return <Tag className={styles.tagDraft}>未启用</Tag>
  return <Tag color="success">已启用</Tag>
}

/** 规则管理：对齐技能市场 — 卡片浏览 + 详情弹窗 + CRUD */
export function RulesPage(): React.ReactElement {
  const rules = useRulesStore((s) => s.rules)
  const loading = useRulesStore((s) => s.loading)
  const hydrate = useRulesStore((s) => s.hydrate)
  const saveRule = useRulesStore((s) => s.saveRule)
  const removeRule = useRulesStore((s) => s.removeRule)
  const toggleEnabled = useRulesStore((s) => s.toggleEnabled)

  const [filter, setFilter] = useState<RuleFilter>('all')
  const [search, setSearch] = useState('')

  const [detailOpen, setDetailOpen] = useState(false)
  const [detailRule, setDetailRule] = useState<AgentRule | null>(null)

  const [editOpen, setEditOpen] = useState(false)
  const [editMode, setEditMode] = useState<'create' | 'update'>('create')
  /** destroyOnHidden 下须在 Form 挂载前备好 initialValues，不能依赖提前 setFieldsValue */
  const [editDraft, setEditDraft] = useState<AgentRuleUpsertInput | null>(null)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm<AgentRuleUpsertInput>()

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  const enabledCount = useMemo(() => rules.filter((r) => r.enabled).length, [rules])

  const filtered = useMemo(() => {
    let list = rules
    if (filter === 'enabled') list = list.filter((r) => r.enabled)
    if (filter === 'disabled') list = list.filter((r) => !r.enabled)
    return list.filter((r) => matchRuleQuery(r, search))
  }, [rules, filter, search])

  const closeEdit = (): void => {
    setEditOpen(false)
    setEditDraft(null)
  }

  const openCreate = (): void => {
    const draft = createEmptyRule()
    setEditMode('create')
    setEditDraft(draft)
    setEditOpen(true)
  }

  const openEdit = (rule: AgentRule): void => {
    setEditMode('update')
    setEditDraft(ruleToInput(rule))
    setEditOpen(true)
  }

  const openDetail = (rule: AgentRule): void => {
    setDetailRule(rule)
    setDetailOpen(true)
  }

  const handleSave = async (): Promise<void> => {
    try {
      const values = await form.validateFields()
      // 编辑态 id 不可改：优先表单值，其次打开时的 draft（防止字段未挂载时丢失）
      const rawId =
        editMode === 'update'
          ? (values.id || editDraft?.id || '')
          : values.id || values.name || ''
      const normalizedId =
        editMode === 'create' ? slugifyRuleId(String(rawId)) : String(rawId).trim()
      if (!isValidRuleId(normalizedId)) {
        message.error('规则 id 仅允许小写字母、数字、连字符和下划线')
        return Promise.reject(new Error('validation'))
      }
      setSaving(true)
      const saved = await saveRule({
        id: normalizedId,
        name: values.name.trim(),
        description: (values.description ?? '').trim(),
        content: values.content.trim(),
        enabled: Boolean(values.enabled)
      })
      message.success(editMode === 'create' ? '规则已创建' : '规则已更新')
      closeEdit()
      if (detailRule?.id === saved.id) setDetailRule(saved)
    } catch (err) {
      if (err instanceof Error && err.message && err.message !== 'validation') {
        message.error(err.message)
      }
      return Promise.reject(err instanceof Error ? err : new Error('save failed'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    try {
      await removeRule(id)
      message.success('规则已删除')
      if (detailRule?.id === id) {
        setDetailOpen(false)
        setDetailRule(null)
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : '删除失败')
    }
  }

  const handleToggle = async (id: string, enabled: boolean): Promise<void> => {
    try {
      await toggleEnabled(id, enabled)
      message.success(enabled ? '已启用，将注入 Agent' : '已禁用')
      if (detailRule?.id === id) {
        setDetailRule((prev) => (prev ? { ...prev, enabled } : prev))
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : '更新失败')
    }
  }

  // 列表变更后同步详情对象
  useEffect(() => {
    if (!detailRule) return
    const next = rules.find((r) => r.id === detailRule.id)
    if (next) setDetailRule(next)
  }, [rules, detailRule?.id])

  return (
    <div className={styles.page}>
      <header className={`${styles.header} app-drag`}>
        <div className={styles.headerMain}>
          <div className={styles.headerIcon}>
            <UnorderedListOutlined />
          </div>
          <div>
            <div className={styles.titleRow}>
              <Title level={3} className={styles.title}>
                规则
              </Title>
              <span className={styles.countBadge}>{rules.length}</span>
            </div>
            <Text type="secondary" className={styles.desc}>
              Always Apply 持久指令；已启用 {enabledCount} 条，对话时优先于技能注入系统提示
            </Text>
          </div>
        </div>
        <Space wrap className="app-no-drag">
          <Button
            icon={<ReloadOutlined />}
            onClick={async () => {
              await hydrate()
              message.success('已刷新')
            }}
          >
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新建规则
          </Button>
        </Space>
      </header>

      <div className={styles.toolbar}>
        <Segmented
          value={filter}
          onChange={(v) => setFilter(v as RuleFilter)}
          options={[
            { label: '全部', value: 'all' },
            { label: '已启用', value: 'enabled' },
            { label: '未启用', value: 'disabled' }
          ]}
        />
        <div className={styles.toolbarRight}>
          <span className={styles.resultCount}>{filtered.length} 项</span>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索规则..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      <div className={styles.body}>
        <Spin spinning={loading && rules.length === 0}>
          {filtered.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={rules.length === 0 ? '暂无规则' : '暂无匹配的规则'}
              className={styles.empty}
            >
              {rules.length === 0 ? (
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                  新建规则
                </Button>
              ) : null}
            </Empty>
          ) : (
            <div className={styles.grid}>
              {filtered.map((rule, index) => (
                <Card
                  key={rule.id}
                  variant="borderless"
                  hoverable
                  className={`${styles.card} ${rule.enabled ? '' : styles.cardDisabled}`}
                  style={{ '--card-index': index } as CSSProperties}
                  onClick={() => openDetail(rule)}
                >
                  <div className={styles.cardHead}>
                    <div className={styles.cardTitleRow}>
                      <span className={styles.cardTitle}>{rule.name}</span>
                      <RuleStatusTag enabled={rule.enabled} />
                    </div>
                    <p className={styles.cardDesc}>
                      {rule.description?.trim() || '暂无简介，点击查看正文与启用状态。'}
                    </p>
                  </div>
                  <div className={styles.cardFooter}>
                    <span className={styles.cardAuthor}>@{rule.id}</span>
                    <span className={styles.cardUsage}>
                      {rule.enabled ? '注入 Agent' : '未注入'}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Spin>
      </div>

      <Modal
        title={detailRule?.name ?? '规则详情'}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={760}
        destroyOnHidden
        className={styles.detailModal}
      >
        {!detailRule ? (
          <Empty description="未找到规则详情" />
        ) : (
          <div className={styles.detailBody}>
            <div className={styles.detailHeader}>
              <div>
                <code className={styles.detailId}>{detailRule.id}</code>
                <div className={styles.detailTags}>
                  <RuleStatusTag enabled={detailRule.enabled} />
                </div>
              </div>
              <Space wrap>
                <Button
                  icon={<EditOutlined />}
                  onClick={() => openEdit(detailRule)}
                >
                  编辑
                </Button>
                <Popconfirm
                  title="确定删除该规则？"
                  description="删除后对话将不再注入此指令。"
                  onConfirm={() => void handleDelete(detailRule.id)}
                  okText="删除"
                  cancelText="取消"
                  okButtonProps={{ danger: true }}
                >
                  <Button danger icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>
                <div className={styles.injectToggle}>
                  <span className={styles.injectLabel}>注入 Agent</span>
                  <Switch
                    checked={detailRule.enabled}
                    onChange={(v) => void handleToggle(detailRule.id, v)}
                  />
                </div>
              </Space>
            </div>

            {detailRule.description?.trim() ? (
              <p className={styles.description}>{detailRule.description}</p>
            ) : null}

            <div>
              <h3 className={styles.sectionLabel}>规则正文</h3>
              <SkillMarkdown source={detailRule.content} />
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title={editMode === 'create' ? '新建规则' : '编辑规则'}
        open={editOpen}
        onCancel={closeEdit}
        onOk={() => void handleSave()}
        confirmLoading={saving}
        destroyOnHidden
        width={640}
      >
        <Form
          key={editDraft ? `${editMode}-${editDraft.id || 'new'}` : 'closed'}
          form={form}
          layout="vertical"
          preserve={false}
          initialValues={editDraft ?? undefined}
        >
          <Form.Item
            name="id"
            label="规则 ID"
            tooltip={
              editMode === 'create'
                ? '留空则根据名称自动生成；仅小写字母、数字、连字符与下划线'
                : undefined
            }
          >
            <Input
              disabled={editMode === 'update'}
              placeholder={editMode === 'create' ? '例如 reply_zh_cn' : undefined}
            />
          </Form.Item>
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入规则名称' }]}
          >
            <Input placeholder="例如 简体中文回复" />
          </Form.Item>
          <Form.Item name="description" label="简介">
            <Input.TextArea rows={2} placeholder="列表卡片上展示的简短说明" />
          </Form.Item>
          <Form.Item name="enabled" label="启用并注入 Agent" valuePropName="checked">
            <Switch checkedChildren="开" unCheckedChildren="关" />
          </Form.Item>
          <Form.Item
            name="content"
            label="规则正文"
            rules={[{ required: true, message: '请输入规则正文' }]}
            tooltip="Markdown，启用后会拼进 Agent 系统提示"
          >
            <Input.TextArea
              rows={7}
              placeholder="用自然语言写清约束，例如：所有回复必须使用简体中文。"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
