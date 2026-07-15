import type {
  ProjectSkill,
  SkillImportPreview,
  SkillTemplate,
  SkillUpsertInput
} from '@shared/types'
import { parseSkillImportJson } from '@shared/skill-import-json'
import { queryProjectSkillDetail } from '../../api'
import { useSkillsStore } from '../../hooks/useSkillsStore'
import { SkillMarkdown } from '../SkillMarkdown'
import { isValidSkillId, skillDetailToInput, slugifySkillId } from '../../types'
import { DB_THEME } from '@/styles/theme-tokens'
import styles from './SkillsPage.module.css'

const { Title, Text } = Typography

/** 主 Tab：活跃 / 已归档 / 市场模板 / 我的技能 */
type SkillTab = 'active' | 'archived' | 'market' | 'mine'

/** 二级筛选：全部 / 平台内置 / 自定义 */
type SkillScope = 'all' | 'platform' | 'custom'

/** 排序方式 */
type SkillSort = 'name_asc' | 'name_desc' | 'updated_desc'

/** 按关键词匹配技能名称、描述或 id */
function matchSkillQuery(skill: ProjectSkill, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    skill.name.toLowerCase().includes(q) ||
    skill.description.toLowerCase().includes(q) ||
    skill.id.toLowerCase().includes(q)
  )
}

/** 按关键词匹配模板 */
function matchTemplateQuery(template: SkillTemplate, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    template.name.toLowerCase().includes(q) ||
    template.description.toLowerCase().includes(q) ||
    template.id.toLowerCase().includes(q)
  )
}

/** 技能列表排序 */
function sortSkills(list: ProjectSkill[], sort: SkillSort): ProjectSkill[] {
  const next = [...list]
  switch (sort) {
    case 'name_desc':
      return next.sort((a, b) => b.name.localeCompare(a.name, 'zh-CN'))
    case 'updated_desc':
      return next.sort((a, b) => b.updatedAt - a.updatedAt)
    default:
      return next.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
  }
}

/** 模板列表排序 */
function sortTemplates(list: SkillTemplate[], sort: SkillSort): SkillTemplate[] {
  const next = [...list]
  if (sort === 'name_desc') {
    return next.sort((a, b) => b.name.localeCompare(a.name, 'zh-CN'))
  }
  return next.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
}

/** 技能卡片状态标签：未启用显示草稿，已启用显示状态 */
function SkillStatusTag({ skill }: { skill: ProjectSkill }): React.ReactElement {
  if (!skill.enabled) {
    return <Tag className={styles.tagDraft}>草稿</Tag>
  }
  return <Tag color="success">已启用</Tag>
}

