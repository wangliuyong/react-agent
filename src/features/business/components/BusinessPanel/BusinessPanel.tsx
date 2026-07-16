import { useAppStore } from '@/stores/app-store'
import { useBusinessStore } from '../../hooks/useBusinessStore'
import { BUSINESS_MENUS } from '../../config/business-menu'
import type { ChatMode } from '../../types'
import { HistoryConversations } from '../HistoryConversations/HistoryConversations'
import styles from './BusinessPanel.module.css'

const { Title, Text } = Typography

/**
 * 业务系统独立页面：顶栏模式切换 + 按 AppShell 左侧菜单渲染内容。
 * 与 ChatPage 平级，由 AppMain view=business 路由；刷新后 view 从 localStorage 恢复。
 */
export function BusinessPanel(): React.ReactElement {
  const setView = useAppStore((s) => s.setView)
  const activeMenu = useBusinessStore((s) => s.activeMenu)

  const activeMenuItem = BUSINESS_MENUS.find((m) => m.key === activeMenu) ?? BUSINESS_MENUS[0]

  return (
    <div className={styles.panel}>
      <header className={`${styles.header} app-drag`}>
        <div className={styles.headerLeft}>
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
            value="business"
            onChange={(value) => {
              if (value === 'assistant') setView('chat')
            }}
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
