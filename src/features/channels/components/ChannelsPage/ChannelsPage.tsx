import type { CSSProperties } from 'react'
import type { PublishChannelUpsertInput } from '@shared/publish-channels'
import { queryPublishChannelMeta } from '@shared/publish-channels'
import type { ChannelLoginState, ChannelLoginStatus, PublishChannelMeta } from '@shared/types'
import type { PublishChannelId } from '@shared/publish-channels'
import {
  postBrowserClearProfile,
  postChannelOpenLogin,
  queryChannelLoginStatuses
} from '../../api'
import { useChannelsStore } from '../../hooks/useChannelsStore'
import {
  channelMetaToInput,
  createEmptyChannel,
  isValidChannelId,
  slugifyChannelId
} from '../../types'
import { DB_THEME } from '@/styles/theme-tokens'
import styles from './ChannelsPage.module.css'

const { Title, Text } = Typography

type ChannelFilter = 'all' | 'enabled' | 'reserved'

function renderLoginTag(state: ChannelLoginState | undefined): React.ReactElement {
  switch (state) {
    case 'logged_in':
      return (
        <Tag icon={<CheckCircleOutlined />} color="success">
          已登录
        </Tag>
      )
    case 'logged_out':
      return (
        <Tag icon={<CloseCircleOutlined />} color="warning">
          未登录
        </Tag>
      )
    case 'unsupported':
      return (
        <Tag icon={<StopOutlined />} color="default">
          即将上线
        </Tag>
      )
    case 'error':
      return (
        <Tag icon={<CloseCircleOutlined />} color="error">
          检测失败
        </Tag>
      )
    default:
      return (
        <Tag icon={<QuestionCircleOutlined />} color="default">
          未检测
        </Tag>
      )
  }
}

function matchChannelQuery(channel: PublishChannelMeta, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    channel.label.toLowerCase().includes(q) ||
    channel.description.toLowerCase().includes(q) ||
    channel.id.toLowerCase().includes(q) ||
    channel.publishTool.toLowerCase().includes(q)
  )
}

function loginFooterLabel(state: ChannelLoginState | undefined): string {
  if (state === 'logged_in') return '已登录'
  if (state === 'logged_out') return '未登录'
  if (state === 'unsupported') return '即将上线'
  if (state === 'error') return '检测失败'
  return '未检测'
}

