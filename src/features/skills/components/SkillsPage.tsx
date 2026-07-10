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
  message,
  Spin,
  Card,
  ConfigProvider
} from 'antd'
import {
  AppstoreOutlined,
  DeleteOutlined,
  EditOutlined,
  LinkOutlined,
  PlusOutlined,
  ReloadOutlined,
  ThunderboltOutlined
} from '@ant-design/icons'
import type { SkillImportPreview, SkillTemplate, SkillUpsertInput } from '@shared/types'
import { useSkillsStore } from '../hooks/useSkillsStore'
import { SkillMarkdown } from './SkillMarkdown'
import { isValidSkillId, skillDetailToInput, slugifySkillId } from '../types'
import styles from './SkillsPage.module.css'

/** 技能市场：浏览、新建、编辑、删除 .cursor/skills 项目技能，支持模板与链接导入 */
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
  const previewImport = useSkillsStore((s) => s.previewImport)
  const importFromUrl = useSkillsStore((s) => s.importFromUrl)

  const [editOpen, setEditOpen] = useState(false)
  const [editMode, setEditMode] = useState<'create' | 'update'>('create')
  const [editDraft, setEditDraft] = useState<SkillUpsertInput | null>(null)
  const [saving, setSaving] = useState(false)

  const [templateOpen, setTemplateOpen] = useState(false)
  const [templateLoading, setTemplateLoading] = useState(false)
  const [installingId, setInstallingId] = useState<string | null>(null)
  const [installTargetIds, setInstallTargetIds] = useState<Record<string, string>>({})

  const [importOpen, setImportOpen] = useState(false)
  const [importUrl, setImportUrl] = useState('')
  const [importTargetId, setImportTargetId] = useState('')
  const [importPreview, setImportPreview] = useState<SkillImportPreview | null>(null)
  const [importPreviewing, setImportPreviewing] = useState(false)
  const [importing, setImporting] = useState(false)

  const [form] = Form.useForm<SkillUpsertInput>()

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  const enabledCount = skills.filter((s) => s.enabled).length

  const openCreate = (): void => {
    const draft = createSkillDraft()
    setEditMode('create')
    setEditDraft(draft)
    form.setFieldsValue(draft)
    setEditOpen(true)
  }

  const openEdit = (): void => {
    if (!detail) return
    const draft = skillDetailToInput(detail)
    setEditMode('update')
    setEditDraft(draft)
    form.setFieldsValue(draft)
    setEditOpen(true)
  }

  const handleSave = async (): Promise<void> => {
    try {
      const values = await form.validateFields()
      const normalizedId = slugifySkillId(values.id)
      if (!isValidSkillId(normalizedId)) {
        message.error('技能 id 仅允许小写字母、数字和连字符')
        return Promise.reject(new Error('validation'))
      }
      setSaving(true)
      await saveSkill({
        ...values,
        id: normalizedId,
        examplesContent: values.examplesContent?.trim() || undefined
      })
      message.success(editMode === 'create' ? '技能已创建' : '技能已更新')
      setEditOpen(false)
      setEditDraft(null)
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
      await removeSkill(id)
      message.success('技能已删除')
    } catch (err) {
      message.error(err instanceof Error ? err.message : '删除失败')
    }
  }

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

  const openImportModal = (): void => {
    setImportUrl('')
    setImportTargetId('')
    setImportPreview(null)
    setImportOpen(true)
  }

  const handleImportPreview = async (): Promise<void> => {
    const url = importUrl.trim()
    if (!url) {
      message.warning('请输入技能链接')
      return
    }
    setImportPreviewing(true)
    setImportPreview(null)
    try {
      const preview = await previewImport(url)
      setImportPreview(preview)
      setImportTargetId(preview.suggestedId)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '预览失败')
    } finally {
      setImportPreviewing(false)
    }
  }

  const handleImportConfirm = async (): Promise<void> => {
    const url = importUrl.trim()
    const normalizedId = slugifySkillId(
      importTargetId.trim() || importPreview?.suggestedId || ''
    )
    if (!url) {
      message.warning('请输入技能链接')
      return Promise.reject(new Error('validation'))
    }
    if (!normalizedId || !isValidSkillId(normalizedId)) {
      message.error('目标 id 格式无效，请使用小写字母、数字和连字符')
      return Promise.reject(new Error('validation'))
    }
    setImporting(true)
    try {
      await importFromUrl(url, normalizedId)
      message.success(`已导入技能「${importPreview?.name ?? normalizedId}」`)
      setImportOpen(false)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '导入失败')
      return Promise.reject(err instanceof Error ? err : new Error('import failed'))
    } finally {
      setImporting(false)
    }
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#c9920a',
          borderRadius: 10
        }
      }}
    >
      <div className={styles.page}>
        {/* 顶栏 */}
        <header className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.heroText}>
              <span className={styles.eyebrow}>
                <ThunderboltOutlined /> Agent Skills
              </span>
              <h1 className={styles.title}>技能市场</h1>
              <p className={styles.subtitle}>
                管理项目 <code>.cursor/skills</code>，将领域知识注入 Agent 系统提示，减少重复探索
              </p>
              <div className={styles.stats}>
                <div className={styles.statPill}>
                  <span className={`${styles.statValue} ${styles.statValueActive}`}>
                    {enabledCount}
                  </span>
                  <span className={styles.statLabel}>已启用</span>
                </div>
                <div className={styles.statPill}>
                  <span className={styles.statValue}>{skills.length}</span>
                  <span className={styles.statLabel}>全部技能</span>
                </div>
              </div>
            </div>

            <div className={styles.actions}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                className={styles.actionPrimary}
                onClick={openCreate}
              >
                新建技能
              </Button>
              <Button icon={<AppstoreOutlined />} onClick={() => void openTemplateModal()}>
                从模板安装
              </Button>
              <Button icon={<LinkOutlined />} onClick={openImportModal}>
                从链接导入
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
            </div>
          </div>
        </header>

        {/* 目录 + 详情 */}
        <div className={styles.workspace}>
          <aside className={styles.catalog}>
            <div className={styles.catalogHeader}>
              <span className={styles.catalogTitle}>技能目录</span>
              <span className={styles.catalogCount}>{skills.length}</span>
            </div>
            <div className={styles.catalogList}>
              {loading && skills.length === 0 ? (
                <div className={styles.loading}>
                  <Spin />
                </div>
              ) : skills.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="暂无技能"
                  style={{ marginTop: 32 }}
                />
              ) : (
                skills.map((skill) => (
                  <button
                    key={skill.id}
                    type="button"
                    className={styles.skillCard}
                    data-active={skill.id === activeSkillId}
                    onClick={() => void setActive(skill.id)}
                  >
                    <div className={styles.skillCardTop}>
                      <span className={styles.skillIconWrap}>
                        <ThunderboltOutlined />
                      </span>
                      <div>
                        <div className={styles.skillName}>{skill.name}</div>
                        <div className={styles.skillId}>{skill.id}</div>
                      </div>
                    </div>
                    <div className={styles.skillMeta}>
                      <Tag className={skill.enabled ? styles.tagEnabled : styles.tagDisabled}>
                        {skill.enabled ? '已启用' : '已关闭'}
                      </Tag>
                      {skill.isBuiltin ? (
                        <Tag className={styles.tagBuiltin}>内置</Tag>
                      ) : null}
                      {skill.hasExamples ? (
                        <Tag className={styles.tagMuted}>含示例</Tag>
                      ) : null}
                    </div>
                  </button>
                ))
              )}
            </div>
          </aside>

          <section className={styles.detailPanel} key={activeSkillId ?? 'empty'}>
            {!detail ? (
              <div className={styles.detailEmpty}>
                <div className={styles.emptyIcon}>
                  <ThunderboltOutlined />
                </div>
                <h2 className={styles.emptyTitle}>选择或创建一个技能</h2>
                <p className={styles.emptyHint}>
                  从左侧目录选择技能查看详情，或通过新建、模板、链接导入扩展 Agent 能力
                </p>
              </div>
            ) : (
              <div className={styles.detailScroll}>
                <div className={styles.detailHeader}>
                  <div>
                    <h2 className={styles.detailTitle}>{detail.name}</h2>
                    <code className={styles.detailId}>{detail.id}</code>
                  </div>
                  <div className={styles.detailActions}>
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
                    <div className={styles.injectToggle}>
                      <span className={styles.injectLabel}>注入 Agent</span>
                      <Switch
                        checked={detail.enabled}
                        onChange={(v) => void toggleEnabled(detail.id, v)}
                      />
                    </div>
                  </div>
                </div>

                {detail.description ? (
                  <p className={styles.description}>{detail.description}</p>
                ) : null}

                <div className={styles.markdown}>
                  <SkillMarkdown source={detail.content} />
                </div>

                {detail.examplesContent ? (
                  <div className={styles.examples}>
                    <h3 className={styles.sectionLabel}>示例</h3>
                    <SkillMarkdown source={detail.examplesContent} />
                  </div>
                ) : null}
              </div>
            )}
          </section>
        </div>

        {/* 新建 / 编辑 */}
        <Modal
          title={editMode === 'create' ? '新建技能' : '编辑技能'}
          open={editOpen}
          onCancel={() => {
            setEditOpen(false)
            setEditDraft(null)
          }}
          onOk={handleSave}
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
                    form.setFieldValue('id', slugifySkillId(e.target.value))
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
                      <strong>{template.name}</strong>
                      <br />
                      <code style={{ fontSize: 12, color: 'var(--skill-muted)' }}>
                        {template.id}
                      </code>
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
                    <p style={{ margin: '8px 0', fontSize: 13, color: 'var(--skill-muted)' }}>
                      {template.description}
                    </p>
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

        {/* 链接导入 */}
        <Modal
          title="从链接导入"
          open={importOpen}
          onCancel={() => setImportOpen(false)}
          onOk={handleImportConfirm}
          okText="导入"
          confirmLoading={importing}
          width={640}
          destroyOnClose
        >
          <p className={styles.modalHint}>
            支持 GitHub 仓库、tree/blob 链接及 raw 直链。仓库链接会自动查找{' '}
            <code>SKILL.md</code>。
          </p>
          <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
            <Input
              placeholder="https://github.com/white0dew/XiaohongshuSkills"
              value={importUrl}
              onChange={(e) => {
                setImportUrl(e.target.value)
                setImportPreview(null)
              }}
              onPressEnter={() => void handleImportPreview()}
            />
            <Button loading={importPreviewing} onClick={() => void handleImportPreview()}>
              预览
            </Button>
          </Space.Compact>

          {importPreview ? (
            <Card size="small" className={styles.importPreview}>
              <strong>{importPreview.name}</strong>
              {importPreview.description ? (
                <p style={{ margin: '8px 0', fontSize: 13, color: 'var(--skill-muted)' }}>
                  {importPreview.description}
                </p>
              ) : null}
              <Space wrap size={4}>
                {importPreview.hasExamples ? <Tag>含示例</Tag> : null}
                <Tag color="success">远程可用</Tag>
              </Space>
            </Card>
          ) : null}

          <Form layout="vertical" style={{ marginTop: 16 }}>
            <Form.Item
              label="目标 ID（安装目录名）"
              extra="仅小写字母、数字、连字符；与 .cursor/skills/<id> 对应"
              required
            >
              <Input
                value={importTargetId}
                onChange={(e) => setImportTargetId(slugifySkillId(e.target.value))}
                placeholder="my-skill"
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </ConfigProvider>
  )
}
