import type { CSSProperties } from 'react'
import type {
  RemotionTemplateDetail,
  RemotionTemplateOrigin,
  RemotionTemplateSummary
} from '@shared/remotion-template'
import { isValidSkillId, slugifySkillId } from '@/features/skills/types'
import {
  FeaturePageShell,
  FeaturePageHeader,
  FeaturePageToolbar,
  FeatureScrollBody,
  shellStyles
} from '@/components/page-shell'
import cardStyles from '@/components/entity-card'
import {
  postDeleteRemotionTemplate,
  postDuplicateRemotionTemplate,
  postImportRemotionTemplateFromUrl,
  postUpdateRemotionTemplateMeta,
  queryRemotionTemplateDetail,
  queryRemotionTemplateList
} from '../api'
import styles from './RemotionTemplatesPage.module.css'

const { Text } = Typography

type OriginFilter = 'all' | RemotionTemplateOrigin

const ORIGIN_LABEL: Record<RemotionTemplateOrigin, string> = {
  bundled: '内置',
  local: '本地',
  remote: '远程导入',
  'skill-bound': '技能附属',
  'from-chat': '聊天保存'
}

/** 来源 Tag 样式：对齐技能页内置 / 自定义区分 */
function OriginTag({ origin }: { origin: RemotionTemplateOrigin }): React.ReactElement {
  if (origin === 'bundled') {
    return <Tag className={cardStyles.mutedTag}>{ORIGIN_LABEL[origin]}</Tag>
  }
  if (origin === 'from-chat' || origin === 'local') {
    return <Tag className={cardStyles.successTag}>{ORIGIN_LABEL[origin]}</Tag>
  }
  if (origin === 'remote') {
    return <Tag className={cardStyles.primaryTag}>{ORIGIN_LABEL[origin]}</Tag>
  }
  return <Tag className={cardStyles.neutralTag}>{ORIGIN_LABEL[origin]}</Tag>
}

/** 画幅方向：用于卡片角标 */
function queryAspectKind(
  width?: number,
  height?: number
): 'landscape' | 'portrait' | 'square' | 'unknown' {
  if (!width || !height) return 'unknown'
  if (width === height) return 'square'
  return width > height ? 'landscape' : 'portrait'
}

function AspectBadge({
  width,
  height
}: {
  width?: number
  height?: number
}): React.ReactElement {
  const kind = queryAspectKind(width, height)
  const frameClass =
    kind === 'portrait'
      ? styles.aspectFramePortrait
      : kind === 'square'
        ? styles.aspectFrameSquare
        : styles.aspectFrameLandscape
  return (
    <span className={styles.aspectBadge}>
      <span className={`${styles.aspectFrame} ${frameClass}`} aria-hidden />
      {width && height ? `${width}×${height}` : '画幅未设'}
    </span>
  )
}

interface EditFormValues {
  name: string
  description?: string
  tags?: string
  compositionId?: string
  width?: number
  height?: number
  fps?: number
  durationInFrames?: number
  defaultPropsJson?: string
}

/**
 * Remotion 视频模板维护页：列表、详情、编辑 meta、复制内置、导入/删除。
 */
