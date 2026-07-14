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

const { Title, Paragraph, Text } = Typography

/** 规则管理：CRUD + 启用开关；已启用规则在对话时注入 Agent SYSTEM_PROMPT */
export function RulesPage(): React.ReactElement {
  const rules = useRulesStore((s) => s.rules)
  const loading = useRulesStore((s) => s.loading)
  const hydrate = useRulesStore((s) => s.hydrate)
  const saveRule = useRulesStore((s) => s.saveRule)
  const removeRule = useRulesStore((s) => s.removeRule)
  const toggleEnabled = useRulesStore((s) => s.toggleEnabled)

  const [editOpen, setEditOpen] = useState(false)
  const [editMode, setEditMode] = useState<'create' | 'update'>('create')
  const [saving, setSaving] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewRule, setPreviewRule] = useState<AgentRule | null>(null)
  const [form] = Form.useForm<AgentRuleUpsertInput>()

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  const enabledCount = useMemo(() => rules.filter((r) => r.enabled).length, [rules])

  const openCreate = (): void => {
    const draft = createEmptyRule()
    setEditMode('create')
    form.setFieldsValue(draft)
    setEditOpen(true)
  }

  const openEdit = (id: string): void => {
    const rule = rules.find((r) => r.id === id)
    if (!rule) return
    setEditMode('update')
    form.setFieldsValue(ruleToInput(rule))
    setEditOpen(true)
  }

  const openPreview = (rule: AgentRule): void => {
    setPreviewRule(rule)
    setPreviewOpen(true)
  }

  const handleSave = async (): Promise<void> => {
    try {
      const values = await form.validateFields()
      const normalizedId =
        editMode === 'create' ? slugifyRuleId(values.id || values.name) : values.id.trim()
      if (!isValidRuleId(normalizedId)) {
        message.error('规则 id 仅允许小写字母、数字、连字符和下划线')
        return Promise.reject(new Error('validation'))
      }
      setSaving(true)
      await saveRule({
        id: normalizedId,
        name: values.name.trim(),
        description: (values.description ?? '').trim(),
        content: values.content.trim(),
        enabled: Boolean(values.enabled)
      })
      message.success(editMode === 'create' ? '规则已创建' : '规则已更新')
      setEditOpen(false)
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
      if (previewRule?.id === id) {
        setPreviewOpen(false)
        setPreviewRule(null)
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : '删除失败')
    }
  }

  const handleToggle = async (id: string, enabled: boolean): Promise<void> => {
    try {
      await toggleEnabled(id, enabled)
      message.success(enabled ? '已启用，将注入 Agent' : '已禁用')
    } catch (err) {
      message.error(err instanceof Error ? err.message : '更新失败')
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <div className={styles.headerIcon}>
            <UnorderedListOutlined />
          </div>
          <div>
            <Title level={3} className={styles.title}>
              规则
            </Title>
            <Paragraph className={styles.desc}>
              管理 Agent 持久指令（Always Apply）。已启用 {enabledCount} 条，对话时优先于技能注入系统提示。
            </Paragraph>
          </div>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新建规则
        </Button>
      </header>

      <div className={styles.body}>
        <Spin spinning={loading && rules.length === 0}>
          {rules.length === 0 && !loading ? (
            <div className={styles.emptyWrap}>
              <Empty
                description="暂无规则。新建一条，例如「回复始终使用简体中文」或发布风格约束。"
              >
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                  新建规则
                </Button>
              </Empty>
            </div>
          ) : (
            <div className={styles.grid}>
              {rules.map((rule) => (
                <Card
                  key={rule.id}
                  className={`${styles.card} ${rule.enabled ? '' : styles.cardDisabled}`}
                  variant="borderless"
                >
                  <div className={styles.cardHead}>
                    <div className={styles.cardHeadRow}>
                      <span className={styles.ruleName}>{rule.name}</span>
                      {rule.enabled ? (
                        <Tag color="success">已启用</Tag>
                      ) : (
                        <Tag>未启用</Tag>
                      )}
                    </div>
                    <div className={styles.ruleDesc}>
                      {rule.description || '（无简介）'}
                    </div>
                  </div>

                  <div className={styles.metaList}>
                    <div className={styles.metaRow}>
                      <span className={styles.metaLabel}>规则 ID</span>
                      <span className={styles.metaValue}>{rule.id}</span>
                    </div>
                    <div className={styles.metaRow}>
                      <span className={styles.metaLabel}>注入 Agent</span>
                      <Switch
                        size="small"
                        checked={rule.enabled}
                        checkedChildren="开"
                        unCheckedChildren="关"
                        onChange={(checked) => void handleToggle(rule.id, checked)}
                      />
                    </div>
                  </div>

                  <div className={styles.actions}>
                    <Button
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => openPreview(rule)}
                    >
                      预览
                    </Button>
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => openEdit(rule.id)}
                    >
                      编辑
                    </Button>
                    <Popconfirm
                      title="确定删除该规则？"
                      description="删除后对话将不再注入此指令。"
                      onConfirm={() => void handleDelete(rule.id)}
                      okText="删除"
                      cancelText="取消"
                      okButtonProps={{ danger: true }}
                    >
                      <Button size="small" danger icon={<DeleteOutlined />}>
                        删除
                      </Button>
                    </Popconfirm>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Spin>
      </div>

      <Modal
        title={editMode === 'create' ? '新建规则' : '编辑规则'}
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={() => void handleSave()}
        confirmLoading={saving}
        destroyOnHidden
        width={640}
      >
        <Form form={form} layout="vertical" preserve={false}>
          {editMode === 'create' ? (
            <Form.Item
              name="id"
              label="规则 ID"
              tooltip="留空则根据名称自动生成；仅小写字母、数字、连字符与下划线"
            >
              <Input placeholder="例如 reply_zh_cn" />
            </Form.Item>
          ) : (
            <Form.Item label="规则 ID">
              <Input value={form.getFieldValue('id')} disabled />
            </Form.Item>
          )}
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
              rows={10}
              placeholder="用自然语言写清约束，例如：所有回复必须使用简体中文；发布前先确认标题字数。"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={previewRule?.name ?? '规则预览'}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        width={520}
        destroyOnHidden
      >
        {previewRule && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text type="secondary">简介</Text>
              <div>{previewRule.description || '（无）'}</div>
            </div>
            <div>
              <Text type="secondary">正文</Text>
              <SkillMarkdown source={previewRule.content} />
            </div>
          </Space>
        )}
      </Drawer>
    </div>
  )
}
