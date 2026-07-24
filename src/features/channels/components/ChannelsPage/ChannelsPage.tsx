import type { CSSProperties } from 'react'
import type { ChannelKind, FeishuNotifyMsgType, PublishChannelUpsertInput } from '@shared/publish-channels'
import {
  isNotifyChannelConfigured,
  normalizeChannelKind,
  normalizeFeishuMsgType,
  queryFeishuNotifyAgentHint,
  queryPublishChannelMeta,
  queryShouldRefreshFeishuAgentHint,
  queryWebhookNotifyAgentHint
} from '@shared/publish-channels'
import type { ChannelLoginState, ChannelLoginStatus, PublishChannelMeta } from '@shared/types'
import type { PublishChannelId } from '@shared/publish-channels'
import {
  postBrowserClearProfile,
  postChannelOpenLogin,
  postNotifyChannelTest,
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
import {
  FeaturePageShell,
  FeaturePageHeader,
  FeaturePageToolbar,
  FeatureScrollBody,
  shellStyles
} from '@/components/page-shell'

const { Text } = Typography

/** 飞书通知类型展示名 */
const FEISHU_MSG_TYPE_LABELS: Record<FeishuNotifyMsgType, string> = {
  text: '文本',
  post: '富文本',
  image: '图片消息',
  share_chat: '群名片'
}

type ChannelFilter = 'all' | 'enabled' | 'reserved'

/** 渠道卡片/详情用状态标签（样式对齐技能页 tag） */
function renderLoginTag(state: ChannelLoginState | undefined): React.ReactElement {
  switch (state) {
    case 'logged_in':
      return <Tag className={styles.tagSuccess}>已登录</Tag>
    case 'logged_out':
      return <Tag className={styles.tagWarn}>未登录</Tag>
    case 'unsupported':
      return <Tag className={styles.tagMuted}>即将上线</Tag>
    case 'error':
      return <Tag className={styles.tagDanger}>检测失败</Tag>
    default:
      return <Tag className={styles.tagMuted}>未检测</Tag>
  }
}

/** 通知渠道配置状态徽标 */
function renderNotifyConfigTag(channel: PublishChannelMeta): React.ReactElement {
  if (!channel.enabled || channel.id === 'wechat_notify' || channel.id === 'qq_notify') {
    return <Tag className={styles.tagMuted}>即将上线</Tag>
  }
  if (isNotifyChannelConfigured(channel)) {
    return <Tag className={styles.tagSuccess}>已配置</Tag>
  }
  return <Tag className={styles.tagWarn}>未配置</Tag>
}

/** 按渠道 id 映射图标与品牌色，让卡片一眼可辨 */
function channelVisual(id: string): { icon: React.ReactNode; toneClass: string } {
  switch (id) {
    case 'xhs':
      return { icon: <FireOutlined />, toneClass: styles.tone_xhs }
    case 'douyin':
      return { icon: <PlaySquareOutlined />, toneClass: styles.tone_douyin }
    case 'wechat_channels':
      return { icon: <VideoCameraOutlined />, toneClass: styles.tone_wechat }
    case 'feishu':
      return { icon: <SendOutlined />, toneClass: styles.tone_feishu }
    case 'webhook':
      return { icon: <ApiOutlined />, toneClass: styles.tone_default }
    case 'wechat_notify':
      return { icon: <WechatOutlined />, toneClass: styles.tone_wechat }
    case 'qq_notify':
      return { icon: <MessageOutlined />, toneClass: styles.tone_qq }
    default:
      return { icon: <ApiOutlined />, toneClass: styles.tone_default }
  }
}

function matchChannelQuery(channel: PublishChannelMeta, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    channel.label.toLowerCase().includes(q) ||
    channel.description.toLowerCase().includes(q) ||
    channel.id.toLowerCase().includes(q) ||
    (channel.publishTool ?? '').toLowerCase().includes(q) ||
    (channel.notifyTool ?? '').toLowerCase().includes(q)
  )
}

