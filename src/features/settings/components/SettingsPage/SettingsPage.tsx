import type { CSSProperties } from 'react'
import { useSettingsStore } from '../../hooks/useSettingsStore'
import { ChannelStatusPanel } from '../ChannelStatusPanel'
import { ModelApiPanel } from '../ModelApiPanel'
import { ModelConnectionsPanel } from '../ModelConnectionsPanel'
import { ToolsPanel } from '../ToolsPanel'
import { AssetsPanel } from '../AssetsPanel'
import cardStyles from '@/components/entity-card'
import {
  FeaturePageShell,
  FeaturePageHeader,
  FeaturePageToolbar,
  FeatureScrollBody,
  shellStyles
} from '@/components/page-shell'
import styles from './SettingsPage.module.css'

const { Text } = Typography

/** 设置分类 Tab — 对齐技能市场 Segmented 信息架构 */
type SettingsTab = 'model' | 'connections' | 'app' | 'channels' | 'tools' | 'assets'

const SETTINGS_TAB_OPTIONS: { label: string; value: SettingsTab }[] = [
  { label: '模型与 API', value: 'model' },
  { label: '多模型连接', value: 'connections' },
  { label: '应用与启动', value: 'app' },
  { label: '渠道状态', value: 'channels' },
  { label: '工具', value: 'tools' },
  { label: '资产', value: 'assets' }
]

export function SettingsPage(): React.ReactElement {
  const settings = useSettingsStore((s) => s.settings)
  const loaded = useSettingsStore((s) => s.loaded)
  const postSettings = useSettingsStore((s) => s.postSettings)
  const [tab, setTab] = useState<SettingsTab>('model')

  const connectionCount = settings.connections?.length ?? 0
  const providerCount =
    3 + (settings.customProviders?.length ?? 0)
  const tabHint =
    tab === 'model'
      ? `${providerCount} 个供应商`
      : tab === 'connections'
        ? `${connectionCount || 1} 条连接`
        : tab === 'app'
          ? '本机启动偏好'
          : tab === 'tools'
            ? 'Agent 工具注册表'
            : tab === 'assets'
              ? 'Agent 产出文件'
              : '发布与通知渠道'

  return (
    <FeaturePageShell>
      <FeaturePageHeader
        icon={<SettingOutlined />}
        title="设置"
        badge="偏好中心"
        badgeVariant="muted"
        description="配置模型服务、运行参数，并管理本机渠道登录状态"
        extra={
          <div className={styles.localBadge}>
            <CheckCircleOutlined />
            <span>敏感信息仅存本机</span>
          </div>
        }
      />

      <FeaturePageToolbar>
        <Segmented
          value={tab}
          onChange={(v) => setTab(v as SettingsTab)}
          options={SETTINGS_TAB_OPTIONS}
        />
        <div className={shellStyles.toolbarRight}>
          <span className={shellStyles.resultCount}>{tabHint}</span>
        </div>
      </FeaturePageToolbar>

      <FeatureScrollBody locked={tab === 'tools' || tab === 'assets'}>
        {tab === 'model' ? <ModelApiPanel key="model" /> : null}

        {tab === 'connections' ? (
          loaded ? (
            <ModelConnectionsPanel key="connections" />
          ) : (
            <div className={styles.formLoading} key="connections-loading">
              <Spin />
              <Text type="secondary">正在加载本机配置…</Text>
            </div>
          )
        ) : null}

        {tab === 'app' ? (
          <div className={cardStyles.grid} key="app">
            <Card variant="borderless" className={cardStyles.card} style={{ '--card-index': 0 } as CSSProperties}>
              <div className={cardStyles.cardHead}>
                <div className={cardStyles.cardIdentity}>
                  <span className={cardStyles.cardIcon}>
                    <PoweroffOutlined />
                  </span>
                  <div className={cardStyles.cardTitleBlock}>
                    <span className={cardStyles.cardTitle}>开机自启</span>
                    <Tag className={cardStyles.primaryTag}>启动</Tag>
                  </div>
                </div>
              </div>
              <p className={cardStyles.cardDescription}>
                登录 macOS / Windows 后自动启动灵犀，便于后台定时任务与渠道保持在线
              </p>
              <div className={cardStyles.cardFooter}>
                <span className={cardStyles.footerHint}>本机偏好 · 即时生效</span>
                <Switch
                  checked={settings.launchAtLogin}
                  disabled={!loaded}
                  onChange={async (checked) => {
                    try {
                      await postSettings({ launchAtLogin: checked })
                      message.success(checked ? '已开启开机自启' : '已关闭开机自启')
                    } catch {
                      message.error('更新开机自启失败，请重试')
                    }
                  }}
                />
              </div>
            </Card>

            <Card variant="borderless" className={cardStyles.card} style={{ '--card-index': 1 } as CSSProperties}>
              <div className={cardStyles.cardHead}>
                <div className={cardStyles.cardIdentity}>
                  <span className={cardStyles.cardIcon}>
                    <RocketOutlined />
                  </span>
                  <div className={cardStyles.cardTitleBlock}>
                    <span className={cardStyles.cardTitle}>运行环境</span>
                    <Tag className={cardStyles.mutedTag}>应用</Tag>
                  </div>
                </div>
              </div>
              <p className={cardStyles.cardDescription}>
                配置与密钥仅写入本机 Electron userData，不参与遥测或云端同步
              </p>
              <div className={cardStyles.cardFooter}>
                <span className={cardStyles.footerHint}>本地优先</span>
                <Tag className={cardStyles.successTag}>已隔离</Tag>
              </div>
            </Card>
          </div>
        ) : null}

        {tab === 'channels' ? <ChannelStatusPanel key="channels" /> : null}

        {tab === 'tools' ? <ToolsPanel key="tools" /> : null}

        {tab === 'assets' ? <AssetsPanel key="assets" /> : null}
      </FeatureScrollBody>
    </FeaturePageShell>
  )
}
