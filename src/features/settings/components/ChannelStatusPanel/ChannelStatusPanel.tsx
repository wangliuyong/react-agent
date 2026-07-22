import type { CSSProperties } from 'react'
import type { ChannelLoginState, ChannelLoginStatus } from '@shared/types'
import {
  isNotifyChannelConfigured,
  normalizeChannelKind,
  type PublishChannelMeta
} from '@shared/publish-channels'
import {
  postBrowserClearProfile,
  postChannelOpenLogin,
  queryChannelLoginStatuses,
  useChannelsStore
} from '@/features/channels'
import cardStyles from '../../styles/settingsCard.module.css'
import styles from './ChannelStatusPanel.module.css'

const { Text, Title } = Typography

type ChannelDisplayState = ChannelLoginState | 'configured' | 'unconfigured'

interface ChannelStateMeta {
  label: string
  tagClass: string
}

/** 将发布登录态与通知配置态归一为同一套展示语义。 */
function queryChannelStateMeta(state: ChannelDisplayState | undefined): ChannelStateMeta {
  switch (state) {
    case 'logged_in':
      return { label: '已登录', tagClass: cardStyles.successTag }
    case 'logged_out':
      return { label: '未登录', tagClass: cardStyles.warningTag }
    case 'configured':
      return { label: '已配置', tagClass: cardStyles.successTag }
    case 'unconfigured':
      return { label: '未配置', tagClass: cardStyles.warningTag }
    case 'error':
      return { label: '检测失败', tagClass: cardStyles.dangerTag }
    case 'unsupported':
      return { label: '即将上线', tagClass: cardStyles.mutedTag }
    default:
      return { label: '未检测', tagClass: cardStyles.mutedTag }
  }
}

/** 通知渠道无需浏览器登录，状态直接由启用情况与本地 Webhook 配置派生。 */
function queryNotifyState(channel: PublishChannelMeta): ChannelDisplayState {
  if (!channel.enabled || channel.id === 'wechat_notify' || channel.id === 'qq_notify') {
    return 'unsupported'
  }
  return isNotifyChannelConfigured(channel) ? 'configured' : 'unconfigured'
}

