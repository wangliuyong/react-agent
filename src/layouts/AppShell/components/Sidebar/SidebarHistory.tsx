import type { AppView } from '@/stores/app-store'
import { formatRelativeTime } from '@/features/chat'
import { VirtualList } from '@/components/VirtualList'
import { SESSION_TYPE_ICONS } from '../../config/session-type-icons'
import type { SessionHistoryItem } from '../../types'
import styles from './Sidebar.module.css'

interface SidebarHistoryProps {
  items: SessionHistoryItem[]
  activeSessionId: string | null
  activeView: AppView
  /** 新对话空会话高亮时，历史项不再显示选中态 */
  isFreshChatSession?: boolean
  onSelect: (sessionId: string) => void
  onDelete: (sessionId: string) => void
}

/** 历史项预估高度：单行标题 + 内边距 */
const HISTORY_ITEM_ESTIMATE_SIZE = 44

/** 历史对话列表，仅展开态展示（虚拟滚动） */
export function SidebarHistory({
  items,
  activeSessionId,
  activeView,
  isFreshChatSession = false,
  onSelect,
  onDelete
}: SidebarHistoryProps): React.ReactElement {
  const renderHistoryItem = useCallback(
    (item: SessionHistoryItem) => (
      <div
        className={styles.historyItem}
        data-active={item.id === activeSessionId && activeView === 'chat' && !isFreshChatSession}
      >
        <button
          type="button"
          className={styles.historyMain}
          onClick={() => onSelect(item.id)}
        >
          {/* 执行中展示 loading，否则按会话类型展示图标 */}
          <span className={styles.historyIcon}>
            {item.running ? (
              <LoadingOutlined className={styles.historyIconLoading} spin />
            ) : (
              SESSION_TYPE_ICONS[item.type]
            )}
          </span>
          <span className={styles.historyTitle}>{item.title}</span>
          <span className={styles.historyTime}>{formatRelativeTime(item.updatedAt)}</span>
        </button>
        <Popconfirm
          title="确定删除该对话？"
          description="删除后无法恢复"
          okText="删除"
          cancelText="取消"
          okButtonProps={{ danger: true }}
          onConfirm={() => onDelete(item.id)}
        >
          <Button
            type="text"
            size="small"
            danger
            className={styles.historyDelete}
            icon={<DeleteOutlined />}
            aria-label={`删除对话：${item.title}`}
            onClick={(e) => e.stopPropagation()}
          />
        </Popconfirm>
      </div>
    ),
    [activeSessionId, activeView, isFreshChatSession, onDelete, onSelect]
  )

  return (
    <>
      <div className={styles.sectionLabel}>
        <span className={styles.sectionLabelText}>
          <HistoryOutlined className={styles.sectionLabelIcon} />
          历史对话
        </span>
      </div>
      <VirtualList
        className={styles.history}
        items={items}
        gap={2}
        overscan={10}
        estimateSize={HISTORY_ITEM_ESTIMATE_SIZE}
        getItemKey={(item) => item.id}
        renderItem={renderHistoryItem}
      />
    </>
  )
}