export function RemotionTemplatesPage(): React.ReactElement {
  const [list, setList] = useState<RemotionTemplateSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [originFilter, setOriginFilter] = useState<OriginFilter>('all')

  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<RemotionTemplateDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [editOpen, setEditOpen] = useState(false)
  const [editTemplateId, setEditTemplateId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [editForm] = Form.useForm<EditFormValues>()

  const [importOpen, setImportOpen] = useState(false)
  const [importUrl, setImportUrl] = useState('')
  const [importTargetId, setImportTargetId] = useState('')
  const [importing, setImporting] = useState(false)

  const [dupOpen, setDupOpen] = useState(false)
  const [dupSource, setDupSource] = useState<RemotionTemplateSummary | null>(null)
  const [dupTargetId, setDupTargetId] = useState('')
  const [dupName, setDupName] = useState('')
  const [duplicating, setDuplicating] = useState(false)

  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const items = await queryRemotionTemplateList({
        query: search.trim() || undefined,
        origin: originFilter === 'all' ? undefined : originFilter
      })
      setList(items)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '加载模板失败')
    } finally {
      setLoading(false)
    }
  }, [search, originFilter])

  useEffect(() => {
    void load()
  }, [load])

  const openDetail = async (templateId: string): Promise<void> => {
    setDetailOpen(true)
    setDetailLoading(true)
    setDetail(null)
    try {
      const d = await queryRemotionTemplateDetail(templateId)
      setDetail(d)
      if (!d) message.warning('模板不存在或已删除')
    } catch (err) {
      message.error(err instanceof Error ? err.message : '读取详情失败')
    } finally {
      setDetailLoading(false)
    }
  }

  const openEdit = async (template: RemotionTemplateSummary): Promise<void> => {
    try {
      const d = await queryRemotionTemplateDetail(template.id)
      if (!d) {
        message.error('模板不存在')
        return
      }
      if (!d.editable) {
        message.info('内置模板请先「复制为可编辑副本」再编辑')
        openDuplicate(template)
        return
      }
      setEditTemplateId(d.id)
      editForm.setFieldsValue({
        name: d.name,
        description: d.description,
        tags: (d.tags ?? []).join(', '),
        compositionId: d.compositionId ?? 'Main',
        width: d.width,
        height: d.height,
        fps: d.fps,
        durationInFrames: d.durationInFrames,
        defaultPropsJson: JSON.stringify(d.defaultProps ?? {}, null, 2)
      })
      setEditOpen(true)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '打开编辑失败')
    }
  }

  const handleSaveEdit = async (): Promise<void> => {
    if (!editTemplateId) return
    try {
      const values = await editForm.validateFields()
      let defaultProps: Record<string, unknown> | undefined
      if (values.defaultPropsJson?.trim()) {
        try {
          const parsed = JSON.parse(values.defaultPropsJson) as unknown
          if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            message.error('defaultProps 必须是 JSON 对象')
            return
          }
          defaultProps = parsed as Record<string, unknown>
        } catch {
          message.error('defaultProps JSON 格式无效')
          return
        }
      }
      setSaving(true)
      const tid = editTemplateId
      await postUpdateRemotionTemplateMeta({
        templateId: tid,
        name: values.name.trim(),
        description: values.description?.trim(),
        tags: (values.tags ?? '')
          .split(/[,，\s]+/)
          .map((t) => t.trim())
          .filter(Boolean),
        compositionId: values.compositionId?.trim(),
        width: values.width,
        height: values.height,
        fps: values.fps,
        durationInFrames: values.durationInFrames,
        defaultProps
      })
      message.success('已保存')
      setEditOpen(false)
      setEditTemplateId(null)
      await load()
      if (detailOpen && detail?.id === tid) {
        await openDetail(tid)
      }
    } catch (err) {
      if (err && typeof err === 'object' && 'errorFields' in err) return
      message.error(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const openDuplicate = (template: RemotionTemplateSummary): void => {
    setDupSource(template)
    setDupTargetId(slugifySkillId(`${template.id}-copy`))
    setDupName(`${template.name} 副本`)
    setDupOpen(true)
  }

  const handleDuplicate = async (): Promise<void> => {
    if (!dupSource) return
    const targetId = dupTargetId.trim()
    if (!isValidSkillId(targetId)) {
      message.warning('目标 id 仅允许小写字母、数字和连字符')
      return
    }
    setDuplicating(true)
    try {
      const created = await postDuplicateRemotionTemplate(
        dupSource.id,
        targetId,
        dupName.trim() || undefined
      )
      message.success(`已复制为「${created.name}」`)
      setDupOpen(false)
      setDupSource(null)
      await load()
      await openDetail(created.id)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '复制失败')
    } finally {
      setDuplicating(false)
    }
  }

  const handleImport = async (): Promise<void> => {
    const url = importUrl.trim()
    if (!url) {
      message.warning('请输入仓库链接')
      return
    }
    const targetId = importTargetId.trim()
    if (targetId && !isValidSkillId(targetId)) {
      message.warning('目标 id 仅允许小写字母、数字和连字符')
      return
    }
    setImporting(true)
    try {
      const installed = await postImportRemotionTemplateFromUrl(url, targetId || undefined)
      message.success(`已导入 ${installed.length} 个模板`)
      setImportOpen(false)
      setImportUrl('')
      setImportTargetId('')
      await load()
    } catch (err) {
      message.error(err instanceof Error ? err.message : '导入失败')
    } finally {
      setImporting(false)
    }
  }

  const handleDelete = (template: RemotionTemplateSummary): void => {
    if (template.origin === 'bundled') {
      message.info('内置模板不可删除')
      return
    }
    Modal.confirm({
      title: `删除模板「${template.name}」？`,
      content: '仅删除用户目录下的模板包，不可恢复。',
      okType: 'danger',
      onOk: async () => {
        setDeletingId(template.id)
        try {
          await postDeleteRemotionTemplate(template.id)
          message.success('已删除')
          if (detail?.id === template.id) {
            setDetailOpen(false)
            setDetail(null)
          }
          await load()
        } catch (err) {
          message.error(err instanceof Error ? err.message : '删除失败')
        } finally {
          setDeletingId(null)
        }
      }
    })
  }

  const handleReveal = async (dir: string): Promise<void> => {
    const result = await window.api.postRevealPath(dir)
    if (!result.ok) {
      message.error(result.error || '无法打开目录')
    }
  }

  return (
    <FeaturePageShell>
      <FeaturePageHeader
        icon={<VideoCameraOutlined />}
        title="视频模板"
        badge={list.length}
        description="浏览、编辑与导入 Remotion 模板；聊天中用 remotion_apply_template 一键出片"
        extra={
          <Space wrap>
            <Button type="primary" icon={<ImportOutlined />} onClick={() => setImportOpen(true)}>
              导入
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={async () => {
                await load()
                message.success('已刷新')
              }}
            >
              刷新
            </Button>
          </Space>
        }
      />

      <FeaturePageToolbar>
        <Segmented
          value={originFilter}
          onChange={(v) => setOriginFilter(v as OriginFilter)}
          options={[
            { label: '全部', value: 'all' },
            { label: '内置', value: 'bundled' },
            { label: '本地', value: 'local' },
            { label: '远程', value: 'remote' },
            { label: '聊天', value: 'from-chat' },
            { label: '技能', value: 'skill-bound' }
          ]}
        />
        <div className={shellStyles.toolbarRight}>
          <span className={shellStyles.resultCount}>{list.length} 项</span>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索模板..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </FeaturePageToolbar>

      <FeatureScrollBody>
        <Spin spinning={loading && list.length === 0}>
          {list.length === 0 && !loading ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={search.trim() || originFilter !== 'all' ? '暂无匹配的模板' : '暂无视频模板'}
              className={styles.empty}
            >
              <Button type="primary" icon={<ImportOutlined />} onClick={() => setImportOpen(true)}>
                从 URL 导入
              </Button>
            </Empty>
          ) : (
            <div className={cardStyles.grid}>
              {list.map((template, index) => (
                <Card
                  key={template.id}
                  variant="borderless"
                  className={cardStyles.card}
                  style={{ '--card-index': index } as CSSProperties}
                >
                  <div className={cardStyles.cardHead}>
                    <div className={cardStyles.cardTitleBlock}>
                      <Text className={cardStyles.cardTitle} ellipsis={{ tooltip: template.name }}>
                        {template.name}
                      </Text>
                      <div className={cardStyles.tagRow}>
                        <OriginTag origin={template.origin} />
                        {template.hasSchema ? (
                          <Tag className={cardStyles.primaryTag}>可调参</Tag>
                        ) : null}
                        {template.overridesBundled ? (
                          <Tag className={cardStyles.warningTag}>覆盖内置</Tag>
                        ) : null}
                      </div>
                    </div>
                    <div className={cardStyles.cardActions}>
                      <Tooltip title="查看详情">
                        <Button
                          type="text"
                          size="small"
                          className={cardStyles.actionBtn}
                          icon={<EyeOutlined />}
                          aria-label={`查看模板 ${template.name}`}
                          onClick={() => void openDetail(template.id)}
                        />
                      </Tooltip>
                      <Tooltip title="编辑模板">
                        <Button
                          type="text"
                          size="small"
                          className={cardStyles.actionBtn}
                          icon={<EditOutlined />}
                          aria-label={`编辑模板 ${template.name}`}
                          onClick={() => void openEdit(template)}
                        />
                      </Tooltip>
                      <Tooltip title="复制模板">
                        <Button
                          type="text"
                          size="small"
                          className={cardStyles.actionBtn}
                          icon={<CopyOutlined />}
                          aria-label={`复制模板 ${template.name}`}
                          onClick={() => openDuplicate(template)}
                        />
                      </Tooltip>
                    </div>
                  </div>
                  <p className={cardStyles.cardDescription}>
                    {template.description || '暂无描述'}
                  </p>
                  <div className={cardStyles.cardFooter}>
                    <Text type="secondary" className={cardStyles.footerHint}>
                      {template.origin === 'bundled' ? '@平台' : '@你'}
                    </Text>
                    <Text type="secondary" className={cardStyles.metaLabel}>
                      {template.width ?? '?'}×{template.height ?? '?'}
                      {template.fps != null ? ` · ${template.fps}fps` : ''}
                    </Text>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Spin>
      </FeatureScrollBody>

      <Modal
        title={detail?.name ?? '模板详情'}
        open={detailOpen}
        onCancel={() => {
          setDetailOpen(false)
          setDetail(null)
        }}
        width={640}
        className={styles.detailModal}
        footer={
          detail ? (
            <Space>
              {detail.origin !== 'bundled' ? (
                <Button
                  danger
                  loading={deletingId === detail.id}
                  onClick={() => handleDelete(detail)}
                >
                  删除
                </Button>
              ) : null}
              <Button onClick={() => void handleReveal(detail.dir)}>打开目录</Button>
              <Button icon={<CopyOutlined />} onClick={() => openDuplicate(detail)}>
                复制
              </Button>
              {detail.editable ? (
                <Button type="primary" onClick={() => void openEdit(detail)}>
                  编辑
                </Button>
              ) : (
                <Button type="primary" onClick={() => openDuplicate(detail)}>
                  复制后编辑
                </Button>
              )}
            </Space>
          ) : null
        }
        destroyOnHidden
      >
        <Spin spinning={detailLoading}>
          {detail ? (
            <div className={styles.detailBody}>
              <div className={styles.detailHeader}>
                <div>
                  <code className={styles.detailId}>{detail.id}</code>
                  <div className={styles.detailTags}>
                    <OriginTag origin={detail.origin} />
                    {detail.hasSchema ? (
                      <Tag className={cardStyles.primaryTag}>可调参</Tag>
                    ) : (
                      <Tag className={cardStyles.mutedTag}>无 Schema</Tag>
                    )}
                    {(detail.tags ?? []).map((tag) => (
                      <Tag key={tag} className={cardStyles.neutralTag}>
                        {tag}
                      </Tag>
                    ))}
                  </div>
                </div>
                <AspectBadge width={detail.width} height={detail.height} />
              </div>

              <p className={styles.description}>{detail.description || '暂无描述'}</p>

              <div>
                <div className={styles.sectionLabel}>基本信息</div>
                <div className={styles.metaGrid}>
                  <div>
                    <span className={styles.metaLabel}>画幅</span>
                    <div className={styles.metaValue}>
                      {detail.width ?? '?'}×{detail.height ?? '?'} @ {detail.fps ?? '?'}fps
                    </div>
                  </div>
                  <div>
                    <span className={styles.metaLabel}>时长</span>
                    <div className={styles.metaValue}>{detail.durationInFrames ?? '?'} 帧</div>
                  </div>
                  <div>
                    <span className={styles.metaLabel}>Composition</span>
                    <div className={styles.metaValue}>{detail.compositionId ?? 'Main'}</div>
                  </div>
                  <div>
                    <span className={styles.metaLabel}>可编辑</span>
                    <div className={styles.metaValue}>{detail.editable ? '是' : '否（请先复制）'}</div>
                  </div>
                  <div className={styles.metaFull}>
                    <span className={styles.metaLabel}>目录</span>
                    <Text code copyable className={styles.pathText}>
                      {detail.dir}
                    </Text>
                  </div>
                </div>
              </div>

              <div>
                <div className={styles.sectionLabel}>defaultProps</div>
                <pre className={styles.codeBlock}>
                  {JSON.stringify(detail.defaultProps ?? {}, null, 2)}
                </pre>
              </div>

              <div>
                <div className={styles.sectionLabel}>文件（{detail.files.length}）</div>
                <ul className={styles.fileList}>
                  {detail.files.map((f) => (
                    <li key={f} className={styles.fileItem}>
                      <code>{f}</code>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </Spin>
      </Modal>

      <Modal
        title="编辑模板"
        open={editOpen}
        onCancel={() => {
          setEditOpen(false)
          setEditTemplateId(null)
        }}
        onOk={() => void handleSaveEdit()}
        confirmLoading={saving}
        okText="保存"
        width={640}
        className={styles.editModal}
        destroyOnHidden
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="tags" label="标签（逗号分隔）">
            <Input placeholder="intro, 9:16" />
          </Form.Item>
          <Space wrap className={styles.formRow}>
            <Form.Item name="compositionId" label="compositionId">
              <Input style={{ width: 140 }} />
            </Form.Item>
            <Form.Item name="width" label="宽">
              <InputNumber min={1} style={{ width: 100 }} />
            </Form.Item>
            <Form.Item name="height" label="高">
              <InputNumber min={1} style={{ width: 100 }} />
            </Form.Item>
            <Form.Item name="fps" label="fps">
              <InputNumber min={1} style={{ width: 80 }} />
            </Form.Item>
            <Form.Item name="durationInFrames" label="总帧数">
              <InputNumber min={1} style={{ width: 100 }} />
            </Form.Item>
          </Space>
          <Form.Item name="defaultPropsJson" label="defaultProps（JSON）">
            <Input.TextArea rows={8} className={styles.monoTextarea} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="从 GitHub 导入 Remotion 模板"
        open={importOpen}
        onCancel={() => setImportOpen(false)}
        onOk={() => void handleImport()}
        confirmLoading={importing}
        okText="导入"
      >
        <p className={styles.modalHint}>
          仓库内需含 <code>meta.json</code> + <code>Composition.tsx</code>
          ，或根目录 <code>manifest.json</code> 索引多模板。
        </p>
        <Input
          placeholder="https://github.com/org/repo 或 tree/.../templates/foo"
          value={importUrl}
          onChange={(e) => setImportUrl(e.target.value)}
          className={styles.importField}
        />
        <Input
          placeholder="目标模板 id（可选，单模板导入时）"
          value={importTargetId}
          onChange={(e) => setImportTargetId(e.target.value)}
        />
      </Modal>

      <Modal
        title="复制为可编辑模板"
        open={dupOpen}
        onCancel={() => {
          setDupOpen(false)
          setDupSource(null)
        }}
        onOk={() => void handleDuplicate()}
        confirmLoading={duplicating}
        okText="复制"
      >
        <p className={styles.modalHint}>
          源模板：<code>{dupSource?.id}</code>（{dupSource?.name}
          ）。副本写入用户模板目录，可编辑 meta 与 defaultProps。
        </p>
        <Form layout="vertical">
          <Form.Item label="新模板 id" required>
            <Input value={dupTargetId} onChange={(e) => setDupTargetId(e.target.value)} />
          </Form.Item>
          <Form.Item label="显示名称">
            <Input value={dupName} onChange={(e) => setDupName(e.target.value)} />
          </Form.Item>
        </Form>
      </Modal>
    </FeaturePageShell>
  )
}
