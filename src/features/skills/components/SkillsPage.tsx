import { useEffect, useState } from 'react'
import {
  Button,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Tag,
  Typography,
  message,
  Spin,
  Card
} from 'antd'
import {
  AppstoreOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  ThunderboltOutlined
} from '@ant-design/icons'
import type { SkillTemplate, SkillUpsertInput } from '@shared/types'
import { useSkillsStore } from '../hooks/useSkillsStore'
import { SkillMarkdown } from './SkillMarkdown'
import { isValidSkillId, skillDetailToInput, slugifySkillId } from '../types'
import styles from './SkillsPage.module.css'

const { Title, Text, Paragraph } = Typography

/** 技能市场：浏览、新建、编辑、删除 .cursor/skills 项目技能，支持模板一键安装 */
export function SkillsPage(): React.ReactElement {
  const skills = useSkillsStore((s) => s.skills)
  const activeSkillId = useSkillsStore((s) => s.activeSkillId)
  const detail = useSkillsStore((s) => s.detail)
  const templates = useSkillsStore((s) => s.templates)
  const loading = useSkillsStore((s) => s.loading)
  const hydrate = useSkillsStore((s) => s.hydrate)
  const setActive = useSkillsStore((s) => s.setActive)
  const toggleEnabled = useSkillsStore((s) => s.toggleEnabled)
  const refresh = useSkillsStore((s) => s.refresh)
  const createSkillDraft = useSkillsStore((s) => s.createSkillDraft)
  const saveSkill = useSkillsStore((s) => s.saveSkill)
  const removeSkill = useSkillsStore((s) => s.removeSkill)
  const loadTemplates = useSkillsStore((s) => s.loadTemplates)
  const installTemplate = useSkillsStore((s) => s.installTemplate)

  const [editOpen, setEditOpen] = useState(false)
  const [editMode, setEditMode] = useState<'create' | 'update'>('create')
  const [editDraft, setEditDraft] = useState<SkillUpsertInput | null>(null)
  const [saving, setSaving] = useState(false)

  const [templateOpen, setTemplateOpen] = useState(false)
  const [templateLoading, setTemplateLoading] = useState(false)
  const [installingId, setInstallingId] = useState<string | null>(null)
  /** 安装模板时用户可修改目标 id */
  const [installTargetIds, setInstallTargetIds] = useState<Record<string, string>>({})

  const [form] = Form.useForm<SkillUpsertInput>()

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  const enabledCount = skills.filter((s) => s.enabled).length

  /** 打开新建技能弹窗 */
  const openCreate = (): void => {
    const draft = createSkillDraft()
    setEditMode('create')
    setEditDraft(draft)
    form.setFieldsValue(draft)
    setEditOpen(true)
  }

  /** 打开编辑技能弹窗 */
  const openEdit = (): void => {
    if (!detail) return
    const draft = skillDetailToInput(detail)
    setEditMode('update')
    setEditDraft(draft)
    form.setFieldsValue(draft)
    setEditOpen(true)
  }

  /** 保存技能（新建或更新） */
  const handleSave = async (): Promise<void> => {
    try {
      const values = await form.validateFields()
      if (!isValidSkillId(values.id)) {
        message.error('技能 id 仅允许小写字母、数字和连字符')
        return
      }
      setSaving(true)
      await saveSkill({
        ...values,
        examplesContent: values.examplesContent?.trim() || undefined
      })
      message.success(editMode === 'create' ? '技能已创建' : '技能已更新')
      setEditOpen(false)
      setEditDraft(null)
    } catch (err) {
      if (err instanceof Error && err.message) {
        message.error(err.message)
      }
    } finally {
      setSaving(false)
    }
  }

  /** 删除当前技能 */
  const handleDelete = async (id: string): Promise<void> => {
    try {
      await removeSkill(id)
      message.success('技能已删除')
    } catch (err) {
      message.error(err instanceof Error ? err.message : '删除失败')
    }
  }

  /** 打开模板安装弹窗 */
  const openTemplateModal = async (): Promise<void> => {
    setTemplateOpen(true)
    setTemplateLoading(true)
    try {
      const list = await loadTemplates()
      const ids: Record<string, string> = {}
      for (const t of list) {
        ids[t.id] = t.id
      }
      setInstallTargetIds(ids)
    } finally {
      setTemplateLoading(false)
    }
  }

  /** 安装指定模板 */
  const handleInstall = async (template: SkillTemplate): Promise<void> => {
    const targetId = installTargetIds[template.id]?.trim() || template.id
    if (!isValidSkillId(targetId)) {
      message.error('目标 id 格式无效')
      return
    }
    setInstallingId(template.id)
    try {
      await installTemplate(template.id, targetId)
      message.success(`已安装技能「${template.name}」`)
      setTemplateOpen(false)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '安装失败')
    } finally {
      setInstallingId(null)
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            技能市场
          </Title>
          <Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 0 }}>
            管理项目 <Text code>.cursor/skills</Text>，已启用 {enabledCount}/{skills.length}{' '}
            个技能会注入 Agent 系统提示
          </Paragraph>
        </div>
        <Space wrap>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新建技能
          </Button>
          <Button icon={<AppstoreOutlined />} onClick={() => void openTemplateModal()}>
            从模板安装
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={async () => {
              await refresh()
              message.success('已刷新')
            }}
          >
            刷新
          </Button>
        </Space>
      </header>

      <div className={styles.body}>
        <aside className={styles.sidebar}>
          {loading && skills.length === 0 ? (
            <div className={styles.loading}>
              <Spin />
            </div>
          ) : skills.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="暂无技能，可新建或从模板安装"
            />
          ) : (
            skills.map((skill) => (
              <button
                key={skill.id}
                type="button"
                className={styles.skillItem}
                data-active={skill.id === activeSkillId}
                onClick={() => void setActive(skill.id)}
              >
                <div className={styles.skillItemTop}>
                  <ThunderboltOutlined className={styles.skillIcon} />
                  <span className={styles.skillName}>{skill.name}</span>
                </div>
                <div className={styles.skillMeta}>
                  <Tag color={skill.enabled ? 'blue' : 'default'} style={{ margin: 0 }}>
                    {skill.enabled ? '已启用' : '已关闭'}
                  </Tag>
                  {skill.isBuiltin ? <Tag color="gold" style={{ margin: 0 }}>内置</Tag> : null}
                  {skill.hasExamples ? <Tag style={{ margin: 0 }}>含示例</Tag> : null}
                </div>
              </button>
            ))
          )}
        </aside>

        <main className={styles.main}>
          {!detail ? (
            <Empty description="选择左侧技能查看详情，或新建/安装技能" />
          ) : (
            <>
              <div className={styles.detailHeader}>
                <div>
                  <Title level={4} style={{ margin: 0 }}>
                    {detail.name}
                  </Title>
                  <Text type="secondary" code>
                    {detail.id}
                  </Text>
                </div>
                <Space wrap>
                  <Button icon={<EditOutlined />} onClick={openEdit}>
                    编辑
                  </Button>
                  <Popconfirm
                    title={
                      detail.isBuiltin
                        ? '这是项目内置技能，删除可能影响 Agent 行为，确定删除？'
                        : '确定删除该技能？'
                    }
                    onConfirm={() => void handleDelete(detail.id)}
                  >
                    <Button danger icon={<DeleteOutlined />}>
                      删除
                    </Button>
                  </Popconfirm>
                  <Text type="secondary">注入 Agent</Text>
                  <Switch
                    checked={detail.enabled}
                    onChange={(v) => void toggleEnabled(detail.id, v)}
                  />
                </Space>
              </div>

              {detail.description ? (
                <Paragraph className={styles.description}>{detail.description}</Paragraph>
              ) : null}

              <div className={styles.markdown}>
                <SkillMarkdown source={detail.content} />
              </div>

              {detail.examplesContent ? (
                <div className={styles.examples}>
                  <Title level={5}>示例</Title>
                  <SkillMarkdown source={detail.examplesContent} />
                </div>
              ) : null}
            </>
          )}
        </main>
      </div>

      {/* 新建 / 编辑技能 */}
      <Modal
        title={editMode === 'create' ? '新建技能' : '编辑技能'}
        open={editOpen}
        onCancel={() => {
          setEditOpen(false)
          setEditDraft(null)
        }}
        onOk={() => void handleSave()}
        confirmLoading={saving}
        width={720}
        destroyOnClose
      >
        <Form form={form} layout="vertical" initialValues={editDraft ?? undefined}>
          <Form.Item
            name="id"
            label="技能 ID（目录名）"
            rules={[
              { required: true, message: '请输入技能 id' },
              {
                validator: (_, value: string) =>
                  isValidSkillId(value) ? Promise.resolve() : Promise.reject(new Error('格式无效'))
              }
            ]}
            extra="仅小写字母、数字、连字符，如 my-xhs-skill"
          >
            <Input disabled={editMode === 'update'} placeholder="my-skill" />
          </Form.Item>
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input
              placeholder="技能展示名称"
              onChange={(e) => {
                if (editMode === 'create') {
                  const slug = slugifySkillId(e.target.value)
                  form.setFieldValue('id', slug)
                }
              }}
            />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入描述' }]}
            extra="Agent 用此描述判断何时启用该技能"
          >
            <Input.TextArea rows={2} placeholder="描述技能用途与触发场景" />
          </Form.Item>
          <Form.Item
            name="content"
            label="正文（Markdown）"
            rules={[{ required: true, message: '请输入正文' }]}
          >
            <Input.TextArea rows={12} placeholder="# 技能标题&#10;&#10;## 步骤..." />
          </Form.Item>
          <Form.Item name="examplesContent" label="示例（可选，Markdown）">
            <Input.TextArea rows={6} placeholder="# 示例&#10;..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* 模板安装 */}
      <Modal
        title="从模板安装"
        open={templateOpen}
        onCancel={() => setTemplateOpen(false)}
        footer={null}
        width={640}
        destroyOnClose
      >
        {templateLoading ? (
          <div className={styles.loading}>
            <Spin tip="加载模板..." />
          </div>
        ) : templates.length === 0 ? (
          <Empty description="未找到内置模板（resources/skill-templates）" />
        ) : (
          <div className={styles.templateList}>
            {templates.map((template) => (
              <Card key={template.id} size="small" className={styles.templateCard}>
                <div className={styles.templateCardHeader}>
                  <div>
                    <Text strong>{template.name}</Text>
                    <br />
                    <Text type="secondary" code style={{ fontSize: 12 }}>
                      {template.id}
                    </Text>
                  </div>
                  <Button
                    type="primary"
                    size="small"
                    loading={installingId === template.id}
                    onClick={() => void handleInstall(template)}
                  >
                    安装
                  </Button>
                </div>
                {template.description ? (
                  <Paragraph type="secondary" style={{ margin: '8px 0' }}>
                    {template.description}
                  </Paragraph>
                ) : null}
                <Input
                  size="small"
                  addonBefore="目标 ID"
                  value={installTargetIds[template.id] ?? template.id}
                  onChange={(e) =>
                    setInstallTargetIds((prev) => ({
                      ...prev,
                      [template.id]: e.target.value
                    }))
                  }
                  placeholder={template.id}
                />
              </Card>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}
