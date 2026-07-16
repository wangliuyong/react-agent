import { useAppStore } from '@/stores/app-store'
import { useBusinessStore } from '../../hooks/useBusinessStore'
import { BUSINESS_MENUS } from '../../config/business-menu'
import type { ChatMode } from '../../types'
import { HistoryConversations } from '../HistoryConversations/HistoryConversations'
import styles from './BusinessPanel.module.css'

const { Title, Text } = Typography

interface BusinessPanelProps {
  /** 顶栏模式切换回调（切回灵犀助手） */
  onModeChange: (mode: ChatMode) => void
}

/**
 * 业务系统主内容区：顶栏模式切换 + 按左侧 AppShell 菜单渲染内容。
 * 业务菜单已移至 AppShell 最左侧侧边栏，避免重复导航。
 */
export function BusinessPanel({ onModeChange }: BusinessPanelProps): React.ReactElement {
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)
  const chatMode = useBusinessStore((s) => s.chatMode)
  const activeMenu = useBusinessStore((s) => s.activeMenu)

  const activeMenuItem = BUSINESS_MENUS.find((m) => m.key === activeMenu) ?? BUSINESS_MENUS[0]

  return (
    <div className={styles.panel}>
      <header className={`${styles.header} app-drag`}>
        <div className={styles.headerLeft}>
          {sidebarCollapsed ? (
            <Tooltip title="展开侧边栏">
              <Button
                type="text"
                className={`${styles.headerIconBtn} app-no-drag`}
                icon={<MenuUnfoldOutlined />}
                onClick={toggleSidebar}
              />
            </Tooltip>
          ) : null}
          <div className={styles.titleWrap}>
            <Title level={5} className={`${styles.title} app-no-drag`}>
              业务系统
            </Title>
            <Text type="secondary" className={`${styles.subtitle} app-no-drag`}>
              {activeMenuItem.label}
            </Text>
          </div>
        </div>

        <div className={`${styles.headerCenter} app-no-drag`}>
          <Segmented<ChatMode>
            className={styles.modeSwitch}
            options={[
              { label: <span className={styles.modeLabel}>灵犀AI助手</span>, value: 'assistant' },
              { label: <span className={styles.modeLabel}>业务系统</span>, value: 'business' }
            ]}
            value={chatMode}
            onChange={(value) => onModeChange(value)}
          />
        </div>

        <div className={styles.headerRight} />
      </header>

      <main className={styles.content}>
        {activeMenu === 'history' ? <HistoryConversations /> : null}
      </main>
    </div>
  )
}
