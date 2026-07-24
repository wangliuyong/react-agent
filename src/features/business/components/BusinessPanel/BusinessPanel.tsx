import { useAppStore } from '@/stores/app-store'
import { FeaturePageHeader } from '@/components/page-shell'
import { useBusinessStore } from '../../hooks/useBusinessStore'
import type { ChatMode } from '../../types'
import {
  HistoryConversations,
  type HistoryConversationsHeaderMeta
} from '../HistoryConversations/HistoryConversations'
import styles from './BusinessPanel.module.css'

export function BusinessPanel(): React.ReactElement {
  const setView = useAppStore((s) => s.setView)
  const activeMenu = useBusinessStore((s) => s.activeMenu)
  const [historyHeader, setHistoryHeader] = useState<HistoryConversationsHeaderMeta | null>(null)

  return (
    <div className={styles.panel}>
      <header className={`${styles.header} app-drag`}>
        <div className={styles.headerLeft}>
          {activeMenu === 'history' && historyHeader ? (
            <FeaturePageHeader
              variant="embedded"
              draggable={false}
              icon={<HistoryOutlined />}
              title="历史对话"
              badge={historyHeader.count}
              description="管理全部会话记录，查看工作流 context 与各节点执行上下文"
            />
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
