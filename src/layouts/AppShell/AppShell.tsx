import {
  ApiOutlined,
  ClockCircleOutlined,
  LogoutOutlined,
  PlusOutlined,
  CloudUploadOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  UnorderedListOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons'
import { Button, Tooltip, Typography } from 'antd'
import type { AppView } from '@/stores/app-store'
import { useAppStore } from '@/stores/app-store'
import { useSessionStore, ChatPage, formatRelativeTime } from '@/features/chat'
import { PublishWorkbench } from '@/features/publish'
import { SettingsPage } from '@/features/settings'
import { SkillsPage } from '@/features/skills'
import styles from './AppShell.module.css'

const { Text } = Typography

const NAV: Array<{ key: AppView; label: string; icon: React.ReactNode; placeholder?: boolean }> = [
  { key: 'skills', label: '技能市场', icon: <ThunderboltOutlined /> },
  { key: 'rules', label: '规则', icon: <UnorderedListOutlined />, placeholder: true },
  { key: 'channels', label: '渠道', icon: <ApiOutlined />, placeholder: true },
  { key: 'publish', label: '发布', icon: <CloudUploadOutlined /> },
  { key: 'schedule', label: '定时任务', icon: <ClockCircleOutlined />, placeholder: true }
]

interface AppShellProps {
  view: AppView
}

export function AppShell({ view }: AppShellProps): React.ReactElement {
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)
  const setView = useAppStore((s) => s.setView)
  const sessions = useSessionStore((s) => s.sessions)
  const activeSessionId = useSessionStore((s) => s.activeSessionId)
  const setActive = useSessionStore((s) => s.setActive)
  const createSession = useSessionStore((s) => s.createSession)

  /** 侧边栏折叠/展开切换按钮，统一放在底部 */
  const collapseToggle = (
    <Tooltip
      title={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
      placement={sidebarCollapsed ? 'right' : 'top'}
    >
      <Button
        className={`app-no-drag ${sidebarCollapsed ? styles.collapsedIconBtn : ''}`}
        type="text"
        icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={toggleSidebar}
      />
    </Tooltip>
  )

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} data-collapsed={sidebarCollapsed}>
        <div className={`${styles.sidebarTop} app-drag`}>
          <div className={`${styles.trafficSpacer} app-no-drag`} />
        </div>

        {sidebarCollapsed ? (
          /* 折叠态：仅展示图标快捷操作，悬停显示 Tooltip */
          <div className={styles.collapsedBody}>
            <Tooltip title="React Agent" placement="right">
              <div className={styles.brandIcon}>R</div>
            </Tooltip>

            <Tooltip title="新对话" placement="right">
              <Button
                type="primary"
                className={styles.collapsedPrimaryBtn}
                icon={<PlusOutlined />}
                onClick={() => void createSession()}
              />
            </Tooltip>

            <nav className={styles.collapsedNav} aria-label="主导航">
              {NAV.map((item) => (
                <Tooltip key={item.key} title={item.label} placement="right">
                  <button
                    type="button"
                    className={styles.collapsedNavItem}
                    data-active={view === item.key}
                    onClick={() => setView(item.key)}
                  >
                    {item.icon}
                  </button>
                </Tooltip>
              ))}
            </nav>

            <div className={styles.collapsedFooter}>
              <Tooltip title="设置" placement="right">
                <Button
                  type="text"
                  className={styles.collapsedIconBtn}
                  icon={<SettingOutlined />}
                  data-active={view === 'settings'}
                  onClick={() => setView('settings')}
                />
              </Tooltip>
              <Tooltip title="退出" placement="right">
                <Button
                  type="text"
                  className={styles.collapsedIconBtn}
                  icon={<LogoutOutlined />}
                  disabled
                />
              </Tooltip>
              {collapseToggle}
            </div>
          </div>
        ) : (
          <>
            <div className={styles.brand}>
              <div className={styles.brandIcon}>R</div>
              <span className={styles.brandName}>React Agent</span>
            </div>

            <div className={styles.newTask}>
              <Button
                block
                type="primary"
                className={styles.newTaskBtn}
                icon={<PlusOutlined />}
                onClick={() => void createSession()}
              >
                新对话
              </Button>
            </div>

            <nav className={styles.nav}>
              {NAV.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={styles.navItem}
                  data-active={view === item.key}
                  onClick={() => setView(item.key)}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>

            <div className={styles.sectionLabel}>
              <span>历史对话</span>
            </div>
            <div className={styles.history}>
              {sessions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={styles.historyItem}
                  data-active={s.id === activeSessionId && view === 'chat'}
                  onClick={() => {
                    setActive(s.id)
                    setView('chat')
                  }}
                >
                  <span className={styles.historyTitle}>{s.title}</span>
                  <span className={styles.historyTime}>{formatRelativeTime(s.updatedAt)}</span>
                </button>
              ))}
            </div>

            <div className={styles.sidebarFooter}>
              <Tooltip title="设置">
                <Button
                  type="text"
                  icon={<SettingOutlined />}
                  onClick={() => setView('settings')}
                />
              </Tooltip>
              <Tooltip title="退出">
                <Button type="text" icon={<LogoutOutlined />} disabled />
              </Tooltip>
              <div className={styles.collapseToggleWrap}>{collapseToggle}</div>
            </div>
          </>
        )}
      </aside>

      <div className={styles.main}>
        <div className={styles.content}>
          {view === 'chat' && <ChatPage />}
          {view === 'publish' && <PublishWorkbench />}
          {view === 'settings' && <SettingsPage />}
          {view === 'skills' && <SkillsPage />}
          {(view === 'rules' ||
            view === 'channels' ||
            view === 'schedule') && (
              <div className={styles.placeholder}>
                <div className={styles.placeholderIcon}>
                  {NAV.find((n) => n.key === view)?.icon}
                </div>
                <Text className={styles.placeholderText}>
                  「{NAV.find((n) => n.key === view)?.label}」功能即将上线
                </Text>
              </div>
            )}
        </div>
      </div>
    </div>
  )
}
