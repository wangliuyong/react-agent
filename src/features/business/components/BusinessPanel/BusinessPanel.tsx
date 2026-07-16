import { useAppStore } from '@/stores/app-store'
import { useBusinessStore } from '../../hooks/useBusinessStore'
import type { ChatMode } from '../../types'
import {
  HistoryConversations,
  type HistoryConversationsHeaderMeta
} from '../HistoryConversations/HistoryConversations'
import styles from './BusinessPanel.module.css'

const { Title, Text } = Typography

/**
 * 业务系统独立页面：顶栏模式切换 + 按 AppShell 左侧菜单渲染内容。
 * 与 ChatPage 平级，由 AppMain view=business 路由；刷新后 view 从 localStorage 恢复。
 */
export function BusinessPanel(): React.ReactElement {
  const setView = useAppStore((s) => s.setView)
  const activeMenu = useBusinessStore((s) => s.activeMenu)
  const [historyHeader, setHistoryHeader] = useState<HistoryConversationsHeaderMeta | null>(null)

  return (
    <div className={styles.panel}>
      <header className={`${styles.header} app-drag`}>
        <div className={`${styles.headerLeft} app-no-drag`}>
          {activeMenu === 'history' && historyHeader ? (
            <div className={styles.subPageHeader}>
              <div className={styles.subPageHeaderIcon}>
                <HistoryOutlined />
              </div>
              <div>
                <div className={styles.subPageTitleRow}>
                  <Title level={3} className={styles.subPageTitle}>
                    历史对话
                  </Title>
                  <span className={styles.subPageCountBadge}>{historyHeader.count}</span>
                </div>
                <Text type="secondary" className={styles.subPageDesc}>
                  管理全部会话记录，查看工作流 context 与各节点执行上下文
                </Text>
              </div>
            </div>
          ) : null}
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

        <div className={`${styles.headerRight} app-no-drag`}>
          {activeMenu === 'history' && historyHeader ? (
            <Button
              icon={<ReloadOutlined />}
              loading={historyHeader.refreshing}
              onClick={() => void historyHeader.onRefresh()}
            >
              刷新
            </Button>
          ) : null}
        </div>
      </header>

      <main className={styles.content}>
        {activeMenu === 'history' ? (
          <HistoryConversations onHeaderChange={setHistoryHeader} />
        ) : null}
      </main>
    </div>
  )
}
