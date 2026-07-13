import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Popconfirm,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
  message
} from 'antd'
import {
  ApiOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoginOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  StopOutlined
} from '@ant-design/icons'
import {
  PUBLISH_CHANNELS,
  queryPublishChannelMeta,
  type PublishChannelId
} from '@shared/publish-channels'
import type { ChannelLoginState, ChannelLoginStatus } from '@shared/types'
import {
  postBrowserClearProfile,
  postChannelOpenLogin,
  queryChannelLoginStatuses
} from '../../api'
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

/** 渠道管理：展示发布渠道元数据、登录态检测与 Profile 维护 */
export function ChannelsPage(): React.ReactElement {
  const [statusMap, setStatusMap] = useState<Record<string, ChannelLoginStatus>>({})
  const [checking, setChecking] = useState(false)
  const [openingId, setOpeningId] = useState<PublishChannelId | null>(null)
  const [clearing, setClearing] = useState(false)

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

  useEffect(() => {
    void refreshStatuses()
  }, [refreshStatuses])

  const enabledCount = useMemo(
    () => PUBLISH_CHANNELS.filter((c) => c.enabled).length,
    []
  )

  const loggedInCount = useMemo(
    () =>
      PUBLISH_CHANNELS.filter(
        (c) => c.enabled && statusMap[c.id]?.state === 'logged_in'
      ).length,
    [statusMap]
  )

  const handleOpenLogin = async (channelId: PublishChannelId): Promise<void> => {
    setOpeningId(channelId)
    try {
      await postChannelOpenLogin(channelId)
      message.success(`已打开${queryPublishChannelMeta(channelId).label}创作者中心，请完成登录`)
      // 打开后延迟再检测一次，给用户扫码时间
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
        <Button
          icon={<ReloadOutlined />}
          loading={checking}
          onClick={() => void refreshStatuses()}
        >
          检测全部登录态
        </Button>
      </header>

      <div className={styles.body}>
        <Spin spinning={checking && Object.keys(statusMap).length === 0}>
          <div className={styles.grid}>
            {PUBLISH_CHANNELS.map((channel) => {
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
    </div>
  )
}