/** 渠道管理：对齐技能市场 — 卡片浏览 + 详情弹窗 */
export function ChannelsPage(): React.ReactElement {
  const channels = useChannelsStore((s) => s.channels)
  const channelsLoading = useChannelsStore((s) => s.loading)
  const hydrate = useChannelsStore((s) => s.hydrate)
  const saveChannel = useChannelsStore((s) => s.saveChannel)
  const removeChannel = useChannelsStore((s) => s.removeChannel)
  const initBuiltinChannels = useChannelsStore((s) => s.initBuiltinChannels)

  const [filter, setFilter] = useState<ChannelFilter>('all')
  const [search, setSearch] = useState('')

  const [statusMap, setStatusMap] = useState<Record<string, ChannelLoginStatus>>({})
  const [checking, setChecking] = useState(false)
  const [openingId, setOpeningId] = useState<PublishChannelId | null>(null)
  const [clearing, setClearing] = useState(false)
  const [initializing, setInitializing] = useState(false)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detailChannel, setDetailChannel] = useState<PublishChannelMeta | null>(null)

  const [editOpen, setEditOpen] = useState(false)
  const [editMode, setEditMode] = useState<'create' | 'update'>('create')
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm<PublishChannelUpsertInput>()

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  const refreshStatuses = useCallback(async (): Promise<void> => {
    setChecking(true)
    try {
      const list = await queryChannelLoginStatuses()
      const next: Record<string, ChannelLoginStatus> = {}
      for (const item of list) {
        next[item.channelId] = item
      }
      setStatusMap(next)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '登录态检测失败')
    } finally {
      setChecking(false)
    }
  }, [])

  const enabledCount = useMemo(() => channels.filter((c) => c.enabled).length, [channels])

  const loggedInCount = useMemo(
    () => channels.filter((c) => c.enabled && statusMap[c.id]?.state === 'logged_in').length,
    [channels, statusMap]
  )

  const filtered = useMemo(() => {
    let list = channels
    if (filter === 'enabled') list = list.filter((c) => c.enabled)
    if (filter === 'reserved') list = list.filter((c) => !c.enabled)
    return list.filter((c) => matchChannelQuery(c, search))
  }, [channels, filter, search])

  useEffect(() => {
    if (!detailChannel) return
    const next = channels.find((c) => c.id === detailChannel.id)
    if (next) setDetailChannel(next)
  }, [channels, detailChannel?.id])

  const openCreate = (): void => {
    const draft = createEmptyChannel()
    setEditMode('create')
    form.setFieldsValue(draft)
    setEditOpen(true)
  }

  const openEdit = (channel: PublishChannelMeta): void => {
    setEditMode('update')
    form.setFieldsValue(channelMetaToInput(channel))
    setEditOpen(true)
  }

  const openDetail = (channel: PublishChannelMeta): void => {
    setDetailChannel(channel)
    setDetailOpen(true)
  }

  const handleSave = async (): Promise<void> => {
    try {
      const values = await form.validateFields()
      const normalizedId =
        editMode === 'create' ? slugifyChannelId(values.id || values.label) : values.id.trim()
      if (!isValidChannelId(normalizedId)) {
        message.error('渠道 id 仅允许小写字母、数字、连字符和下划线')
        return Promise.reject(new Error('validation'))
      }
      setSaving(true)
      await saveChannel({
        ...values,
        id: normalizedId,
        label: values.label.trim(),
        description: values.description.trim(),
        publishTool: values.publishTool.trim(),
        loginCheckUrl: values.loginCheckUrl?.trim() || undefined,
        agentHint: values.agentHint.trim(),
        titleMaxLength: values.titleMaxLength ?? undefined
      })
      message.success(editMode === 'create' ? '渠道已创建' : '渠道已更新')
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
      await removeChannel(id)
      message.success('渠道已删除')
      if (detailChannel?.id === id) {
        setDetailOpen(false)
        setDetailChannel(null)
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : '删除失败')
    }
  }

  const handleOpenLogin = async (channelId: PublishChannelId): Promise<void> => {
    setOpeningId(channelId)
    try {
      await postChannelOpenLogin(channelId)
      message.success(`已打开${queryPublishChannelMeta(channelId).label}创作者中心，请完成登录`)
      window.setTimeout(() => {
        void refreshStatuses()
      }, 3000)
    } catch (err) {
      message.error(err instanceof Error ? err.message : '打开登录页失败')
    } finally {
      setOpeningId(null)
    }
  }

  const handleClearProfile = async (): Promise<void> => {
    setClearing(true)
    try {
      await postBrowserClearProfile()
      setStatusMap({})
      message.success('已清除浏览器登录态，请重新登录各渠道')
      void refreshStatuses()
    } catch (err) {
      message.error(err instanceof Error ? err.message : '清除失败')
    } finally {
      setClearing(false)
    }
  }

  const handleInitBuiltin = async (): Promise<void> => {
    setInitializing(true)
    try {
      await initBuiltinChannels()
      message.success('已初始化内置渠道（小红书、抖音、视频号）')
      void refreshStatuses()
    } catch (err) {
      message.error(err instanceof Error ? err.message : '初始化失败')
    } finally {
      setInitializing(false)
    }
  }

  const detailStatus = detailChannel ? statusMap[detailChannel.id] : undefined

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <div className={styles.headerIcon}>
            <ApiOutlined />
          </div>
          <div>
            <div className={styles.titleRow}>
              <Title level={3} className={styles.title}>
                渠道
              </Title>
              <span className={styles.countBadge}>{channels.length}</span>
            </div>
            <Text type="secondary" className={styles.desc}>
              已接入 {enabledCount} 个 · 已登录 {loggedInCount} 个；共用本机浏览器 Profile
            </Text>
          </div>
        </div>
        <Space wrap>
          <Popconfirm
            title="初始化内置渠道？"
            description="将恢复小红书、抖音、视频号为默认配置，自定义渠道不受影响。"
            onConfirm={() => void handleInitBuiltin()}
            okText="初始化"
            cancelText="取消"
          >
            <Button loading={initializing}>初始化内置</Button>
          </Popconfirm>
          <Button
            icon={<ReloadOutlined />}
            loading={checking}
            onClick={() => void refreshStatuses()}
          >
            检测登录态
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增渠道
          </Button>
        </Space>
      </header>

      <div className={styles.toolbar}>
        <Segmented
          value={filter}
          onChange={(v) => setFilter(v as ChannelFilter)}
          options={[
            { label: '全部', value: 'all' },
            { label: '已接入', value: 'enabled' },
            { label: '预留', value: 'reserved' }
          ]}
        />
        <div className={styles.toolbarRight}>
          <span className={styles.resultCount}>{filtered.length} 项</span>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索渠道..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      <div className={styles.body}>
        <Spin spinning={(channelsLoading || checking) && channels.length === 0}>
          {filtered.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={channels.length === 0 ? '暂无渠道' : '暂无匹配的渠道'}
              className={styles.empty}
            >
              {channels.length === 0 ? (
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                  新增渠道
                </Button>
              ) : null}
            </Empty>
          ) : (
            <div className={styles.grid}>
              {filtered.map((channel, index) => {
                const status = statusMap[channel.id]
                return (
                  <Card
                    key={channel.id}
                    variant="borderless"
                    hoverable
                    className={`${styles.card} ${channel.enabled ? '' : styles.cardDisabled}`}
                    style={{ '--card-index': index } as CSSProperties}
                    onClick={() => openDetail(channel)}
                  >
                    <div className={styles.cardHead}>
                      <div className={styles.cardTitleRow}>
                        <span className={styles.cardTitle}>{channel.label}</span>
                        {channel.enabled ? (
                          <Tag color="processing">已接入</Tag>
                        ) : (
                          <Tag>预留</Tag>
                        )}
                      </div>
                      <p className={styles.cardDesc}>
                        {channel.description?.trim() || '暂无描述，点击查看登录与配置。'}
                      </p>
                    </div>
                    <div className={styles.cardFooter}>
                      <span className={styles.cardAuthor}>
                        {channel.isBuiltin ? '@平台' : '@自定义'}
                      </span>
                      <span className={styles.cardUsage}>
                        {loginFooterLabel(status?.state)}
                      </span>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </Spin>

        <Alert
          className={styles.alertCard}
          type="info"
          showIcon
          message="浏览器登录态"
          description={
            <Space direction="vertical">
              <Text>
                各渠道共用同一个 Playwright 浏览器 Profile。若登录异常或 Cookie 冲突，可清除后重新扫码。
              </Text>
              <Popconfirm
                title="确定清除全部渠道登录态？"
                description="将删除本机 browser-profile 目录，所有渠道需重新登录。"
                onConfirm={() => void handleClearProfile()}
                okText="清除"
                cancelText="取消"
                okButtonProps={{ danger: true }}
              >
                <Button danger loading={clearing}>
                  清除全部登录态
                </Button>
              </Popconfirm>
            </Space>
          }
        />
      </div>

      <Modal
        title={detailChannel?.label ?? '渠道详情'}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={760}
        destroyOnHidden
        className={styles.detailModal}
      >
        {!detailChannel ? (
          <Empty description="未找到渠道详情" />
        ) : (
          <div className={styles.detailBody}>
            <div className={styles.detailHeader}>
              <div>
                <code className={styles.detailId}>{detailChannel.id}</code>
                <div className={styles.detailTags}>
                  {detailChannel.isBuiltin ? (
                    <Tag color={DB_THEME.primary}>内置</Tag>
                  ) : null}
                  {detailChannel.enabled ? (
                    <Tag color="processing">已接入</Tag>
                  ) : (
                    <Tag>预留</Tag>
                  )}
                  {renderLoginTag(detailStatus?.state)}
                </div>
              </div>
              <Space wrap>
                <Button icon={<EditOutlined />} onClick={() => openEdit(detailChannel)}>
                  编辑
                </Button>
                {!detailChannel.isBuiltin ? (
                  <Popconfirm
                    title="确定删除该渠道？"
                    description="删除后发布计划若引用该渠道，将回退为小红书。"
                    onConfirm={() => void handleDelete(detailChannel.id)}
                    okText="删除"
                    cancelText="取消"
                    okButtonProps={{ danger: true }}
                  >
                    <Button danger icon={<DeleteOutlined />}>
                      删除
                    </Button>
                  </Popconfirm>
                ) : null}
                {detailChannel.enabled ? (
                  <>
                    <Button
                      icon={<LoginOutlined />}
                      loading={openingId === detailChannel.id}
                      onClick={() => void handleOpenLogin(detailChannel.id)}
                    >
                      打开登录页
                    </Button>
                    <Button
                      icon={<ReloadOutlined />}
                      loading={checking}
                      onClick={() => void refreshStatuses()}
                    >
                      检测登录
                    </Button>
                  </>
                ) : null}
              </Space>
            </div>

            {detailChannel.description?.trim() ? (
              <p className={styles.description}>{detailChannel.description}</p>
            ) : null}

            <div>
              <h3 className={styles.sectionLabel}>配置信息</h3>
              <div className={styles.metaList}>
                <div className={styles.metaRow}>
                  <span className={styles.metaLabel}>发布工具</span>
                  <span className={styles.metaValue}>{detailChannel.publishTool}</span>
                </div>
                {detailChannel.titleMaxLength != null ? (
                  <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>标题上限</span>
                    <span className={styles.metaValue}>{detailChannel.titleMaxLength} 字</span>
                  </div>
                ) : null}
                {detailChannel.loginCheckUrl ? (
                  <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>创作者中心</span>
                    <span className={styles.metaValue}>{detailChannel.loginCheckUrl}</span>
                  </div>
                ) : null}
                {detailStatus?.message ? (
                  <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>状态说明</span>
                    <span className={styles.metaValue}>{detailStatus.message}</span>
                  </div>
                ) : null}
                {detailChannel.agentHint ? (
                  <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>Agent 说明</span>
                    <span className={styles.metaValue}>{detailChannel.agentHint}</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title={editMode === 'create' ? '新增渠道' : '编辑渠道'}
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={() => void handleSave()}
        confirmLoading={saving}
        destroyOnHidden
        width={560}
      >
        <Form form={form} layout="vertical" preserve={false}>
          {editMode === 'create' ? (
            <Form.Item
              name="id"
              label="渠道 ID"
              tooltip="留空则根据名称自动生成；仅小写字母、数字、连字符与下划线"
            >
              <Input placeholder="例如 bilibili" />
            </Form.Item>
          ) : (
            <Form.Item label="渠道 ID">
              <Input value={form.getFieldValue('id')} disabled />
            </Form.Item>
          )}
          <Form.Item
            name="label"
            label="渠道名称"
            rules={[{ required: true, message: '请输入渠道名称' }]}
          >
            <Input placeholder="例如 B站" />
          </Form.Item>
          <Form.Item name="description" label="简介">
            <Input.TextArea rows={2} placeholder="渠道页展示的说明" />
          </Form.Item>
          <Form.Item name="enabled" label="已接入" valuePropName="checked">
            <Switch checkedChildren="是" unCheckedChildren="否" />
          </Form.Item>
          <Form.Item
            name="publishTool"
            label="Agent 发布工具名"
            rules={[{ required: true, message: '请输入发布工具名' }]}
            tooltip="snake_case，如 xhs_publish_note；需在后端实现对应工具"
          >
            <Input placeholder="例如 bilibili_publish_note" />
          </Form.Item>
          <Form.Item name="titleMaxLength" label="标题字数上限">
            <InputNumber min={1} max={200} placeholder="可选" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="loginCheckUrl" label="创作者中心地址">
            <Input placeholder="登录检测与打开登录页时使用，可选" />
          </Form.Item>
          <Form.Item
            name="agentHint"
            label="Agent 补充说明"
            rules={[{ required: true, message: '请填写 Agent 说明' }]}
          >
            <Input.TextArea rows={4} placeholder="发布该渠道时的工具用法与注意事项" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
