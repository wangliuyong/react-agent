import type { AppView } from '@/stores/app-store'
import { formatRelativeTime } from '@/features/chat'
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
        <span>历史对话</span>
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
            <span className={styles.historyTitle}>{item.title}</span>
            <span className={styles.historyTime}>{formatRelativeTime(item.updatedAt)}</span>
          </button>
        ))}
      </div>
    </>
  )
}