function loginFooterLabel(state: ChannelLoginState | undefined): string {
  if (state === 'logged_in') return '已登录'
  if (state === 'logged_out') return '未登录'
  if (state === 'unsupported') return '即将上线'
  if (state === 'error') return '检测失败'
  return '未检测'
}

function notifyFooterLabel(channel: PublishChannelMeta): string {
  if (!channel.enabled || channel.id === 'wechat_notify' || channel.id === 'qq_notify') {
    return '即将上线'
  }
  return isNotifyChannelConfigured(channel) ? '已配置' : '未配置'
}

/** 渠道管理：对齐技能市场 — Segmented 分发布/通知 + 卡片浏览 */
export function ChannelsPage(): React.ReactElement {
  const channels = useChannelsStore((s) => s.channels)
  const channelsLoading = useChannelsStore((s) => s.loading)
  const hydrate = useChannelsStore((s) => s.hydrate)
  const saveChannel = useChannelsStore((s) => s.saveChannel)
  const removeChannel = useChannelsStore((s) => s.removeChannel)
  const initBuiltinChannels = useChannelsStore((s) => s.initBuiltinChannels)

  const [kindTab, setKindTab] = useState<ChannelKind>('publish')
  const [filter, setFilter] = useState<ChannelFilter>('all')
  const [search, setSearch] = useState('')

  const [statusMap, setStatusMap] = useState<Record<string, ChannelLoginStatus>>({})
  const [checking, setChecking] = useState(false)
  const [openingId, setOpeningId] = useState<PublishChannelId | null>(null)
  const [clearing, setClearing] = useState(false)
  const [initializing, setInitializing] = useState(false)
  const [testingId, setTestingId] = useState<string | null>(null)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detailChannel, setDetailChannel] = useState<PublishChannelMeta | null>(null)

  const [editOpen, setEditOpen] = useState(false)
  const [editMode, setEditMode] = useState<'create' | 'update'>('create')
  /** 弹窗 initialValues；destroyOnHidden 时需在挂载前备好，不能依赖提前 setFieldsValue */
  const [editDraft, setEditDraft] = useState<PublishChannelUpsertInput | null>(null)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm<PublishChannelUpsertInput>()
  const editKind = Form.useWatch('kind', form) as ChannelKind | undefined
  const editChannelId = Form.useWatch('id', form) as string | undefined
  const editFeishuMsgType = Form.useWatch(['notifyConfig', 'feishuMsgType'], form) as
    | FeishuNotifyMsgType
    | undefined

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  // 为什么：不在进入页面时自动检测（会启浏览器、耗时长）；仅由「检测登录态」按钮触发
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

  const tabChannels = useMemo(
    () => channels.filter((c) => normalizeChannelKind(c.kind) === kindTab),
    [channels, kindTab]
  )

  const enabledCount = useMemo(
    () => tabChannels.filter((c) => c.enabled).length,
    [tabChannels]
  )
  const loggedInCount = useMemo(
    () =>
      tabChannels.filter((c) => statusMap[c.id]?.state === 'logged_in').length,
    [tabChannels, statusMap]
  )
  const configuredNotifyCount = useMemo(
    () => tabChannels.filter((c) => isNotifyChannelConfigured(c)).length,
    [tabChannels]
  )

  const filtered = useMemo(() => {
    let list = tabChannels
    if (filter === 'enabled') list = list.filter((c) => c.enabled)
    if (filter === 'reserved') list = list.filter((c) => !c.enabled)
    return list.filter((c) => matchChannelQuery(c, search))
  }, [tabChannels, filter, search])

  useEffect(() => {
    if (!detailChannel) return
    const next = channels.find((c) => c.id === detailChannel.id)
    if (next) setDetailChannel(next)
  }, [channels, detailChannel?.id])

  const openCreate = (): void => {
    const draft = createEmptyChannel(kindTab)
    setEditMode('create')
    setEditDraft(draft)
    setEditOpen(true)
  }

  const openEdit = (channel: PublishChannelMeta): void => {
    const draft = channelMetaToInput(channel)
    // 打开编辑时，将旧版/空白的飞书补充说明升级为当前通知类型对应的模板
    if (channel.id === 'feishu' || channel.id.endsWith('_feishu')) {
      const msgType = normalizeFeishuMsgType(draft.notifyConfig?.feishuMsgType) ?? 'post'
      if (queryShouldRefreshFeishuAgentHint(draft.agentHint, channel.id)) {
        draft.agentHint = queryFeishuNotifyAgentHint({
          channelId: channel.id,
          feishuMsgType: msgType
        })
      }
    } else if (channel.id === 'webhook' && !draft.agentHint.trim()) {
      draft.agentHint = queryWebhookNotifyAgentHint(channel.id)
    }
    setEditMode('update')
    setEditDraft(draft)
    setEditOpen(true)
  }

  const openDetail = (channel: PublishChannelMeta): void => {
    setDetailChannel(channel)
    setDetailOpen(true)
  }

  const handleSave = async (): Promise<void> => {
    setSaving(true)
    try {
      const values = await form.validateFields()
      const kind = normalizeChannelKind(values.kind ?? editDraft?.kind ?? kindTab)
      // 编辑态 id 不可改：优先表单值，其次打开时的 draft
      const rawId =
        editMode === 'update'
          ? (values.id || editDraft?.id || '')
          : values.id || values.label || ''
      const normalizedId =
        editMode === 'create' ? slugifyChannelId(String(rawId)) : String(rawId).trim()
      if (!isValidChannelId(normalizedId)) {
        message.error('渠道 id 仅允许小写字母、数字、连字符和下划线')
        return Promise.reject(new Error('validation'))
      }
      // 为什么：飞书/通用 Webhook 必须有 URL；缺省会导致「保存成功但测试发送失败」
      const webhookUrl = values.notifyConfig?.webhookUrl?.trim()
      if (
        kind === 'notify' &&
        (normalizedId === 'feishu' || normalizedId === 'webhook') &&
        !webhookUrl
      ) {
        message.error('请填写 Webhook URL')
        return Promise.reject(new Error('validation'))
      }
      await saveChannel({
        ...values,
        id: normalizedId,
        kind,
        label: (values.label ?? '').trim(),
        description: (values.description ?? '').trim(),
        publishTool: values.publishTool?.trim() || undefined,
        notifyTool: values.notifyTool?.trim() || (kind === 'notify' ? 'notify_message' : undefined),
        notifyConfig:
          kind === 'notify'
            ? {
                webhookUrl: webhookUrl || undefined,
                secret: values.notifyConfig?.secret?.trim() || undefined,
                feishuMsgType:
                  normalizedId === 'feishu'
                    ? normalizeFeishuMsgType(values.notifyConfig?.feishuMsgType) ?? 'post'
                    : undefined,
                feishuImageKey:
                  normalizedId === 'feishu'
                    ? values.notifyConfig?.feishuImageKey?.trim() || undefined
                    : undefined,
                feishuShareChatId:
                  normalizedId === 'feishu'
                    ? values.notifyConfig?.feishuShareChatId?.trim() || undefined
                    : undefined
              }
            : undefined,
        loginCheckUrl: values.loginCheckUrl?.trim() || undefined,
        humanized: kind === 'publish' ? Boolean(values.humanized) : undefined,
        sdkConfig:
          kind === 'publish'
            ? {
                appId: values.sdkConfig?.appId?.trim() || '',
                accessToken: values.sdkConfig?.accessToken?.trim() || ''
              }
            : undefined,
        agentHint: (values.agentHint ?? '').trim(),
        titleMaxLength: values.titleMaxLength ?? undefined,
        enabled: values.enabled ?? true
      })
      message.success(editMode === 'create' ? '渠道已创建' : '渠道已更新')
      setEditOpen(false)
      setEditDraft(null)
    } catch (err) {
      // Ant Design 校验失败是普通对象，不是 Error，静默拦截避免抽屉内 uncaught
      if (err instanceof Error && err.message && err.message !== 'validation') {
        message.error(err.message)
      }
      return Promise.reject(err instanceof Error ? err : new Error('validation'))
    } finally {
      setSaving(false)
    }
  }

  /** 关闭新建/编辑抽屉；保存中禁止关闭以防中断写入 */
  const closeEditDrawer = (): void => {
    if (saving) return
    setEditOpen(false)
    setEditDraft(null)
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
      message.success('已初始化内置渠道（含飞书等通知渠道）')
      void refreshStatuses()
    } catch (err) {
      message.error(err instanceof Error ? err.message : '初始化失败')
    } finally {
      setInitializing(false)
    }
  }

  const handleTestNotify = async (channelId: string): Promise<void> => {
    setTestingId(channelId)
    try {
      const result = await postNotifyChannelTest(channelId)
      if (result.ok) {
        message.success('测试消息已发送，请到飞书群查看')
      } else {
        message.error(result.error)
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : '测试发送失败')
    } finally {
      setTestingId(null)
    }
  }

  const detailStatus = detailChannel ? statusMap[detailChannel.id] : undefined
  const detailIsNotify = detailChannel
    ? normalizeChannelKind(detailChannel.kind) === 'notify'
    : false
  const detailVisual = detailChannel ? channelVisual(detailChannel.id) : null
  // 为什么：弹窗刚挂载时 useWatch 可能尚未就绪，优先用 editDraft.kind，避免误判为发布渠道而卸掉 Webhook 表单项
  const formIsNotify =
    normalizeChannelKind(editKind ?? editDraft?.kind ?? kindTab) === 'notify'
  const formIsFeishu =
    (editChannelId || editDraft?.id || '').trim() === 'feishu'

  /** 飞书通知类型变更时，若补充说明仍为旧版/自动生成文案，则同步更新 */
  const syncFeishuAgentHintIfNeeded = (msgType: FeishuNotifyMsgType): void => {
    const channelId = (form.getFieldValue('id') || editDraft?.id || 'feishu').trim()
    const current = String(form.getFieldValue('agentHint') ?? '').trim()
    if (!queryShouldRefreshFeishuAgentHint(current, channelId)) return
    form.setFieldValue(
      'agentHint',
      queryFeishuNotifyAgentHint({ channelId, feishuMsgType: msgType })
    )
  }

  /** 新建自定义飞书渠道时，按 id 与通知类型预填 Agent 说明 */
  const syncNotifyAgentHintOnCreate = (): void => {
    if (editMode !== 'create') return
    const kind = normalizeChannelKind(form.getFieldValue('kind') ?? editDraft?.kind ?? kindTab)
    if (kind !== 'notify') return
    const channelId = String(form.getFieldValue('id') ?? '').trim()
    const current = String(form.getFieldValue('agentHint') ?? '').trim()
    if (current && !queryShouldRefreshFeishuAgentHint(current, channelId)) return

    if (channelId === 'feishu' || channelId.endsWith('_feishu')) {
      const msgType =
        normalizeFeishuMsgType(form.getFieldValue(['notifyConfig', 'feishuMsgType'])) ?? 'post'
      form.setFieldValue(
        'agentHint',
        queryFeishuNotifyAgentHint({ channelId: channelId || 'feishu', feishuMsgType: msgType })
      )
    } else if (channelId === 'webhook' || channelId.endsWith('_webhook')) {
      form.setFieldValue('agentHint', queryWebhookNotifyAgentHint(channelId || 'webhook'))
    }
  }

  return (
    <FeaturePageShell>
      <FeaturePageHeader
        icon={<ApiOutlined />}
        title="渠道"
        badge={channels.length}
        description={
          kindTab === 'publish'
            ? `发布 · 已接入 ${enabledCount} · 已登录 ${loggedInCount}；共用本机浏览器 Profile`
            : `通知 · 已接入 ${enabledCount} · 已配置 ${configuredNotifyCount}；Webhook 仅存本机`
        }
        extra={
          <Space wrap>
            <Popconfirm
              title="初始化内置渠道？"
              description="将恢复小红书、抖音、视频号、飞书等为默认配置，自定义渠道不受影响。"
              onConfirm={() => void handleInitBuiltin()}
              okText="初始化"
              cancelText="取消"
            >
              <Button loading={initializing}>初始化内置</Button>
            </Popconfirm>
            {kindTab === 'publish' ? (
              <Button
                icon={<ReloadOutlined />}
                loading={checking}
                onClick={() => void refreshStatuses()}
              >
                检测登录态
              </Button>
            ) : null}
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              新增
            </Button>
          </Space>
        }
      />

      <FeaturePageToolbar>
        <Segmented
          value={kindTab}
          onChange={(v) => {
            setKindTab(v as ChannelKind)
            setFilter('all')
            setSearch('')
          }}
          options={[
            { label: '发布渠道', value: 'publish' },
            { label: '通知渠道', value: 'notify' }
          ]}
        />
        <Segmented
          value={filter}
          onChange={(v) => setFilter(v as ChannelFilter)}
          options={[
            { label: '全部', value: 'all' },
            { label: '已接入', value: 'enabled' },
            { label: '预留', value: 'reserved' }
          ]}
        />
        <div className={shellStyles.toolbarRight}>
          <span className={shellStyles.resultCount}>{filtered.length} 项</span>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索渠道..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </FeaturePageToolbar>

      <FeatureScrollBody>
        <Spin spinning={(channelsLoading || checking) && channels.length === 0}>
          {filtered.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={tabChannels.length === 0 ? '暂无渠道' : '暂无匹配的渠道'}
              className={styles.empty}
            >
              {tabChannels.length === 0 ? (
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                  新增渠道
                </Button>
              ) : null}
            </Empty>
          ) : (
            <div className={styles.grid}>
              {filtered.map((channel, index) => {
                const isNotify = normalizeChannelKind(channel.kind) === 'notify'
                const status = statusMap[channel.id]
                const visual = channelVisual(channel.id)
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
                        <span
                          className={`${styles.cardAvatar} ${visual.toneClass}`}
                          aria-hidden
                        >
                          {visual.icon}
                        </span>
                        <span className={styles.cardTitle}>{channel.label}</span>
                        {isNotify ? (
                          renderNotifyConfigTag(channel)
                        ) : channel.enabled ? (
                          <Tag className={styles.tagActive}>已接入</Tag>
                        ) : (
                          <Tag className={styles.tagMuted}>预留</Tag>
                        )}
                      </div>
                      <p className={styles.cardDesc}>
                        {channel.description?.trim() || '暂无描述，点击查看配置。'}
                      </p>
                    </div>
                    <div className={styles.cardFooter}>
                      <span className={styles.cardAuthor}>
                        {channel.isBuiltin ? '@平台' : '@你'}
                      </span>
                      <span className={styles.cardUsage}>
                        {isNotify
                          ? notifyFooterLabel(channel)
                          : loginFooterLabel(status?.state)}
                      </span>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </Spin>

        {/* 底部说明：样式对齐技能详情 description 条，替代默认 Alert */}
        {kindTab === 'publish' ? (
          <aside className={styles.tipPanel}>
            <div className={styles.tipTitle}>浏览器登录态</div>
            <p className={styles.tipText}>
              各发布渠道共用同一个 Playwright 浏览器 Profile。若登录异常或 Cookie
              冲突，可清除后重新扫码。
            </p>
            <Popconfirm
              title="确定清除全部渠道登录态？"
              description="将删除本机 browser-profile 目录，所有渠道需重新登录。"
              onConfirm={() => void handleClearProfile()}
              okText="清除"
              cancelText="取消"
              okButtonProps={{ danger: true }}
            >
              <Button danger size="small" loading={clearing}>
                清除全部登录态
              </Button>
            </Popconfirm>
          </aside>
        ) : (
          <aside className={styles.tipPanel}>
            <div className={styles.tipTitle}>通知渠道</div>
            <p className={styles.tipText}>
              飞书使用自定义机器人 Webhook；Webhook 与签名密钥仅保存在本机，不会发给 Agent。
            </p>
          </aside>
        )}
      </FeatureScrollBody>

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
              <div className={styles.detailIdentity}>
                {detailVisual ? (
                  <span
                    className={`${styles.detailAvatar} ${detailVisual.toneClass}`}
                    aria-hidden
                  >
                    {detailVisual.icon}
                  </span>
                ) : null}
                <div>
                  <code className={styles.detailId}>{detailChannel.id}</code>
                  <div className={styles.detailTags}>
                    {detailChannel.isBuiltin ? (
                      <Tag className={styles.tagBuiltin}>内置</Tag>
                    ) : null}
                    <Tag className={detailIsNotify ? styles.tagNotify : styles.tagActive}>
                      {detailIsNotify ? '通知' : '发布'}
                    </Tag>
                    {detailIsNotify
                      ? renderNotifyConfigTag(detailChannel)
                      : detailChannel.enabled
                        ? (
                          <Tag className={styles.tagActive}>已接入</Tag>
                        )
                        : (
                          <Tag className={styles.tagMuted}>预留</Tag>
                        )}
                    {!detailIsNotify ? renderLoginTag(detailStatus?.state) : null}
                  </div>
                </div>
              </div>
              <Space wrap>
                <Button icon={<EditOutlined />} onClick={() => openEdit(detailChannel)}>
                  编辑
                </Button>
                {detailIsNotify && detailChannel.id === 'feishu' ? (
                  <Button
                    icon={<SendOutlined />}
                    loading={testingId === detailChannel.id}
                    onClick={() => void handleTestNotify(detailChannel.id)}
                  >
                    测试发送
                  </Button>
                ) : null}
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
                {!detailIsNotify && detailChannel.enabled ? (
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
                {detailIsNotify ? (
                  <>
                    <div className={styles.metaRow}>
                      <span className={styles.metaLabel}>通知工具</span>
                      <span className={styles.metaValue}>
                        {detailChannel.notifyTool ?? 'notify_message'}
                      </span>
                    </div>
                    <div className={styles.metaRow}>
                      <span className={styles.metaLabel}>Webhook</span>
                      <span className={styles.metaValue}>
                        {detailChannel.notifyConfig?.webhookUrl ? '已配置' : '未配置'}
                      </span>
                    </div>
                    {detailChannel.id === 'feishu' ? (
                      <>
                        <div className={styles.metaRow}>
                          <span className={styles.metaLabel}>通知类型</span>
                          <span className={styles.metaValue}>
                            {FEISHU_MSG_TYPE_LABELS[
                              detailChannel.notifyConfig?.feishuMsgType ?? 'post'
                            ]}
                          </span>
                        </div>
                        {detailChannel.notifyConfig?.feishuMsgType === 'image' ? (
                          <div className={styles.metaRow}>
                            <span className={styles.metaLabel}>image_key</span>
                            <span className={styles.metaValue}>
                              {detailChannel.notifyConfig?.feishuImageKey ? '已配置' : '未配置'}
                            </span>
                          </div>
                        ) : null}
                        {detailChannel.notifyConfig?.feishuMsgType === 'share_chat' ? (
                          <div className={styles.metaRow}>
                            <span className={styles.metaLabel}>share_chat_id</span>
                            <span className={styles.metaValue}>
                              {detailChannel.notifyConfig?.feishuShareChatId
                                ? '已配置'
                                : '未配置'}
                            </span>
                          </div>
                        ) : null}
                      </>
                    ) : null}
                  </>
                ) : (
                  <>
                    <div className={styles.metaRow}>
                      <span className={styles.metaLabel}>发布工具</span>
                      <span className={styles.metaValue}>
                        {detailChannel.publishTool ?? '—'}
                      </span>
                    </div>
                    <div className={styles.metaRow}>
                      <span className={styles.metaLabel}>拟人操作</span>
                      <span className={styles.metaValue}>
                        {detailChannel.humanized ? '已开启（浏览器）' : '已关闭（SDK）'}
                      </span>
                    </div>
                    {detailChannel.titleMaxLength != null ? (
                      <div className={styles.metaRow}>
                        <span className={styles.metaLabel}>标题上限</span>
                        <span className={styles.metaValue}>
                          {detailChannel.titleMaxLength} 字
                        </span>
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
                  </>
                )}
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

      {/* 新建 / 编辑：右侧抽屉（可从详情 Modal 叠开，故抬高 zIndex；对齐技能市场） */}
      <Drawer
        title={editMode === 'create' ? '新增渠道' : '编辑渠道'}
        placement="right"
        width="69vw"
        open={editOpen}
        onClose={closeEditDrawer}
        maskClosable={!saving}
        closable={!saving}
        destroyOnHidden
        zIndex={1200}
        className={styles.editDrawer}
        footer={
          <div className={styles.editDrawerFooter}>
            <Button disabled={saving} onClick={closeEditDrawer}>
              取消
            </Button>
            <Button type="primary" loading={saving} onClick={() => void handleSave()}>
              保存
            </Button>
          </div>
        }
      >
        <Spin spinning={saving} tip="保存中…">
          <Form
            key={editDraft ? `${editMode}-${editDraft.id || 'new'}` : 'closed'}
            form={form}
            layout="vertical"
            preserve={false}
            initialValues={editDraft ?? undefined}
            disabled={saving}
          >
            <Form.Item name="kind" hidden>
              <Input />
            </Form.Item>
            {editMode === 'create' ? (
              <Form.Item
                name="id"
                label="渠道 ID"
                tooltip="留空则根据名称自动生成；仅小写字母、数字、连字符与下划线"
              >
                <Input
                  placeholder={formIsNotify ? '例如 feishu_team' : '例如 bilibili'}
                  onBlur={() => syncNotifyAgentHintOnCreate()}
                />
              </Form.Item>
            ) : (
              <Form.Item name="id" label="渠道 ID">
                <Input disabled />
              </Form.Item>
            )}
            <Form.Item label="类型">
              <Tag className={formIsNotify ? styles.tagNotify : styles.tagActive}>
                {formIsNotify ? '通知渠道' : '发布渠道'}
              </Tag>
              <Text type="secondary" style={{ marginLeft: 8 }}>
                创建后不可修改
              </Text>
            </Form.Item>
            <Form.Item
              name="label"
              label="渠道名称"
              rules={[{ required: true, message: '请输入渠道名称' }]}
            >
              <Input placeholder={formIsNotify ? '例如 飞书运营群' : '例如 B站'} />
            </Form.Item>
            <Form.Item name="description" label="简介">
              <Input.TextArea rows={2} placeholder="渠道页展示的说明" />
            </Form.Item>
            <Form.Item name="enabled" label="已接入" valuePropName="checked">
              <Switch checkedChildren="是" unCheckedChildren="否" />
            </Form.Item>
            {formIsNotify ? (
              <>
                <Form.Item name="notifyTool" label="通知工具名" initialValue="notify_message">
                  <Input disabled />
                </Form.Item>
                <Form.Item
                  name={['notifyConfig', 'webhookUrl']}
                  label="Webhook URL"
                  tooltip="飞书自定义机器人地址；仅本地保存"
                  rules={[
                    {
                      validator: async (_, value) => {
                        const id = String(form.getFieldValue('id') || editDraft?.id || '')
                        const trimmed = String(value ?? '').trim()
                        if (id === 'feishu' && !trimmed) {
                          throw new Error('请填写飞书 Webhook URL')
                        }
                        if (trimmed && !/^https:\/\//i.test(trimmed)) {
                          throw new Error('Webhook 须以 https:// 开头')
                        }
                      }
                    }
                  ]}
                >
                  <Input placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/..." />
                </Form.Item>
                <Form.Item
                  name={['notifyConfig', 'secret']}
                  label="签名密钥"
                  tooltip="若机器人启用了签名校验则填写；若启用了自定义关键词，测试文案需包含该词"
                >
                  <Input.Password placeholder="可选" />
                </Form.Item>
                {formIsFeishu ? (
                  <>
                    <Form.Item
                      name={['notifyConfig', 'feishuMsgType']}
                      label="通知类型"
                      tooltip="对应飞书自定义机器人 msg_type；测试发送将按此类型推送"
                      initialValue="post"
                    >
                      <Select
                        options={(
                          Object.entries(FEISHU_MSG_TYPE_LABELS) as [FeishuNotifyMsgType, string][]
                        ).map(([value, label]) => ({ value, label }))}
                        onChange={(value: FeishuNotifyMsgType) => {
                          syncFeishuAgentHintIfNeeded(value)
                        }}
                      />
                    </Form.Item>
                    {editFeishuMsgType === 'image' ? (
                      <Form.Item
                        name={['notifyConfig', 'feishuImageKey']}
                        label="image_key"
                        tooltip="通过飞书「上传图片」API 获取；测试发送与默认通知将使用此 key"
                      >
                        <Input placeholder="img_xxx" />
                      </Form.Item>
                    ) : null}
                    {editFeishuMsgType === 'share_chat' ? (
                      <Form.Item
                        name={['notifyConfig', 'feishuShareChatId']}
                        label="share_chat_id"
                        tooltip="群 ID；机器人只能分享其所在群的群名片"
                      >
                        <Input placeholder="oc_xxx" />
                      </Form.Item>
                    ) : null}
                  </>
                ) : null}
              </>
            ) : (
              <>
                <Form.Item
                  name="publishTool"
                  label="Agent 发布工具名"
                  rules={[{ required: true, message: '请输入发布工具名' }]}
                  tooltip="snake_case，如 xhs_publish_note；需在后端实现对应工具"
                >
                  <Input placeholder="例如 bilibili_publish_note" />
                </Form.Item>
                <Form.Item
                  name="humanized"
                  label="拟人操作"
                  valuePropName="checked"
                  extra="关闭时走平台 SDK（未接入会提示）；开启后才用有头浏览器拟人发布"
                >
                  <Switch checkedChildren="开" unCheckedChildren="关" />
                </Form.Item>
                <Form.Item name="titleMaxLength" label="标题字数上限">
                  <InputNumber min={1} max={200} placeholder="可选" style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="loginCheckUrl" label="创作者中心地址">
                  <Input placeholder="登录检测与打开登录页时使用，可选" />
                </Form.Item>
                <Form.Item
                  name={['sdkConfig', 'appId']}
                  label="SDK App ID"
                  tooltip="平台开放平台应用 ID；拟人关闭且接入 SDK 后使用"
                >
                  <Input placeholder="可选，SDK 未接入前仅作占位保存" />
                </Form.Item>
                <Form.Item
                  name={['sdkConfig', 'accessToken']}
                  label="SDK Access Token"
                  tooltip="敏感凭证仅存本机；正式接入 SDK 后由主进程读取"
                >
                  <Input.Password placeholder="可选" />
                </Form.Item>
              </>
            )}
            <Form.Item
              name="agentHint"
              label="Agent 补充说明"
              rules={[{ required: true, message: '请填写 Agent 说明' }]}
              extra={
                formIsNotify
                  ? '注入 Agent 工作流 prompt，指导模型如何调用 notify_message；可按业务场景自定义'
                  : '注入 Agent 工作流 prompt，指导模型如何调用发布工具；可按业务场景自定义'
              }
            >
              <Input.TextArea
                rows={6}
                placeholder={
                  formIsNotify
                    ? formIsFeishu
                      ? '将根据「通知类型」自动生成调用说明，也可手动改写'
                      : '通知该渠道时的用法与注意事项'
                    : '发布该渠道时的工具用法与注意事项'
                }
              />
            </Form.Item>
          </Form>
        </Spin>
      </Drawer>
    </FeaturePageShell>
  )
}