/** 技能市场：卡片网格浏览、筛选、详情弹窗与新建/编辑抽屉 CRUD */
export function SkillsPage(): React.ReactElement {
  const skills = useSkillsStore((s) => s.skills)
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
  const importFromJson = useSkillsStore((s) => s.importFromJson)

  const [tab, setTab] = useState<SkillTab>('active')
  const [scope, setScope] = useState<SkillScope>('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SkillSort>('name_asc')

  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)

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
  /** 本地 JSON 解析结果；URL JSON 导入时为 null（确认时由主进程再拉取） */
  const [importJsonDrafts, setImportJsonDrafts] = useState<SkillUpsertInput[] | null>(null)
  const [importPreviewing, setImportPreviewing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const importFileInputRef = useRef<HTMLInputElement>(null)

  const [form] = Form.useForm<SkillUpsertInput>()

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  /** 切换到市场 Tab 时预加载模板列表 */
  useEffect(() => {
    if (tab !== 'market') return
    void loadTemplates()
  }, [tab, loadTemplates])

  /** 当前 Tab 下的技能数量（用于标题 Badge） */
  const tabCount = useMemo(() => {
    if (tab === 'market') return templates.length
    if (tab === 'active') return skills.filter((s) => s.enabled).length
    if (tab === 'archived') return skills.filter((s) => !s.enabled).length
    return skills.filter((s) => !s.isBuiltin).length
  }, [tab, skills, templates])

  /** 经过 Tab、范围、搜索、排序后的技能列表 */
  const filteredSkills = useMemo(() => {
    let list = skills
    if (tab === 'active') list = list.filter((s) => s.enabled)
    else if (tab === 'archived') list = list.filter((s) => !s.enabled)
    else if (tab === 'mine') list = list.filter((s) => !s.isBuiltin)

    if (scope === 'platform') list = list.filter((s) => s.isBuiltin)
    else if (scope === 'custom') list = list.filter((s) => !s.isBuiltin)

    list = list.filter((s) => matchSkillQuery(s, search))
    return sortSkills(list, sort)
  }, [skills, tab, scope, search, sort])

  /** 市场模板列表（搜索 + 排序） */
  const filteredTemplates = useMemo(() => {
    let list = templates.filter((t) => matchTemplateQuery(t, search))
    if (scope === 'platform') {
      // 模板均为平台内置，custom 时为空
      list = list
    } else if (scope === 'custom') {
      list = []
    }
    return sortTemplates(list, sort)
  }, [templates, search, sort, scope])

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

  /** 点击卡片：加载详情并打开抽屉 */
  const openSkillDetail = async (skillId: string): Promise<void> => {
    setDetailOpen(true)
    setDetailLoading(true)
    try {
      await setActive(skillId)
    } finally {
      setDetailLoading(false)
    }
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
      setDetailOpen(false)
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
      setTab('mine')
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
    setImportJsonDrafts(null)
    setImportOpen(true)
  }

  /** 从本地 .json 文件预览（解析后暂存在 importJsonDrafts） */
  const handleImportJsonFile = async (file: File): Promise<void> => {
    setImportPreviewing(true)
    setImportPreview(null)
    setImportJsonDrafts(null)
    try {
      const text = await file.text()
      const items = parseSkillImportJson(text)
      const first = items[0]
      setImportJsonDrafts(items)
      setImportUrl('')
      setImportTargetId(first.id)
      setImportPreview({
        url: '',
        method: 'json',
        skillMdUrl: file.name,
        suggestedId: first.id,
        name: items.length === 1 ? first.name : `${items.length} 个技能`,
        description:
          items.length === 1 ? first.description : items.map((s) => s.name).join('、'),
        hasExamples: items.some((s) => Boolean(s.examplesContent?.trim())),
        reasoning: `本地文件「${file.name}」`,
        jsonItems: items.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          hasExamples: Boolean(s.examplesContent?.trim())
        }))
      })
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'JSON 解析失败')
    } finally {
      setImportPreviewing(false)
      if (importFileInputRef.current) {
        importFileInputRef.current.value = ''
      }
    }
  }

  const handleImportPreview = async (): Promise<void> => {
    const url = importUrl.trim()
    if (!url) {
      message.warning('请输入技能链接，或选择本地 JSON 文件')
      return
    }
    setImportPreviewing(true)
    setImportPreview(null)
    setImportJsonDrafts(null)
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
    const jsonCount = importJsonDrafts?.length ?? importPreview?.jsonItems?.length ?? 0
    const isJsonMulti = importPreview?.method === 'json' && jsonCount > 1
    const normalizedId = slugifySkillId(
      importTargetId.trim() || importPreview?.suggestedId || ''
    )

    if (!importJsonDrafts && !importUrl.trim()) {
      message.warning('请输入技能链接，或选择本地 JSON 文件')
      return Promise.reject(new Error('validation'))
    }
    if (!isJsonMulti && (!normalizedId || !isValidSkillId(normalizedId))) {
      message.error('目标 id 格式无效，请使用小写字母、数字和连字符')
      return Promise.reject(new Error('validation'))
    }

    setImporting(true)
    try {
      if (importJsonDrafts) {
        await importFromJson(
          importJsonDrafts,
          isJsonMulti ? undefined : normalizedId
        )
        message.success(
          importJsonDrafts.length === 1
            ? `已导入技能「${importPreview?.name ?? normalizedId}」`
            : `已导入 ${importJsonDrafts.length} 个技能`
        )
      } else {
        await importFromUrl(importUrl.trim(), isJsonMulti ? undefined : normalizedId)
        message.success(
          importPreview?.method === 'json' && (importPreview.jsonItems?.length ?? 0) > 1
            ? `已导入 ${importPreview.jsonItems?.length} 个技能`
            : `已导入技能「${importPreview?.name ?? normalizedId}」`
        )
      }
      setImportOpen(false)
      setTab('mine')
    } catch (err) {
      message.error(err instanceof Error ? err.message : '导入失败')
      return Promise.reject(err instanceof Error ? err : new Error('import failed'))
    } finally {
      setImporting(false)
    }
  }

  /** 导出完整技能 JSON（含 content，可再导入） */
  const handleExport = async (): Promise<void> => {
    if (skills.length === 0) {
      message.warning('暂无技能可导出')
      return
    }
    setExporting(true)
    try {
      const details = await Promise.all(skills.map((s) => queryProjectSkillDetail(s.id)))
      const payload = details
        .filter((d): d is NonNullable<typeof d> => Boolean(d))
        .map((d) => ({
          id: d.id,
          name: d.name,
          description: d.description,
          content: d.content,
          examplesContent: d.examplesContent
        }))
      if (payload.length === 0) {
        message.error('未能读取技能正文')
        return
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `skills-export-${Date.now()}.json`
      anchor.click()
      URL.revokeObjectURL(url)
      message.success(`已导出 ${payload.length} 个技能（完整 JSON）`)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '导出失败')
    } finally {
      setExporting(false)
    }
  }

  const importBusy = importing || importPreviewing
  const importJsonMulti =
    importPreview?.method === 'json' && (importPreview.jsonItems?.length ?? 0) > 1
  const importLoadingTip = importing
    ? importPreview?.method === 'git_clone'
      ? '正在 git clone 并安装技能，请稍候…'
      : importPreview?.method === 'http_download'
        ? '正在下载并安装技能，请稍候…'
        : importPreview?.method === 'json'
          ? '正在写入 JSON 技能，请稍候…'
          : '正在导入技能，请稍候…'
    : '正在分析并预览技能…'

  return (
    <div className={styles.page}>
      {/* 顶栏：标题 + 全局操作 */}
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <div className={styles.headerIcon}>
            <ThunderboltOutlined />
          </div>
          <div>
            <div className={styles.titleRow}>
              <Title level={3} className={styles.title}>
                技能
              </Title>
              <span className={styles.countBadge}>{skills.length}</span>
            </div>
            <Text type="secondary" className={styles.desc}>
              将领域知识注入 Agent 系统提示
            </Text>
          </div>
        </div>
        <Space wrap>
          <Button icon={<ImportOutlined />} onClick={openImportModal}>
            导入
          </Button>
          <Button icon={<ExportOutlined />} loading={exporting} onClick={() => void handleExport()}>
            导出
          </Button>
          <Button icon={<DollarOutlined />} onClick={() => void openTemplateModal()}>
            智能整理
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            创建
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

      {/* 筛选栏：Tab + 范围 + 搜索 + 排序 */}
      <div className={styles.toolbar}>
        <Segmented
          value={tab}
          onChange={(v) => setTab(v as SkillTab)}
          options={[
            { label: '活跃技能', value: 'active' },
            { label: '已归档', value: 'archived' },
            { label: '市场', value: 'market' },
            { label: '我的', value: 'mine' }
          ]}
        />
        <Segmented
          value={scope}
          onChange={(v) => setScope(v as SkillScope)}
          options={[
            { label: '全部', value: 'all' },
            { label: '平台/公共', value: 'platform' },
            { label: '我的', value: 'custom' }
          ]}
        />
        <div className={styles.toolbarRight}>
          <span className={styles.resultCount}>{tabCount} 项</span>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索技能..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          <Select
            value={sort}
            onChange={setSort}
            className={styles.sortSelect}
            options={[
              { label: '名称 A→Z', value: 'name_asc' },
              { label: '名称 Z→A', value: 'name_desc' },
              { label: '最近更新', value: 'updated_desc' }
            ]}
          />
        </div>
      </div>

      {/* 卡片网格 */}
      <div className={styles.body}>
        <Spin spinning={loading && (tab === 'market' ? templates.length === 0 : skills.length === 0)}>
          {tab === 'market' ? (
            filteredTemplates.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={templateLoading ? '加载模板中…' : '暂无市场模板'}
                className={styles.empty}
              />
            ) : (
              <div className={styles.grid}>
                {filteredTemplates.map((template) => (
                  <Card key={template.id} variant="borderless" className={styles.card}>
                    <div className={styles.cardHead}>
                      <div className={styles.cardTitleRow}>
                        <span className={styles.cardTitle}>{template.name}</span>
                        <Tag color={DB_THEME.primary}>模板</Tag>
                      </div>
                      <p className={styles.cardDesc}>
                        {template.description || '暂无描述'}
                      </p>
                    </div>
                    <div className={styles.cardFooter}>
                      <span className={styles.cardAuthor}>@平台</span>
                      <Button
                        type="link"
                        size="small"
                        loading={installingId === template.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          void handleInstall(template)
                        }}
                      >
                        安装
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )
          ) : filteredSkills.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="暂无匹配的技能"
              className={styles.empty}
            >
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                创建技能
              </Button>
            </Empty>
          ) : (
            <div className={styles.grid}>
              {filteredSkills.map((skill) => (
                <Card
                  key={skill.id}
                  variant="borderless"
                  className={styles.card}
                  hoverable
                  onClick={() => void openSkillDetail(skill.id)}
                >
                  <div className={styles.cardHead}>
                    <div className={styles.cardTitleRow}>
                      <span className={styles.cardTitle}>{skill.name}</span>
                      <SkillStatusTag skill={skill} />
                    </div>
                    <p className={styles.cardDesc}>
                      {skill.description || '暂无描述'}
                    </p>
                  </div>
                  <div className={styles.cardFooter}>
                    <span className={styles.cardAuthor}>
                      {skill.isBuiltin ? '@平台' : '@你'}
                    </span>
                    <span className={styles.cardUsage}>0 次使用</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Spin>
      </div>

      {/* 技能详情抽屉 */}
      <Modal
        title={detail?.name ?? '技能详情'}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={760}
        destroyOnHidden
        className={styles.detailModal}
      >
        <Spin spinning={detailLoading}>
          {!detail ? (
            <Empty description="未找到技能详情" />
          ) : (
            <div className={styles.detailBody}>
              <div className={styles.detailHeader}>
                <div>
                  <code className={styles.detailId}>{detail.id}</code>
                  <div className={styles.detailTags}>
                    <SkillStatusTag skill={detail} />
                    {detail.isBuiltin ? <Tag color={DB_THEME.primary}>内置</Tag> : null}
                    {detail.hasExamples ? <Tag>含示例</Tag> : null}
                  </div>
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
                  <div className={styles.injectToggle}>
                    <span className={styles.injectLabel}>注入 Agent</span>
                    <Switch
                      checked={detail.enabled}
                      onChange={(v) => void toggleEnabled(detail.id, v)}
                    />
                  </div>
                </Space>
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
        </Spin>
      </Modal>

      {/* 新建 / 编辑：右侧抽屉（可从详情 Modal 叠开，故抬高 zIndex） */}
      <Drawer
        title={editMode === 'create' ? '新建技能' : '编辑技能'}
        placement="right"
        width="69vw"
        open={editOpen}
        onClose={() => {
          setEditOpen(false)
          setEditDraft(null)
        }}
        destroyOnHidden
        zIndex={1200}
        className={styles.editDrawer}
        footer={
          <div className={styles.editDrawerFooter}>
            <Button
              onClick={() => {
                setEditOpen(false)
                setEditDraft(null)
              }}
            >
              取消
            </Button>
            <Button type="primary" loading={saving} onClick={() => void handleSave()}>
              保存
            </Button>
          </div>
        }
      >
        <Form
          key={editDraft ? `${editMode}-${editDraft.id || 'new'}` : 'closed'}
          form={form}
          layout="vertical"
          initialValues={editDraft ?? undefined}
          disabled={saving}
        >
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
            <Input.TextArea rows={14} placeholder="# 技能标题&#10;&#10;## 步骤..." />
          </Form.Item>
          <Form.Item name="examplesContent" label="示例（可选，Markdown）">
            <Input.TextArea rows={6} placeholder="# 示例&#10;..." />
          </Form.Item>
        </Form>
      </Drawer>

      {/* 模板安装（智能整理） */}
      <Modal
        title="从模板安装"
        open={templateOpen}
        onCancel={() => setTemplateOpen(false)}
        footer={null}
        width={640}
        destroyOnHidden
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
                    <code className={styles.templateId}>{template.id}</code>
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
                  <p className={styles.templateDesc}>{template.description}</p>
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

      {/* 链接 / JSON 导入 */}
      <Modal
        title="导入技能"
        open={importOpen}
        onCancel={() => setImportOpen(false)}
        onOk={handleImportConfirm}
        okText="导入"
        confirmLoading={importing}
        closable={!importBusy}
        maskClosable={!importBusy}
        okButtonProps={{ disabled: importPreviewing || !importPreview }}
        cancelButtonProps={{ disabled: importBusy }}
        width={640}
        destroyOnHidden
      >
        <Spin spinning={importBusy} tip={importLoadingTip}>
          <div className={styles.importModalBody}>
            <p className={styles.modalHint}>
              支持 Git / HTTP 直链，以及技能 JSON（本地文件或以 <code>.json</code> 结尾的
              URL）。JSON 可为单个对象或数组，字段含{' '}
              <code>id / name / description / content</code>。
            </p>

            <input
              ref={importFileInputRef}
              type="file"
              accept="application/json,.json"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void handleImportJsonFile(file)
              }}
            />
            <Space wrap style={{ marginBottom: 16 }}>
              <Button
                icon={<ImportOutlined />}
                disabled={importBusy}
                onClick={() => importFileInputRef.current?.click()}
              >
                选择 JSON 文件
              </Button>
            </Space>

            <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
              <Input
                placeholder="Git / SKILL.md 链接，或 https://…/skills.json"
                value={importUrl}
                disabled={importBusy}
                onChange={(e) => {
                  setImportUrl(e.target.value)
                  setImportPreview(null)
                  setImportJsonDrafts(null)
                }}
                onPressEnter={() => void handleImportPreview()}
              />
              <Button
                loading={importPreviewing}
                disabled={importing}
                onClick={() => void handleImportPreview()}
              >
                预览
              </Button>
            </Space.Compact>

            {importPreview ? (
              <Card size="small" className={styles.importPreview}>
                <strong>{importPreview.name}</strong>
                {importPreview.description ? (
                  <p className={styles.importPreviewDesc}>{importPreview.description}</p>
                ) : null}
                <Space wrap size={4}>
                  <Tag
                    color={
                      importPreview.method === 'git_clone'
                        ? DB_THEME.primary
                        : importPreview.method === 'json'
                          ? 'processing'
                          : 'default'
                    }
                  >
                    {importPreview.method === 'git_clone'
                      ? 'Git Clone'
                      : importPreview.method === 'json'
                        ? 'JSON'
                        : 'HTTP 下载'}
                  </Tag>
                  {importPreview.hasExamples ? <Tag>含示例</Tag> : null}
                  <Tag color="success">可导入</Tag>
                </Space>
                {importPreview.reasoning ? (
                  <p className={styles.importReasoning}>{importPreview.reasoning}</p>
                ) : null}
                {importPreview.jsonItems && importPreview.jsonItems.length > 0 ? (
                  <ul className={styles.importJsonList}>
                    {importPreview.jsonItems.map((item) => (
                      <li key={item.id}>
                        <code>{item.id}</code> · {item.name}
                        {item.hasExamples ? '（含示例）' : ''}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </Card>
            ) : null}

            <Form layout="vertical" style={{ marginTop: 16 }}>
              <Form.Item
                label="目标 ID（安装目录名）"
                extra={
                  importJsonMulti
                    ? '多条 JSON 将使用各自的 id，此项不生效'
                    : '仅小写字母、数字、连字符；与 .cursor/skills/<id> 对应'
                }
                required={!importJsonMulti}
              >
                <Input
                  value={importTargetId}
                  disabled={importBusy || importJsonMulti}
                  onChange={(e) => setImportTargetId(slugifySkillId(e.target.value))}
                  placeholder="my-skill"
                />
              </Form.Item>
            </Form>
          </div>
        </Spin>
      </Modal>
    </div>
  )
}
