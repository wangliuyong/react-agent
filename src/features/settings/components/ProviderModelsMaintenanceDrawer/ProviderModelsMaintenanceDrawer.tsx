import { Drawer, Form, Input, Modal, Select, Switch, Table, Tabs } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  PROVIDER_MODEL_CATEGORY_PRESETS,
  queryModelCategory,
  queryModelOptions,
  queryModelSupportsThinking,
  queryNewProviderModelRecordId,
  type CustomModelProvider,
  type ModelOption,
  type ModelProvider,
  type ProviderModelRecord
} from '@shared/types'
import { useProviderModels } from '../../hooks/useProviderModels'
import styles from './ProviderModelsMaintenanceDrawer.module.css'

/** 小号表格表头近似高度，用于计算虚拟滚动视口 */
const TABLE_HEAD_HEIGHT_PX = 40

const { Text } = Typography

/** 抽屉内 Tab：本机可编辑；兜底与平台只读展示 */
type CatalogTabKey = 'manual' | 'fallback' | 'platform'

/** 统一表格行：三种来源共用展示结构 */
interface CatalogTableRow {
  key: string
  modelId: string
  displayName: string
  category: string
  description?: string
  contextWindow?: string
  size?: string
  supportsThinking?: boolean
  supportsVision?: boolean
  /** 仅本机登记行可编辑删除 */
  record?: ProviderModelRecord
}

/** 编辑弹窗表单字段 */
interface ModelRecordFormValues {
  modelId: string
  displayName: string
  contextWindow: string
  size: string
  category: string
  description: string
  supportsThinking: boolean
  supportsVision: boolean
}

export interface ProviderModelsMaintenanceDrawerProps {
  open: boolean
  provider: ModelProvider | null
  providerLabel: string
  /** 当前供应商下的本机登记目录（受控） */
  records: ProviderModelRecord[]
  /** 拉取平台列表所需凭证 */
  apiKey: string
  baseUrl: string
  customProviders: CustomModelProvider[]
  onClose: () => void
  /** 本机目录变更后回传父级，待「保存设置」一并写入 */
  onChange: (records: ProviderModelRecord[]) => void
}

function queryRecordToForm(record: ProviderModelRecord): ModelRecordFormValues {
  return {
    modelId: record.modelId,
    displayName: record.displayName ?? '',
    contextWindow: record.contextWindow ?? '',
    size: record.size ?? '',
    category: record.category ?? queryModelCategory(record.modelId),
    description: record.description ?? '',
    supportsThinking: Boolean(record.supportsThinking),
    supportsVision: Boolean(record.supportsVision)
  }
}

function queryFormToRecord(
  id: string,
  values: ModelRecordFormValues
): ProviderModelRecord | null {
  const modelId = values.modelId.trim()
  if (!modelId) return null
  const displayName = values.displayName.trim()
  const contextWindow = values.contextWindow.trim()
  const size = values.size.trim()
  const category = values.category.trim()
  const description = values.description.trim()
  return {
    id,
    modelId,
    ...(displayName ? { displayName } : {}),
    ...(contextWindow ? { contextWindow } : {}),
    ...(size ? { size } : {}),
    ...(category ? { category } : {}),
    ...(description ? { description } : {}),
    ...(values.supportsThinking ? { supportsThinking: true } : {}),
    ...(values.supportsVision ? { supportsVision: true } : {})
  }
}

/** ModelOption → 只读表格行 */
function queryOptionToTableRow(option: ModelOption): CatalogTableRow {
  const modelId = option.value.trim()
  return {
    key: modelId,
    modelId,
    displayName: option.label?.trim() || modelId,
    category: option.category?.trim() || queryModelCategory(modelId),
    description: option.description,
    supportsThinking: queryModelSupportsThinking(modelId),
    supportsVision: /vl|vision|qvq|ocr|omni/i.test(modelId)
  }
}

