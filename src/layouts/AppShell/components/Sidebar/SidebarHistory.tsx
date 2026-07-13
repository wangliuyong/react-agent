import { HistoryOutlined } from '@ant-design/icons'
import type { AppView } from '@/stores/app-store'
import { formatRelativeTime } from '@/features/chat'
import { SESSION_TYPE_ICONS } from '../../config/session-type-icons'
import type { SessionHistoryItem } from '../../types'
import styles from './Sidebar.module.css'

interface SidebarHistoryProps {
  items: SessionHistoryItem[]
  activeSessionId: string | null
  activeView: AppView
  onSelect: (sessionId: string) => void
}

/** 历史对话列表，仅展开态展示 */
export function SidebarHistory({
  items,
  activeSessionId,
  activeView,
  onSelect
}: SidebarHistoryProps): React.ReactElement {
  return (
    <>
      <div className={styles.sectionLabel}>
        <span className={styles.sectionLabelText}>
          <HistoryOutlined className={styles.sectionLabelIcon} />
          历史对话
        </span>
      </div>
      <div className={styles.history}>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={styles.historyItem}
            data-active={item.id === activeSessionId && activeView === 'chat'}
            onClick={() => onSelect(item.id)}
          >
            {/* 按会话类型展示不同图标 */}
            <span className={styles.historyIcon}>
              {SESSION_TYPE_ICONS[item.type]}
            </span>
            <span className={styles.historyTitle}>{item.title}</span>
            <span className={styles.historyTime}>{formatRelativeTime(item.updatedAt)}</span>
          </button>
        ))}
      </div>
    </>
  )
}