/** 设置页渠道状态：统一查看发布平台登录态与通知渠道配置情况。 */
export function ChannelStatusPanel(): React.ReactElement {
  const channels = useChannelsStore((state) => state.channels)
  const channelsLoading = useChannelsStore((state) => state.loading)
  const hydrateChannels = useChannelsStore((state) => state.hydrate)

  const [statusMap, setStatusMap] = useState<Record<string, ChannelLoginStatus>>({})
  const [checking, setChecking] = useState(false)
  const [openingId, setOpeningId] = useState<string | null>(null)
  const [clearing, setClearing] = useState(false)
  const [queryError, setQueryError] = useState<string | null>(null)
  const refreshTimerRef = useRef<number | null>(null)

  const refreshStatuses = useCallback(async (): Promise<void> => {
    setChecking(true)
    setQueryError(null)
    try {
      const statuses = await queryChannelLoginStatuses()
      setStatusMap(Object.fromEntries(statuses.map((status) => [status.channelId, status])))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '渠道登录态检测失败'
      setQueryError(errorMessage)
      message.error(errorMessage)
    } finally {
      setChecking(false)
    }
  }, [])

  useEffect(() => {
    // 设置页可能由聊天守卫提前打开；若根组件的渠道初始化尚未完成，在此补充触发。
    if (channels.length === 0 && !channelsLoading) {
      void hydrateChannels()
    }
  }, [channels.length, channelsLoading, hydrateChannels])

  useEffect(
    () => () => {
      if (refreshTimerRef.current != null) {
        window.clearTimeout(refreshTimerRef.current)
      }
    },
    []
  )

  const handleOpenLogin = async (channel: PublishChannelMeta): Promise<void> => {
    setOpeningId(channel.id)
    try {
      await postChannelOpenLogin(channel.id)
      message.success(`已打开${channel.label}登录页，请完成登录`)
      // 给扫码/账号登录留出时间，再读取共享 Profile 中的最新状态。
      refreshTimerRef.current = window.setTimeout(() => {
        void refreshStatuses()
      }, 3000)
    } catch (error) {
      message.error(error instanceof Error ? error.message : '打开登录页失败')
    } finally {
      setOpeningId(null)
    }
  }

  const handleClearProfile = async (): Promise<void> => {
    setClearing(true)
    try {
      await postBrowserClearProfile()
      setStatusMap({})
      message.success('已清除全部发布渠道登录态')
      await refreshStatuses()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '清除登录态失败')
    } finally {
      setClearing(false)
    }
  }

  const publishChannels = channels.filter(
    (channel) => normalizeChannelKind(channel.kind) === 'publish'
  )
  const notifyChannels = channels.filter(
    (channel) => normalizeChannelKind(channel.kind) === 'notify'
  )

  const renderChannelCard = (
    channel: PublishChannelMeta,
    index: number,
    state: ChannelDisplayState | undefined,
    detail?: string
  ): React.ReactElement => {
    const stateMeta = queryChannelStateMeta(state)
    const isPublish = normalizeChannelKind(channel.kind) === 'publish'
    const canOpenLogin = isPublish && channel.enabled && Boolean(channel.loginCheckUrl)

    return (
      <Card
        key={channel.id}
        variant="borderless"
        className={cardStyles.card}
        style={{ '--card-index': index } as CSSProperties}
      >
        <div className={cardStyles.cardHead}>
          <div className={cardStyles.cardIdentity}>
            <span className={cardStyles.cardIcon}>
              {isPublish ? <UploadOutlined /> : <NotificationOutlined />}
            </span>
            <div className={cardStyles.cardTitleBlock}>
              <Text className={cardStyles.cardTitle}>{channel.label}</Text>
              <Text type="secondary" className={cardStyles.cardSubtitle}>
                {isPublish
                  ? channel.humanized
                    ? '发布 · 拟人浏览器'
                    : '发布 · SDK'
                  : '通知渠道'}
              </Text>
            </div>
          </div>
          <Tag className={stateMeta.tagClass}>{stateMeta.label}</Tag>
        </div>

        <p className={cardStyles.cardDescription}>
          {detail || channel.description || '暂无状态说明'}
        </p>

        <div className={cardStyles.cardFooter}>
          <Text type="secondary" className={cardStyles.footerHint}>
            {isPublish
              ? channel.humanized
                ? '拟人模式：Cookie 缓存在本机 Profile'
                : 'SDK 模式：未接入时请开启拟人操作'
              : '凭据仅保存在本机'}
          </Text>
          {canOpenLogin ? (
            <Button
              type="link"
              size="small"
              icon={<LoginOutlined />}
              loading={openingId === channel.id}
              onClick={() => void handleOpenLogin(channel)}
            >
              打开登录页
            </Button>
          ) : null}
        </div>
      </Card>
    )
  }

  return (
    <section className={styles.panel}>
      {/* Tab 内嵌：精简顶栏，操作与技能市场工具条同级密度 */}
      <div className={styles.panelHeader}>
        <div>
          <div className={styles.titleRow}>
            <Title level={5} className={styles.title}>
              渠道登录与配置
            </Title>
            <span className={styles.countBadge}>{channels.length}</span>
          </div>
          <Text type="secondary" className={styles.panelDesc}>
            发布渠道使用共享浏览器 Profile；通知凭据仅保存在本机
          </Text>
        </div>
        <Space wrap>
          <Button
            icon={<ReloadOutlined />}
            loading={checking}
            disabled={channelsLoading}
            onClick={() => void refreshStatuses()}
          >
            重新检测
          </Button>
          <Popconfirm
            title="确定清除全部发布渠道登录态？"
            description="清除后所有发布渠道都需要重新登录。"
            okText="清除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
            onConfirm={() => void handleClearProfile()}
          >
            <Button danger loading={clearing}>
              清除登录态
            </Button>
          </Popconfirm>
        </Space>
      </div>

      {queryError ? (
        <Alert
          type="error"
          showIcon
          message="登录态检测失败"
          description={queryError}
          className={styles.errorAlert}
        />
      ) : null}

      <Spin spinning={channelsLoading || checking}>
        {channels.length === 0 && !channelsLoading ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无渠道配置"
            className={styles.empty}
          />
        ) : (
          <div className={styles.sections}>
            <div>
              <div className={styles.sectionTitle}>
                <span>发布渠道</span>
                <Text type="secondary">{publishChannels.length} 项</Text>
              </div>
              <div className={cardStyles.grid}>
                {publishChannels.map((channel, index) => {
                  const status = statusMap[channel.id]
                  return renderChannelCard(channel, index, status?.state, status?.message)
                })}
              </div>
            </div>

            <div>
              <div className={styles.sectionTitle}>
                <span>通知渠道</span>
                <Text type="secondary">{notifyChannels.length} 项</Text>
              </div>
              <div className={cardStyles.grid}>
                {notifyChannels.map((channel, index) =>
                  renderChannelCard(
                    channel,
                    publishChannels.length + index,
                    queryNotifyState(channel)
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </Spin>
    </section>
  )
}