/** 平台拉取列表本地检索：匹配编码、展示名、类型与说明（不区分大小写） */
function queryFilterCatalogRows(
  rows: CatalogTableRow[],
  keyword: string
): CatalogTableRow[] {
  const needle = keyword.trim().toLowerCase()
  if (!needle) return rows
  return rows.filter((row) => {
    const haystack = [
      row.modelId,
      row.displayName,
      row.category,
      row.description ?? ''
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(needle)
  })
}

/** ProviderModelRecord → 表格行 */
function queryRecordToTableRow(record: ProviderModelRecord): CatalogTableRow {
  return {
    key: record.id,
    modelId: record.modelId,
    displayName: record.displayName?.trim() || record.modelId,
    category: record.category?.trim() || queryModelCategory(record.modelId),
    description: record.description,
    contextWindow: record.contextWindow,
    size: record.size,
    supportsThinking: record.supportsThinking,
    supportsVision: record.supportsVision,
    record
  }
}

const categoryOptions = PROVIDER_MODEL_CATEGORY_PRESETS.map((label) => ({
  value: label,
  label
}))

/**
 * 按供应商维护模型目录，并用 Tab 区分：
 * - 本机登记：可增删改，写入 providerModelCatalog
 * - 本地兜底：应用内置静态列表（只读）
 * - 平台拉取：OpenAI 兼容 /models（只读，可刷新）
 */
export function ProviderModelsMaintenanceDrawer({
  open,
  provider,
  providerLabel,
  records,
  apiKey,
  baseUrl,
  customProviders,
  onClose,
  onChange
}: ProviderModelsMaintenanceDrawerProps): React.ReactElement {
  const [form] = Form.useForm<ModelRecordFormValues>()
  const [activeTab, setActiveTab] = useState<CatalogTabKey>('manual')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [platformRefreshToken, setPlatformRefreshToken] = useState(0)
  /** 平台拉取 Tab 本地过滤关键词（不触发重新请求） */
  const [platformSearch, setPlatformSearch] = useState('')
  const tableHostRef = useRef<HTMLDivElement>(null)
  const [tableScrollY, setTableScrollY] = useState(320)

  const syncTableScrollHeight = useCallback((): void => {
    const el = tableHostRef.current
    if (!el) return
    const next = Math.max(120, el.clientHeight - TABLE_HEAD_HEIGHT_PX)
    setTableScrollY((prev) => (prev === next ? prev : next))
  }, [])

  const trimmedKey = apiKey.trim()
  const canFetchPlatform = trimmedKey.length >= 8

  const {
    remoteModels,
    loading: platformLoading,
    error: platformError
  } = useProviderModels({
    /** 抽屉打开即拉取平台列表，便于 Tab 角标与切换后直接展示 */
    enabled: open && Boolean(provider),
    provider: provider ?? 'dashscope',
    apiKey: trimmedKey,
    baseUrl,
    customProviders,
    autoFetch: canFetchPlatform,
    refreshToken: platformRefreshToken
  })

  useEffect(() => {
    if (!open) {
      setEditorOpen(false)
      setEditingId(null)
      setActiveTab('manual')
      setPlatformSearch('')
    }
  }, [open])

  const editingRecord = useMemo(
    () => records.find((item) => item.id === editingId) ?? null,
    [records, editingId]
  )

  const manualRows = useMemo(
    () => records.map(queryRecordToTableRow),
    [records]
  )

  const fallbackRows = useMemo(() => {
    if (!provider) return []
    return queryModelOptions(provider).map(queryOptionToTableRow)
  }, [provider])

  const platformRows = useMemo(() => {
    if (!remoteModels) return []
    return remoteModels.map(queryOptionToTableRow)
  }, [remoteModels])

  const filteredPlatformRows = useMemo(
    () => queryFilterCatalogRows(platformRows, platformSearch),
    [platformRows, platformSearch]
  )

  const registeredModelIds = useMemo(
    () => new Set(records.map((item) => item.modelId)),
    [records]
  )

  useLayoutEffect(() => {
    if (!open) return
    syncTableScrollHeight()
    const el = tableHostRef.current
    if (!el) return
    const observer = new ResizeObserver(() => syncTableScrollHeight())
    observer.observe(el)
    return () => observer.disconnect()
  }, [
    open,
    activeTab,
    platformError,
    records.length,
    fallbackRows.length,
    platformRows.length,
    filteredPlatformRows.length,
    platformSearch,
    platformLoading,
    syncTableScrollHeight
  ])

  const openCreate = (): void => {
    setActiveTab('manual')
    setEditingId(null)
    form.setFieldsValue({
      modelId: '',
      displayName: '',
      contextWindow: '',
      size: '',
      category: '文本对话',
      description: '',
      supportsThinking: false,
      supportsVision: false
    })
    setEditorOpen(true)
  }

  const openEdit = (record: ProviderModelRecord): void => {
    setEditingId(record.id)
    form.setFieldsValue(queryRecordToForm(record))
    setEditorOpen(true)
  }

  /** 从兜底 / 平台列表一键登记到本机目录；留在当前 Tab，便于连续登记 */
  const postAdoptToManual = (row: CatalogTableRow): void => {
    if (registeredModelIds.has(row.modelId)) {
      message.info('该模型已在本机登记')
      return
    }
    const next: ProviderModelRecord = {
      id: queryNewProviderModelRecordId(),
      modelId: row.modelId,
      displayName: row.displayName !== row.modelId ? row.displayName : undefined,
      category: row.category,
      description: row.description,
      ...(row.supportsThinking ? { supportsThinking: true } : {}),
      ...(row.supportsVision ? { supportsVision: true } : {})
    }
    onChange([...records, next])
    message.success(`已登记「${row.displayName}」到本机`)
  }

  const handleDelete = (record: ProviderModelRecord): void => {
    Modal.confirm({
      title: `删除模型「${record.displayName || record.modelId}」？`,
      content: '仅从本机目录移除，不影响平台与本地兜底列表。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => onChange(records.filter((item) => item.id !== record.id))
    })
  }

  const handleEditorOk = async (): Promise<void> => {
    const values = await form.validateFields()
    const modelId = values.modelId.trim()
    const duplicate = records.some(
      (item) => item.modelId === modelId && item.id !== editingId
    )
    if (duplicate) {
      message.warning('该模型编码已存在')
      return
    }
    const id = editingId ?? queryNewProviderModelRecordId()
    const nextRecord = queryFormToRecord(id, values)
    if (!nextRecord) return

    if (editingId) {
      onChange(records.map((item) => (item.id === editingId ? nextRecord : item)))
    } else {
      onChange([...records, nextRecord])
    }
    setEditorOpen(false)
    setEditingId(null)
  }

  /** 本机登记列：可编辑删除 */
  const manualColumns: ColumnsType<CatalogTableRow> = [
    {
      title: '编码',
      dataIndex: 'modelId',
      key: 'modelId',
      width: 160,
      render: (value: string) => <span className={styles.modelIdCell}>{value}</span>
    },
    {
      title: '名称',
      dataIndex: 'displayName',
      key: 'displayName',
      ellipsis: true
    },
    {
      title: '上下文',
      dataIndex: 'contextWindow',
      key: 'contextWindow',
      width: 88,
      render: (value?: string) => value?.trim() || '—'
    },
    {
      title: '规模',
      dataIndex: 'size',
      key: 'size',
      width: 72,
      render: (value?: string) => value?.trim() || '—'
    },
    {
      title: '类型',
      dataIndex: 'category',
      key: 'category',
      width: 96
    },
    {
      title: '能力',
      key: 'flags',
      width: 120,
      render: (_value, row) => (
        <div className={styles.metaTags}>
          {row.supportsThinking ? <Tag color="blue">思考</Tag> : null}
          {row.supportsVision ? <Tag color="purple">视觉</Tag> : null}
          {!row.supportsThinking && !row.supportsVision ? (
            <Text type="secondary">—</Text>
          ) : null}
        </div>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 108,
      fixed: 'right',
      render: (_value, row) =>
        row.record ? (
          <Space size={4}>
            <Button type="link" size="small" onClick={() => openEdit(row.record!)}>
              编辑
            </Button>
            <Button type="link" size="small" danger onClick={() => handleDelete(row.record!)}>
              删除
            </Button>
          </Space>
        ) : null
    }
  ]

  /** 兜底 / 平台只读列：可一键登记 */
  const readonlyColumns: ColumnsType<CatalogTableRow> = [
    {
      title: '编码',
      dataIndex: 'modelId',
      key: 'modelId',
      width: 180,
      render: (value: string) => <span className={styles.modelIdCell}>{value}</span>
    },
    {
      title: '名称',
      dataIndex: 'displayName',
      key: 'displayName',
      ellipsis: true
    },
    {
      title: '类型',
      dataIndex: 'category',
      key: 'category',
      width: 100
    },
    {
      title: '说明',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (value?: string) => value?.trim() || '—'
    },
    {
      title: '能力',
      key: 'flags',
      width: 120,
      render: (_value, row) => (
        <div className={styles.metaTags}>
          {row.supportsThinking ? <Tag color="blue">思考</Tag> : null}
          {row.supportsVision ? <Tag color="purple">视觉</Tag> : null}
          {!row.supportsThinking && !row.supportsVision ? (
            <Text type="secondary">—</Text>
          ) : null}
        </div>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_value, row) => {
        const adopted = registeredModelIds.has(row.modelId)
        return (
          <Button
            type="link"
            size="small"
            disabled={adopted}
            onClick={() => postAdoptToManual(row)}
          >
            {adopted ? '已登记' : '登记'}
          </Button>
        )
      }
    }
  ]

  const queryTabLabel = (key: CatalogTabKey, count: number, label: string): React.ReactNode => (
    <span className={styles.tabLabel}>
      {label}
      <span className={styles.tabCount}>{count}</span>
    </span>
  )

  const renderTable = (
    rows: CatalogTableRow[],
    columns: ColumnsType<CatalogTableRow>,
    empty: React.ReactNode
  ): React.ReactNode => {
    if (rows.length === 0) {
      return <div className={styles.emptyBlock}>{empty}</div>
    }
    return (
      <div className={styles.tableWrap}>
        <Table<CatalogTableRow>
          rowKey="key"
          size="small"
          virtual
          pagination={false}
          scroll={{ x: 640, y: tableScrollY }}
          columns={columns}
          dataSource={rows}
        />
      </div>
    )
  }

  return (
    <>
      <Drawer
        title={providerLabel}
        placement="right"
        width={Math.min(760, typeof window !== 'undefined' ? window.innerWidth - 24 : 760)}
        open={open && Boolean(provider)}
        onClose={onClose}
        closable
        closeIcon={<CloseOutlined />}
        destroyOnHidden
        className={styles.drawer}
      >

        <p className={styles.lead}>
          本机登记可增删改；本地兜底为应用内置列表；平台拉取来自供应商 /models。保存设置后本机登记会与平台列表合并供下拉选用。
        </p>

        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as CatalogTabKey)}
          destroyInactiveTabPane
          className={styles.tabs}
          items={[
            {
              key: 'manual',
              label: queryTabLabel('manual', manualRows.length, '本机登记'),
              children: (
                <div className={styles.tabPane}>
                  <div className={styles.paneHint}>
                    <span>
                      <span>手动维护编码、上下文、规模与类型；点「保存设置」写入本机。</span>
                    </span>

                    <Button type="primary" onClick={openCreate}>
                      添加模型
                    </Button>
                  </div>
                  <div className={styles.tableArea} ref={tableHostRef}>
                    {renderTable(
                      manualRows,
                      manualColumns,
                      <>
                        <DatabaseOutlined
                          style={{ fontSize: 28, marginBottom: 8, opacity: 0.35 }}
                        />
                        <div>暂无本机登记</div>
                      </>
                    )}
                  </div>
                </div>
              )
            },
            {
              key: 'fallback',
              label: queryTabLabel('fallback', fallbackRows.length, '本地兜底'),
              children: (
                <div className={styles.tabPane}>
                  <div className={styles.paneHint}>
                    <span>

                      <span>
                        应用内置静态列表，平台不可达时下拉会回退到此处。只读，可将条目登记到本机以补充元数据。
                      </span>
                    </span>

                  </div>
                  <div className={styles.tableArea} ref={tableHostRef}>
                    {renderTable(
                      fallbackRows,
                      readonlyColumns,
                      <>
                        <BookOutlined
                          style={{ fontSize: 28, marginBottom: 8, opacity: 0.35 }}
                        />
                        <div>该供应商暂无内置兜底模型</div>
                      </>
                    )}
                  </div>
                </div>
              )
            },
            {
              key: 'platform',
              label: queryTabLabel('platform', platformRows.length, '平台拉取'),
              children: (
                <div className={styles.tabPane}>
                  <div className={styles.paneHint}>
                    <span>
                      {/* <CloudDownloadOutlined /> */}
                      <span>
                        {canFetchPlatform
                          ? '登记喜爱的模型'
                          : '请先在供应商卡片配置完整 API Key，再拉取平台列表。'}
                      </span>
                    </span>

                    <div className={styles.paneHintActions}>
                      {platformRows.length > 0 ? (
                        <>
                          <Input
                            allowClear
                            prefix={<SearchOutlined />}
                            placeholder="检索编码、名称、类型或说明…"
                            value={platformSearch}
                            onChange={(e) => setPlatformSearch(e.target.value)}
                            className={styles.platformSearch}
                          />
                          <Text type="secondary" className={styles.platformSearchMeta}>
                            {filteredPlatformRows.length} / {platformRows.length}
                          </Text>
                        </>
                      ) : null}
                      <Button
                        icon={<ReloadOutlined />}
                        loading={platformLoading}
                        disabled={!canFetchPlatform}
                        onClick={() => setPlatformRefreshToken((n) => n + 1)}
                      >
                        刷新
                      </Button>
                    </div>
                  </div>
                  {platformError ? (
                    <div className={styles.errorBanner}>{platformError}</div>
                  ) : null}
                  <div className={styles.tableArea} ref={tableHostRef}>
                    {platformLoading && platformRows.length === 0 ? (
                      <div className={styles.emptyBlock}>
                        <Spin />
                        <div style={{ marginTop: 10 }}>正在从平台拉取模型…</div>
                      </div>
                    ) : (
                      renderTable(
                        filteredPlatformRows,
                        readonlyColumns,
                        platformRows.length > 0 && platformSearch.trim() ? (
                          <>
                            <SearchOutlined
                              style={{ fontSize: 28, marginBottom: 8, opacity: 0.35 }}
                            />
                            <div>无匹配模型，请调整检索关键词</div>
                          </>
                        ) : (
                          <>
                            <CloudDownloadOutlined
                              style={{ fontSize: 28, marginBottom: 8, opacity: 0.35 }}
                            />
                            <div>
                              {canFetchPlatform
                                ? '暂无平台模型，可点击右上角刷新'
                                : '未配置 API Key，无法拉取'}
                            </div>
                            {canFetchPlatform ? (
                              <Button
                                type="link"
                                loading={platformLoading}
                                onClick={() => setPlatformRefreshToken((n) => n + 1)}
                              >
                                立即拉取
                              </Button>
                            ) : null}
                          </>
                        )
                      )
                    )}
                  </div>
                </div>
              )
            }
          ]}
        />
      </Drawer>

      <Modal
        title={editingRecord ? '编辑模型' : '添加模型'}
        open={editorOpen}
        onCancel={() => {
          setEditorOpen(false)
          setEditingId(null)
        }}
        onOk={() => void handleEditorOk()}
        okText="确定"
        cancelText="取消"
        destroyOnHidden
        className={styles.editModal}
        width={480}
      >
        <Form form={form} layout="vertical" className={styles.form}>
          <Form.Item
            label="模型编码"
            name="modelId"
            rules={[{ required: true, message: '请填写模型编码（API model 字段）' }]}
            extra="与请求体中的 model 参数一致，如 qwen-plus、deepseek-v4-flash"
          >
            <Input
              prefix={<CodeOutlined />}
              placeholder="model-id"
              disabled={Boolean(editingRecord)}
            />
          </Form.Item>
          <Form.Item label="展示名称" name="displayName">
            <Input placeholder="下拉中显示的名称，可留空" />
          </Form.Item>
          <Form.Item label="支持上下文" name="contextWindow">
            <Input placeholder="如 128K、200000 tokens" />
          </Form.Item>
          <Form.Item label="规模" name="size">
            <Input placeholder="如 7B、235B-A22B" />
          </Form.Item>
          <Form.Item label="模型类型" name="category">
            <Select
              showSearch
              allowClear
              options={categoryOptions}
              placeholder="选择或输入类型"
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item label="说明" name="description">
            <Input.TextArea rows={2} placeholder="计费、场景、限制等补充信息" />
          </Form.Item>
          <div className={styles.switchRow}>
            <label className={styles.switchItem}>
              <Form.Item name="supportsThinking" valuePropName="checked" noStyle>
                <Switch size="small" />
              </Form.Item>
              支持思考模式
            </label>
            <label className={styles.switchItem}>
              <Form.Item name="supportsVision" valuePropName="checked" noStyle>
                <Switch size="small" />
              </Form.Item>
              支持视觉输入
            </label>
          </div>
        </Form>
      </Modal>
    </>
  )
}
