import type { PublishChannelUpsertInput } from '@shared/publish-channels'
import { queryPublishChannelMeta } from '@shared/publish-channels'
import type { ChannelLoginState, ChannelLoginStatus } from '@shared/types'
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
import styles from './ChannelsPage.module.css'

const { Title, Paragraph, Text } = Typography

/** 将登录态映射为 Tag 颜色与文案 */
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

/** 渠道管理：展示发布渠道元数据、登录态检测、Profile 维护与 CRUD */
export function ChannelsPage(): React.ReactElement {
  const channels = useChannelsStore((s) => s.channels)
  const channelsLoading = useChannelsStore((s) => s.loading)
  const hydrate = useChannelsStore((s) => s.hydrate)
  const saveChannel = useChannelsStore((s) => s.saveChannel)
  const removeChannel = useChannelsStore((s) => s.removeChannel)
  const initBuiltinChannels = useChannelsStore((s) => s.initBuiltinChannels)

  const [statusMap, setStatusMap] = useState<Record<string, ChannelLoginStatus>>({})
  const [checking, setChecking] = useState(false)
  const [openingId, setOpeningId] = useState<PublishChannelId | null>(null)
  const [clearing, setClearing] = useState(false)
  const [initializing, setInitializing] = useState(false)

  const [editOpen, setEditOpen] = useState(false)
  const [editMode, setEditMode] = useState<'create' | 'update'>('create')
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm<PublishChannelUpsertInput>()

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  /** 拉取全部渠道登录态并写入 map */
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

  const openCreate = (): void => {
    const draft = createEmptyChannel()
    setEditMode('create')
    form.setFieldsValue(draft)
    setEditOpen(true)
  }

  const openEdit = (channelId: PublishChannelId): void => {
    const meta = channels.find((c) => c.id === channelId)
    if (!meta) return
    setEditMode('update')
    form.setFieldsValue(channelMetaToInput(meta))
    setEditOpen(true)
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

  /** 恢复小红书/抖音/视频号为默认配置，自定义渠道保留 */
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

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerMain}>
          <div className={styles.headerIcon}>
            <ApiOutlined />
          </div>
          <div>
            <Title level={3} className={styles.title}>
              渠道
            </Title>
            <Paragraph className={styles.desc}>
              管理发布渠道连接与登录态。已接入 {enabledCount} 个渠道，当前已登录 {loggedInCount}{' '}
              个。所有渠道共用本机浏览器 Profile，Cookie 保存在 userData。
            </Paragraph>
          </div>
        </div>
        <Space>
          <Popconfirm
            title="初始化内置渠道？"
            description="将恢复小红书、抖音、视频号为默认配置，自定义渠道不受影响。"
            onConfirm={() => void handleInitBuiltin()}
            okText="初始化"
            cancelText="取消"
          >
            <Button loading={initializing}>初始化内置渠道</Button>
          </Popconfirm>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增渠道
          </Button>
          <Button
            icon={<ReloadOutlined />}
            loading={checking}
            onClick={() => void refreshStatuses()}
          >
            检测全部登录态
          </Button>
        </Space>
      </header>

      <div className={styles.body}>
        <Spin spinning={(channelsLoading || checking) && channels.length === 0}>
          <div className={styles.grid}>
            {channels.map((channel) => {
              const status = statusMap[channel.id]
              const isDisabled = !channel.enabled

              return (
                <Card
                  key={channel.id}
                  className={`${styles.card} ${isDisabled ? styles.cardDisabled : ''}`}
                  bordered={false}
                >
                  <div className={styles.cardHead}>
                    <div className={styles.cardHeadRow}>
                      <span className={styles.channelName}>{channel.label}</span>
                      {channel.isBuiltin && <Tag color="blue">内置</Tag>}
                      {channel.enabled ? (
                        <Tag color="processing">已接入</Tag>
                      ) : (
                        <Tag>预留</Tag>
                      )}
                      {renderLoginTag(status?.state)}
                    </div>
                    <div className={styles.channelDesc}>{channel.description}</div>
                  </div>

                  <div className={styles.metaList}>
                    <div className={styles.metaRow}>
                      <span className={styles.metaLabel}>渠道 ID</span>
                      <span className={styles.metaValue}>{channel.id}</span>
                    </div>
                    <div className={styles.metaRow}>
                      <span className={styles.metaLabel}>发布工具</span>
                      <span className={styles.metaValue}>{channel.publishTool}</span>
                    </div>
                    {channel.titleMaxLength != null && (
                      <div className={styles.metaRow}>
                        <span className={styles.metaLabel}>标题上限</span>
                        <span className={styles.metaValue}>{channel.titleMaxLength} 字</span>
                      </div>
                    )}
                    {status?.message && (
                      <div className={styles.metaRow}>
                        <span className={styles.metaLabel}>状态说明</span>
                        <Tooltip title={status.message}>
                          <span className={`${styles.metaValue} ${styles.metaValueEllipsis}`}>
                            {status.message}
                          </span>
                        </Tooltip>
                      </div>
                    )}
                  </div>

                  <div className={styles.actions}>
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => openEdit(channel.id)}
                    >
                      编辑
                    </Button>
                    {!channel.isBuiltin && (
                      <Popconfirm
                        title="确定删除该渠道？"
                        description="删除后发布计划若引用该渠道，将回退为小红书。"
                        onConfirm={() => void handleDelete(channel.id)}
                        okText="删除"
                        cancelText="取消"
                        okButtonProps={{ danger: true }}
                      >
                        <Button size="small" danger icon={<DeleteOutlined />}>
                          删除
                        </Button>
                      </Popconfirm>
                    )}
                    {channel.enabled && (
                      <>
                        <Button
                          size="small"
                          icon={<LoginOutlined />}
                          loading={openingId === channel.id}
                          onClick={() => void handleOpenLogin(channel.id)}
                        >
                          打开登录页
                        </Button>
                        <Button
                          size="small"
                          icon={<ReloadOutlined />}
                          loading={checking}
                          onClick={() => void refreshStatuses()}
                        >
                          检测登录
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        </Spin>

        <Alert
          className={styles.alertCard}
          type="info"
          showIcon
          message="浏览器登录态"
          description={
            <Space direction="vertical">
              <Text>
                各渠道共用同一个 Playwright 浏览器 Profile。若登录异常、Cookie 冲突或提示 browser
                has been closed，可清除后重新扫码。
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
        title={editMode === 'create' ? '新增渠道' : '编辑渠道'}
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={() => void handleSave()}
        confirmLoading={saving}
        destroyOnClose
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
