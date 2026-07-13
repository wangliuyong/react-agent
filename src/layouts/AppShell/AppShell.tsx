import {
  ApiOutlined,
  ClockCircleOutlined,
  LogoutOutlined,
  PlusOutlined,
  CloudUploadOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  UnorderedListOutlined,
  FolderOutlined,
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

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} data-collapsed={sidebarCollapsed}>
        <div className={`${styles.sidebarTop} app-drag`}>
          <div className={`${styles.trafficSpacer} app-no-drag`} />
          <Button
            className="app-no-drag"
            type="text"
            icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleSidebar}
          />
        </div>

        {!sidebarCollapsed && (
          <>
            <div className={styles.newTask}>
              <Button
                block
                type="default"
                icon={<PlusOutlined />}
                onClick={() => void createSession()}
              >
                新任务
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
              <span>项目</span>
              <PlusOutlined style={{ fontSize: 12, opacity: 0.5 }} />
            </div>
            <div className={styles.folder}>
              <FolderOutlined />
              <span>未选项目</span>
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
              <Text type="secondary">「{NAV.find((n) => n.key === view)?.label}」本期为占位，后续迭代开放。</Text>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
